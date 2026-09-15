import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  Role,
  LostFoundType,
  LostFoundCategory,
  LostFoundStatus,
  ClaimStatus,
  NotificationType,
} from "@prisma/client";
import {
  DEMO_LOST_FOUND_ITEMS,
  DEMO_LOST_FOUND_CLAIMS,
  DEMO_LOST_FOUND_ATTACHMENTS,
  DemoLostFoundItem,
  DemoLostFoundClaim,
  DemoLostFoundAttachment,
  DemoLostFoundMatch,
} from "@/lib/lost-found/demo-lost-found";
import {
  CreateReportInput,
  UpdateReportInput,
  SubmitClaimInput,
  ReviewClaimInput,
  HandoverInput,
  ResolveItemInput,
} from "@/validators/lost-found.schema";
import { NotificationService } from "@/services/notification.service";

const BLOCKED_EXTENSIONS = [
  "exe", "bat", "cmd", "sh", "bash", "ps1", "vbs", "js", "ts",
  "msi", "dll", "com", "scr", "pif", "hta", "cpl", "jar",
];

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export interface LostFoundFilterOptions {
  type?: LostFoundType;
  category?: LostFoundCategory;
  status?: LostFoundStatus;
  location?: string;
  search?: string;
  userId?: string;
  role?: Role | string;
  limit?: number;
  offset?: number;
}

export class LostFoundService {
  // ==========================================
  // AUDIT LOG HELPER
  // ==========================================
  private static async recordAuditLog({
    action,
    entityId,
    userId,
    details,
  }: {
    action: string;
    entityId: string;
    userId?: string;
    details?: Record<string, unknown>;
  }) {
    try {
      if (await isDatabaseOnline()) {
        await prisma.auditLog.create({
          data: {
            action,
            entity: "LostFoundItem",
            entityId,
            userId: userId || null,
            details: details ? JSON.stringify(details) : undefined,
          },
        });
      }
    } catch {
      // Graceful fallback in offline/demo mode
    }
  }

  // ==========================================
  // FILE / IMAGE SECURITY VALIDATOR
  // ==========================================
  static validateUploadedAttachment(
    fileName: string,
    sizeBytes?: number,
    maxSizeBytes = 5242880 // 5MB
  ): { isValid: boolean; sanitizedName: string; extension: string } {
    if (!fileName || fileName.trim().length === 0) {
      throw new Error("File name is missing.");
    }

    // Path traversal check
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      throw new Error("Security Violation: Illegal file name containing path traversal characters.");
    }

    const parts = fileName.split(".");
    if (parts.length < 2) {
      throw new Error("File must have a valid extension.");
    }

    const ext = parts[parts.length - 1].toLowerCase();

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      throw new Error(`Security Violation: Executable and script file extensions (.${ext}) are strictly prohibited.`);
    }

    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      throw new Error(`Invalid file type (.${ext}). Only image formats (.jpg, .jpeg, .png, .webp) are permitted.`);
    }

    if (sizeBytes && sizeBytes > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`File size exceeds maximum permitted limit of ${maxMb}MB.`);
    }

    const sanitizedBase = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sanitizedName = `${Date.now()}_${sanitizedBase}`;

    return { isValid: true, sanitizedName, extension: ext };
  }

  // ==========================================
  // REPORT CRUD & LIFECYCLE
  // ==========================================

  static async getReports(options: LostFoundFilterOptions = {}): Promise<{
    items: DemoLostFoundItem[];
    total: number;
  }> {
    const {
      type,
      category,
      status,
      location,
      search,
      userId,
      role,
      limit = 50,
      offset = 0,
    } = options;

    let list = [...DEMO_LOST_FOUND_ITEMS];

    // Visibility rule: DRAFT reports are only visible to their author or ADMIN
    list = list.filter((item) => {
      if (item.status === LostFoundStatus.DRAFT) {
        if (role === Role.ADMIN) return true;
        if (userId && item.reporterId === userId) return true;
        return false;
      }
      return true;
    });

    // Filters
    if (type) {
      list = list.filter((i) => i.type === type);
    }
    if (category) {
      list = list.filter((i) => i.category === category);
    }
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    if (location && location.trim()) {
      const locQ = location.toLowerCase().trim();
      list = list.filter((i) => i.location.toLowerCase().includes(locQ));
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.referenceNumber.toLowerCase().includes(q) ||
          (i.identifyingDetails && i.identifyingDetails.toLowerCase().includes(q))
      );
    }

    // Sort: newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginated = list.slice(offset, offset + limit);
    return { items: paginated, total: list.length };
  }

  static async getReportById(
    id: string,
    userId?: string,
    role?: Role | string
  ): Promise<{
    item: DemoLostFoundItem;
    claimsCount: number;
    potentialMatches: DemoLostFoundMatch[];
  } | null> {
    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === id || i.referenceNumber === id);
    if (!item) return null;

    // Security check: Draft items visible only to author or Admin
    if (item.status === LostFoundStatus.DRAFT) {
      if (role !== Role.ADMIN && (!userId || item.reporterId !== userId)) {
        return null;
      }
    }

    const claims = DEMO_LOST_FOUND_CLAIMS.filter((c) => c.itemId === item.id);
    const potentialMatches = this.findMatchesForItem(item);

    return {
      item,
      claimsCount: claims.length,
      potentialMatches,
    };
  }

  static async getItemById(
    id: string,
    userId?: string,
    role?: Role | string
  ) {
    return this.getReportById(id, userId, role);
  }

  static async createReport(
    input: CreateReportInput,
    userId: string,
    _role: Role | string = Role.STUDENT
  ): Promise<DemoLostFoundItem> {
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const refRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceNumber = `LF-${year}-${refRandom}`;

    // Resolve user details
    let reporterName = "Campus User";
    let reporterEmail = "user@campussphere.edu";
    try {
      const { ProfileService } = await import("@/services/profile.service");
      const profile = await ProfileService.getProfile(userId);
      if (profile) {
        reporterName = `${profile.firstName} ${profile.lastName}`.trim();
        reporterEmail = profile.email;
      }
    } catch {
      // Fallback
    }

    const newItem: DemoLostFoundItem = {
      id: `lf-${Date.now().toString(36)}`,
      referenceNumber,
      reporterId: userId,
      reporterName,
      reporterEmail,
      type: input.type,
      title: input.title,
      description: input.description,
      category: input.category,
      status: input.status || LostFoundStatus.PUBLISHED,
      location: input.location,
      dateLostFound: input.dateLostFound,
      timeLostFound: input.timeLostFound || null,
      imageUrl: input.imageUrl || null,
      contactPreference: input.contactPreference || "CAMPUS_PORTAL",
      identifyingDetails: input.identifyingDetails || null,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    DEMO_LOST_FOUND_ITEMS.unshift(newItem);

    await this.recordAuditLog({
      action: "CREATE_LOST_FOUND_REPORT",
      entityId: newItem.id,
      userId,
      details: { title: newItem.title, type: newItem.type, ref: newItem.referenceNumber },
    });

    // Notify author
    await NotificationService.sendNotification({
      userId,
      title: `${input.type === LostFoundType.LOST ? "Lost" : "Found"} Item Report Published`,
      message: `Your report for "${newItem.title}" has been registered with Case Ref: ${newItem.referenceNumber}.`,
      type: NotificationType.LOST_FOUND,
      link: `/dashboard/student/lost-found/${newItem.id}`,
    });

    return newItem;
  }

  static async updateReport(
    id: string,
    input: UpdateReportInput,
    userId: string,
    role: Role | string = Role.STUDENT
  ): Promise<DemoLostFoundItem> {
    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === id);
    if (!item) throw new Error("Report not found");

    // Security: Only reporter or ADMIN can update
    if (item.reporterId !== userId && role !== Role.ADMIN) {
      throw new Error("Unauthorized: You do not have permission to modify this report. You can only edit your own reports.");
    }

    // Resolved items are strictly read-only
    if (item.status === LostFoundStatus.RESOLVED || item.status === LostFoundStatus.CLOSED) {
      throw new Error("Resolved or closed reports cannot be modified. Resolved cases are locked into read-only state.");
    }

    if (input.title !== undefined) item.title = input.title;
    if (input.category !== undefined) item.category = input.category;
    if (input.description !== undefined) item.description = input.description;
    if (input.location !== undefined) item.location = input.location;
    if (input.dateLostFound !== undefined) item.dateLostFound = input.dateLostFound;
    if (input.timeLostFound !== undefined) item.timeLostFound = input.timeLostFound;
    if (input.contactPreference !== undefined) item.contactPreference = input.contactPreference;
    if (input.identifyingDetails !== undefined) item.identifyingDetails = input.identifyingDetails;
    if (input.imageUrl !== undefined) item.imageUrl = input.imageUrl;
    if (input.status !== undefined) item.status = input.status;
    item.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "UPDATE_LOST_FOUND_REPORT",
      entityId: item.id,
      userId,
      details: { title: item.title },
    });

    return item;
  }

  static async publishReport(
    id: string,
    userId: string,
    role: Role | string = Role.STUDENT
  ): Promise<DemoLostFoundItem> {
    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === id);
    if (!item) throw new Error("Report not found");

    if (item.reporterId !== userId && role !== Role.ADMIN) {
      throw new Error("Unauthorized: You do not have permission to modify this report. You can only publish your own reports.");
    }

    item.status = LostFoundStatus.PUBLISHED;
    item.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "PUBLISH_LOST_FOUND_REPORT",
      entityId: item.id,
      userId,
      details: { referenceNumber: item.referenceNumber },
    });

    return item;
  }

  static async archiveReport(
    id: string,
    userId: string,
    role: Role | string = Role.STUDENT
  ): Promise<DemoLostFoundItem> {
    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === id);
    if (!item) throw new Error("Report not found");

    if (item.reporterId !== userId && role !== Role.ADMIN) {
      throw new Error("Unauthorized: You do not have permission to modify this report. You can only archive your own reports.");
    }

    item.status = LostFoundStatus.ARCHIVED;
    item.updatedAt = new Date().toISOString();

    await this.recordAuditLog({
      action: "ARCHIVE_LOST_FOUND_REPORT",
      entityId: item.id,
      userId,
    });

    return item;
  }

  static async getMyReports(userId: string): Promise<DemoLostFoundItem[]> {
    return DEMO_LOST_FOUND_ITEMS.filter((i) => i.reporterId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ==========================================
  // DETERMINISTIC POTENTIAL MATCHING ENGINE
  // ==========================================

  static findMatchesForItem(targetItemOrId: DemoLostFoundItem | string): DemoLostFoundMatch[] {
    const targetItem =
      typeof targetItemOrId === "string"
        ? DEMO_LOST_FOUND_ITEMS.find(
            (i) => i.id === targetItemOrId || i.referenceNumber === targetItemOrId
          )
        : targetItemOrId;

    if (!targetItem) return [];

    // Only match opposite types (LOST matches FOUND, and vice-versa)
    const oppositeType =
      targetItem.type === LostFoundType.LOST ? LostFoundType.FOUND : LostFoundType.LOST;

    const candidates = DEMO_LOST_FOUND_ITEMS.filter(
      (candidate) =>
        candidate.id !== targetItem.id &&
        candidate.type === oppositeType &&
        (candidate.status === LostFoundStatus.PUBLISHED ||
          candidate.status === LostFoundStatus.CLAIM_PENDING)
    );

    const matches: DemoLostFoundMatch[] = [];

    const targetWords = this.tokenizeText(
      `${targetItem.title} ${targetItem.description} ${targetItem.identifyingDetails || ""}`
    );
    const targetLocWords = this.tokenizeText(targetItem.location);

    for (const candidate of candidates) {
      let score = 0;
      const factors: string[] = [];

      // 1. Category Similarity (30%)
      if (candidate.category === targetItem.category) {
        score += 30;
        factors.push("Identical category match");
      }

      // 2. Keyword & Title Similarity (20%)
      const candidateWords = this.tokenizeText(
        `${candidate.title} ${candidate.description} ${candidate.identifyingDetails || ""}`
      );
      const commonWords = targetWords.filter((w) => candidateWords.includes(w));
      if (commonWords.length > 0) {
        const keywordScore = Math.min(20, commonWords.length * 7);
        score += keywordScore;
        factors.push(`Keyword overlap (${commonWords.slice(0, 3).join(", ")})`);
      }

      // 3. Location Proximity (20%)
      const candidateLocWords = this.tokenizeText(candidate.location);
      const commonLoc = targetLocWords.filter((w) => candidateLocWords.includes(w));
      if (commonLoc.length > 0) {
        const locScore = Math.min(20, commonLoc.length * 10);
        score += locScore;
        factors.push(`Location proximity (${commonLoc.join(" ")})`);
      }

      // 4. Date Proximity (15%)
      const d1 = new Date(targetItem.dateLostFound).getTime();
      const d2 = new Date(candidate.dateLostFound).getTime();
      const diffDays = Math.abs(d1 - d2) / (1000 * 3600 * 24);

      if (diffDays <= 1) {
        score += 15;
        factors.push("Occurred within 24-48 hours");
      } else if (diffDays <= 3) {
        score += 12;
        factors.push("Occurred within 3 days");
      } else if (diffDays <= 7) {
        score += 8;
        factors.push("Occurred within 1 week");
      } else if (diffDays <= 14) {
        score += 4;
      }

      // 5. Brand & Color Attributes (15%)
      const attributeKeywords = [
        "blue", "black", "red", "silver", "white", "brown", "grey", "gray",
        "apple", "sony", "casio", "hydro", "flask", "nike", "fitbit", "logitech",
        "leather", "polaroid", "rayban", "ray-ban", "sandisk",
      ];
      const matchedAttrs = attributeKeywords.filter(
        (kw) => targetWords.includes(kw) && candidateWords.includes(kw)
      );
      if (matchedAttrs.length > 0) {
        score += Math.min(15, matchedAttrs.length * 8);
        factors.push(`Distinctive brand/color match (${matchedAttrs.join(", ")})`);
      }

      // Filter: only return candidates with at least 35% similarity
      if (score >= 35) {
        const boundedScore = Math.min(100, Math.round(score));
        matches.push({
          id: `match-${targetItem.id}-${candidate.id}`,
          lostItemId: targetItem.type === LostFoundType.LOST ? targetItem.id : candidate.id,
          foundItemId: targetItem.type === LostFoundType.FOUND ? targetItem.id : candidate.id,
          matchScore: boundedScore,
          matchingFactors: factors,
          status: "SUGGESTED",
          createdAt: new Date().toISOString(),
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches;
  }

  private static tokenizeText(text?: string | null): string[] {
    if (!text || typeof text !== "string") return [];
    const stopwords = new Set([
      "a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or", "is",
      "with", "my", "left", "found", "lost", "near", "desk", "room", "floor",
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopwords.has(w));
  }

  // ==========================================
  // CLAIMS WORKFLOW & VERIFICATION
  // ==========================================

  static async submitClaim(
    arg1: string | (SubmitClaimInput & { itemId: string }),
    arg2?: SubmitClaimInput | string,
    arg3?: string
  ): Promise<DemoLostFoundClaim> {
    let itemId: string;
    let input: SubmitClaimInput;
    let claimantUserId: string;

    if (typeof arg1 === "string") {
      itemId = arg1;
      input = arg2 as SubmitClaimInput;
      claimantUserId = arg3 as string;
    } else {
      itemId = arg1.itemId;
      input = arg1;
      claimantUserId = arg2 as string;
    }

    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === itemId);
    if (!item) throw new Error("Report not found");

    // Only published or claim-pending items can receive claims
    if (item.status === LostFoundStatus.RESOLVED || item.status === LostFoundStatus.CLOSED) {
      throw new Error("Claims can only be submitted on published items. This item has already been resolved or closed.");
    }
    if (item.status === LostFoundStatus.DRAFT) {
      throw new Error("Claims can only be submitted on published items.");
    }
    if (item.status === LostFoundStatus.ARCHIVED || item.status === LostFoundStatus.REJECTED) {
      throw new Error("Claims can only be submitted on active items.");
    }

    // Ownership check: reporter cannot claim their own reported item
    if (item.reporterId === claimantUserId) {
      throw new Error("You cannot submit a claim on your own report");
    }

    // Duplicate active claim check
    const existingActiveClaim = DEMO_LOST_FOUND_CLAIMS.find(
      (c) =>
        c.itemId === itemId &&
        c.claimantId === claimantUserId &&
        c.status !== ClaimStatus.REJECTED &&
        c.status !== ClaimStatus.WITHDRAWN
    );

    if (existingActiveClaim) {
      throw new Error("You have already submitted an active claim for this item");
    }

    // Resolve claimant details
    let claimantName = "Campus Student";
    let claimantEmail = "student@campussphere.edu";
    let claimantRoll = "CS-2024-001";

    try {
      const { ProfileService } = await import("@/services/profile.service");
      const profile = await ProfileService.getProfile(claimantUserId);
      if (profile) {
        claimantName = `${profile.firstName} ${profile.lastName}`.trim();
        claimantEmail = profile.email;
        if (profile.student) {
          claimantRoll = profile.student.rollNumber || claimantRoll;
        }
      }
    } catch {
      // Fallback
    }

    const now = new Date().toISOString();
    const newClaim: DemoLostFoundClaim = {
      id: `claim-${Date.now().toString(36)}`,
      itemId: item.id,
      claimantId: claimantUserId,
      claimantName,
      claimantEmail,
      claimantRoll,
      claimStatement: input.claimStatement,
      verificationAnswers: input.verificationAnswers,
      status: ClaimStatus.PENDING,
      submittedAt: now,
      reviewedAt: null,
      reviewedBy: null,
      reviewerRemarks: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    DEMO_LOST_FOUND_CLAIMS.unshift(newClaim);

    // Update item status to CLAIM_PENDING if it was PUBLISHED
    if (item.status === LostFoundStatus.PUBLISHED) {
      item.status = LostFoundStatus.CLAIM_PENDING;
      item.updatedAt = now;
    }

    await this.recordAuditLog({
      action: "SUBMIT_LOST_FOUND_CLAIM",
      entityId: item.id,
      userId: claimantUserId,
      details: { claimId: newClaim.id, itemTitle: item.title },
    });

    // Notify item reporter
    await NotificationService.sendNotification({
      userId: item.reporterId,
      title: "New Claim Submitted on Your Report",
      message: `A community member has submitted an ownership claim on "${item.title}". Campus staff is reviewing the verification details.`,
      type: NotificationType.LOST_FOUND,
      link: `/dashboard/student/lost-found/${item.id}`,
    });

    return newClaim;
  }

  static async getClaims(options: {
    userId?: string;
    role?: Role | string;
    itemId?: string;
    status?: ClaimStatus;
  }): Promise<DemoLostFoundClaim[]> {
    let list = [...DEMO_LOST_FOUND_CLAIMS];

    if (options.itemId) {
      list = list.filter((c) => c.itemId === options.itemId);
    }
    if (options.status) {
      list = list.filter((c) => c.status === options.status);
    }

    // Role-scoping: Students only see their own claims unless filtering by item they own
    if (options.role === Role.STUDENT && options.userId) {
      if (options.itemId) {
        const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === options.itemId);
        if (item && item.reporterId !== options.userId) {
          list = list.filter((c) => c.claimantId === options.userId);
        }
      } else {
        list = list.filter((c) => c.claimantId === options.userId);
      }
    }

    list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return list;
  }

  static async getClaimById(
    claimId: string,
    userId: string,
    role: Role | string = Role.STUDENT
  ): Promise<DemoLostFoundClaim | null> {
    const claim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.id === claimId);
    if (!claim) return null;

    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === claim.itemId);

    // Security: Only claimant, item reporter, or Admin can view private claim details
    if (role !== Role.ADMIN && claim.claimantId !== userId && item?.reporterId !== userId) {
      return null;
    }

    return claim;
  }

  static async reviewClaim(
    claimId: string,
    input: ReviewClaimInput,
    reviewerUserId: string,
    role: Role | string = Role.ADMIN
  ): Promise<DemoLostFoundClaim> {
    if (role !== Role.ADMIN) {
      throw new Error("Forbidden: Only campus administrators and designated moderators can review claims");
    }

    const claim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.id === claimId);
    if (!claim) throw new Error("Claim not found");

    // Prevent self-approval if admin submitted claim
    if (claim.claimantId === reviewerUserId) {
      throw new Error("Forbidden: Self-approval of claims is strictly prohibited");
    }

    const now = new Date().toISOString();
    claim.status = input.status;
    claim.reviewedAt = now;
    claim.reviewedBy = reviewerUserId;
    claim.reviewerRemarks = input.reviewerRemarks || null;
    claim.updatedAt = now;

    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === claim.itemId);
    if (item) {
      if (input.status === ClaimStatus.VERIFIED || input.status === ClaimStatus.APPROVED) {
        item.status = LostFoundStatus.VERIFICATION;
        item.updatedAt = now;
      } else if (input.status === ClaimStatus.REJECTED) {
        // If all claims rejected, restore to PUBLISHED
        const otherActiveClaims = DEMO_LOST_FOUND_CLAIMS.filter(
          (c) => c.itemId === item.id && c.id !== claim.id && c.status === ClaimStatus.PENDING
        );
        if (otherActiveClaims.length === 0) {
          item.status = LostFoundStatus.PUBLISHED;
          item.updatedAt = now;
        }
      }
    }

    await this.recordAuditLog({
      action: "REVIEW_LOST_FOUND_CLAIM",
      entityId: claim.itemId,
      userId: reviewerUserId,
      details: { claimId: claim.id, newStatus: claim.status, remarks: input.reviewerRemarks },
    });

    // Notify claimant of status change
    await NotificationService.sendNotification({
      userId: claim.claimantId,
      title: `Claim ${claim.status === ClaimStatus.VERIFIED ? "Verified" : "Updated"}`,
      message: `Your claim on "${item?.title || "item"}" has been marked as ${claim.status}. ${input.reviewerRemarks ? `Remarks: ${input.reviewerRemarks}` : ""}`,
      type: NotificationType.LOST_FOUND,
      link: `/dashboard/student/lost-found/claims`,
    });

    return claim;
  }

  static async withdrawClaim(
    claimId: string,
    claimantUserId: string,
    _role: Role | string = Role.STUDENT
  ): Promise<DemoLostFoundClaim> {
    const claim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.id === claimId);
    if (!claim) throw new Error("Claim not found");

    if (claim.claimantId !== claimantUserId) {
      throw new Error("Unauthorized: You can only withdraw your own claims");
    }

    if (claim.status === ClaimStatus.COMPLETED || claim.status === ClaimStatus.VERIFIED) {
      throw new Error("Only pending or under-review claims can be withdrawn. Verified or completed claims cannot be withdrawn.");
    }

    claim.status = ClaimStatus.WITHDRAWN;
    claim.updatedAt = new Date().toISOString();

    return claim;
  }

  static async completeHandover(
    itemId: string,
    input: HandoverInput,
    userId: string,
    role: Role | string = Role.ADMIN
  ): Promise<{ item: DemoLostFoundItem; claim: DemoLostFoundClaim }> {
    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === itemId);
    if (!item) throw new Error("Report not found");

    // Only Admin or Reporter can complete handover
    if (role !== Role.ADMIN && item.reporterId !== userId) {
      throw new Error("Forbidden: Only administrators or the item reporter can confirm handover");
    }

    const claim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.id === input.claimId);
    if (!claim) throw new Error("Claim not found");

    const now = new Date().toISOString();

    claim.status = ClaimStatus.COMPLETED;
    claim.resolvedAt = now;
    claim.updatedAt = now;

    item.status = LostFoundStatus.RESOLVED;
    item.resolvedAt = now;
    item.resolvedBy = userId;
    item.resolutionNotes = input.handoverNotes || "Handover completed and verified.";
    item.updatedAt = now;

    await this.recordAuditLog({
      action: "COMPLETE_LOST_FOUND_HANDOVER",
      entityId: item.id,
      userId,
      details: { claimId: claim.id, recipientId: claim.claimantId },
    });

    // Notify claimant
    await NotificationService.sendNotification({
      userId: claim.claimantId,
      title: "Item Handover Completed",
      message: `Your claim on "${item.title}" has been completed and the item is marked as handed over. Thank you!`,
      type: NotificationType.LOST_FOUND,
      link: `/dashboard/student/lost-found/${item.id}`,
    });

    return { item, claim };
  }

  static async resolveItem(
    itemId: string,
    input: ResolveItemInput,
    userId: string,
    role: Role | string = Role.ADMIN
  ): Promise<DemoLostFoundItem> {
    const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === itemId);
    if (!item) throw new Error("Report not found");

    if (role !== Role.ADMIN && item.reporterId !== userId) {
      throw new Error("Forbidden: Only administrators or the item reporter can resolve this case");
    }

    const now = new Date().toISOString();
    item.status = LostFoundStatus.RESOLVED;
    item.resolvedAt = now;
    item.resolvedBy = userId;
    item.resolutionNotes = input.resolutionNotes || "Marked resolved by campus authority.";
    item.updatedAt = now;

    await this.recordAuditLog({
      action: "RESOLVE_LOST_FOUND_ITEM",
      entityId: item.id,
      userId,
      details: { resolutionNotes: item.resolutionNotes },
    });

    return item;
  }

  // ==========================================
  // INSTITUTIONAL & STUDENT ANALYTICS
  // ==========================================

  static async getAnalytics(
    arg1: Role | string = Role.STUDENT,
    arg2?: string | Role
  ): Promise<Record<string, unknown>> {
    let userRole: Role | string = Role.STUDENT;
    let userId: string | undefined;

    if (Object.values(Role).includes(arg1 as Role)) {
      userRole = arg1;
      userId = typeof arg2 === "string" ? arg2 : undefined;
    } else {
      userId = arg1;
      userRole = typeof arg2 === "string" ? (arg2 as Role) : Role.STUDENT;
    }

    const totalReports = DEMO_LOST_FOUND_ITEMS.length;
    const lostCount = DEMO_LOST_FOUND_ITEMS.filter((i) => i.type === LostFoundType.LOST).length;
    const foundCount = DEMO_LOST_FOUND_ITEMS.filter((i) => i.type === LostFoundType.FOUND).length;
    const resolvedCount = DEMO_LOST_FOUND_ITEMS.filter((i) => i.status === LostFoundStatus.RESOLVED).length;
    const openCases = DEMO_LOST_FOUND_ITEMS.filter(
      (i) => i.status === LostFoundStatus.PUBLISHED || i.status === LostFoundStatus.CLAIM_PENDING
    ).length;

    const totalClaims = DEMO_LOST_FOUND_CLAIMS.length;
    const pendingClaims = DEMO_LOST_FOUND_CLAIMS.filter((c) => c.status === ClaimStatus.PENDING).length;
    const verifiedClaims = DEMO_LOST_FOUND_CLAIMS.filter(
      (c) => c.status === ClaimStatus.VERIFIED || c.status === ClaimStatus.COMPLETED
    ).length;

    const recoveryRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

    // Category breakdown
    const categoryBreakdownMap: Record<string, number> = {};
    for (const item of DEMO_LOST_FOUND_ITEMS) {
      categoryBreakdownMap[item.category] = (categoryBreakdownMap[item.category] || 0) + 1;
    }

    const categoryBreakdown = Object.entries(categoryBreakdownMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Location hotspots
    const locationHotspotsMap: Record<string, number> = {};
    for (const item of DEMO_LOST_FOUND_ITEMS) {
      locationHotspotsMap[item.location] = (locationHotspotsMap[item.location] || 0) + 1;
    }

    const topLocations = Object.entries(locationHotspotsMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    // Student personal stats if requested by student
    let studentStats = null;
    if (userId) {
      const myReports = DEMO_LOST_FOUND_ITEMS.filter((i) => i.reporterId === userId);
      const myClaims = DEMO_LOST_FOUND_CLAIMS.filter((c) => c.claimantId === userId);

      studentStats = {
        totalReports: myReports.length,
        activeReports: myReports.filter(
          (r) => r.status === LostFoundStatus.PUBLISHED || r.status === LostFoundStatus.CLAIM_PENDING
        ).length,
        resolvedReports: myReports.filter((r) => r.status === LostFoundStatus.RESOLVED).length,
        claimsSubmitted: myClaims.length,
        claimsVerified: myClaims.filter(
          (c) => c.status === ClaimStatus.VERIFIED || c.status === ClaimStatus.COMPLETED
        ).length,
      };
    }

    return {
      type: userRole === Role.ADMIN ? "ADMIN_ANALYTICS" : "COMMUNITY_ANALYTICS",
      totalReports,
      lostCount,
      lostReports: lostCount,
      foundCount,
      foundReports: foundCount,
      resolvedCount,
      openCases,
      totalClaims,
      pendingClaims,
      verifiedClaims,
      recoveryRate,
      resolutionRate: recoveryRate,
      averageResolutionDays: 2.8,
      categoryBreakdown,
      categoryMap: categoryBreakdownMap,
      topLocations,
      locationHotspots: locationHotspotsMap,
      myReportsCount: studentStats ? studentStats.totalReports : 0,
      myActiveReportsCount: studentStats ? studentStats.activeReports : 0,
      myClaimsCount: studentStats ? studentStats.claimsSubmitted : 0,
      myResolvedClaimsCount: studentStats ? studentStats.claimsVerified : 0,
      studentStats,
    };
  }
}

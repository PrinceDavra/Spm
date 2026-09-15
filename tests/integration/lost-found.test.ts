import { describe, it, expect, beforeEach } from "vitest";
import { LostFoundService } from "@/services/lost-found.service";
import {
  createReportSchema,
  updateReportSchema,
  submitClaimSchema,
  reviewClaimSchema,
} from "@/validators/lost-found.schema";
import {
  LostFoundType,
  LostFoundCategory,
  LostFoundStatus,
  ClaimStatus,
  Role,
} from "@prisma/client";
import {
  resetDemoLostFoundStore,
  DEMO_LOST_FOUND_ITEMS,
  DEMO_LOST_FOUND_CLAIMS,
} from "@/lib/lost-found/demo-lost-found";

describe("Phase 11 — Lost & Found Community Board & Claim Verification Tests", () => {
  beforeEach(() => {
    resetDemoLostFoundStore();
  });

  // =========================================================================
  // 1. VALIDATION SCHEMAS & DATA CONSTRAINTS
  // =========================================================================
  describe("1. Validation Schemas & Data Constraints", () => {
    it("1. validates a complete LOST report payload", () => {
      const payload = {
        type: LostFoundType.LOST,
        title: "Titan Automatic Wristwatch",
        category: LostFoundCategory.ACCESSORY,
        description: "Silver stainless steel strap with open heart dial, misplaced near seminar hall.",
        location: "Seminar Hall Block B",
        dateLostFound: "2026-09-14",
        timeLostFound: "11:30 AM",
        contactPreference: "CAMPUS_PORTAL",
        identifyingDetails: "Engraving on clasp with initials T.P.",
      };
      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("2. validates a complete FOUND report payload", () => {
      const payload = {
        type: LostFoundType.FOUND,
        title: "Scientific Calculator Casio FX-991EX",
        category: LostFoundCategory.ELECTRONICS,
        description: "Found on desk 14 in Physics Lab 2 after morning practical exam.",
        location: "Physics Lab 2",
        dateLostFound: "2026-09-14",
        contactPreference: "SECURITY_DESK",
      };
      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("3. rejects report with title shorter than 3 characters", () => {
      const payload = {
        type: LostFoundType.LOST,
        title: "AB",
        category: LostFoundCategory.BAG,
        description: "Standard description of the lost item on campus.",
        location: "Canteen",
        dateLostFound: "2026-09-14",
      };
      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it("4. rejects report with description shorter than 10 characters", () => {
      const payload = {
        type: LostFoundType.LOST,
        title: "Dell Laptop Charger",
        category: LostFoundCategory.ELECTRONICS,
        description: "Lost it",
        location: "Canteen",
        dateLostFound: "2026-09-14",
      };
      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description).toBeDefined();
      }
    });

    it("5. rejects report with invalid date format", () => {
      const payload = {
        type: LostFoundType.LOST,
        title: "Calculus Textbook",
        category: LostFoundCategory.BOOK,
        description: "Thomas Calculus 14th edition hardbound copy.",
        location: "Library",
        dateLostFound: "not-a-valid-date",
      };
      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("6. validates claim submission schema with sufficient details", () => {
      const payload = {
        itemId: "lf-item-001",
        claimStatement: "This is my blue water bottle left during the afternoon lab session.",
        verificationAnswers: "There is a Python decal on the lid and my phone number scratched on bottom.",
      };
      const result = submitClaimSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("7. rejects claim statement with under 10 characters", () => {
      const payload = {
        itemId: "lf-item-001",
        claimStatement: "Mine",
        verificationAnswers: "Distinctive mark on the bottom base.",
      };
      const result = submitClaimSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("8. rejects claim verification answers under 10 characters", () => {
      const payload = {
        itemId: "lf-item-001",
        claimStatement: "I lost this blue bottle near the canteen area yesterday.",
        verificationAnswers: "Blue lid",
      };
      const result = submitClaimSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("9. validates admin claim review status schema", () => {
      const payload = {
        status: ClaimStatus.VERIFIED,
        reviewerRemarks: "Claimant demonstrated physical proof matching security custody records.",
      };
      const result = reviewClaimSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("10. rejects invalid review status in review claim schema", () => {
      const payload = {
        status: "INVALID_STATUS" as any,
        reviewerRemarks: "Remarks",
      };
      const result = reviewClaimSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. FILE & ATTACHMENT SECURITY
  // =========================================================================
  describe("2. File & Attachment Security", () => {
    it("11. accepts valid image format extensions (.jpg, .png, .webp)", () => {
      const res1 = LostFoundService.validateUploadedAttachment("item_photo.jpg", 1024 * 100);
      expect(res1.isValid).toBe(true);
      expect(res1.extension).toBe("jpg");

      const res2 = LostFoundService.validateUploadedAttachment("proof.png", 1024 * 200);
      expect(res2.isValid).toBe(true);

      const res3 = LostFoundService.validateUploadedAttachment("receipt.webp", 1024 * 300);
      expect(res3.isValid).toBe(true);
    });

    it("12. blocks dangerous executable file (.exe)", () => {
      expect(() => {
        LostFoundService.validateUploadedAttachment("trojan.exe", 1024 * 50);
      }).toThrow(/Security Violation.*strictly prohibited/i);
    });

    it("13. blocks malicious script files (.sh, .bat, .js)", () => {
      expect(() => {
        LostFoundService.validateUploadedAttachment("script.sh", 1024);
      }).toThrow(/Security Violation/i);

      expect(() => {
        LostFoundService.validateUploadedAttachment("exploit.bat", 1024);
      }).toThrow(/Security Violation/i);
    });

    it("14. blocks directory and path traversal attempts", () => {
      expect(() => {
        LostFoundService.validateUploadedAttachment("../../../etc/passwd.jpg", 1024);
      }).toThrow(/Illegal file name containing path traversal/i);

      expect(() => {
        LostFoundService.validateUploadedAttachment("uploads\\..\\hack.png", 1024);
      }).toThrow(/Illegal file name/i);
    });

    it("15. rejects files exceeding the 5MB size limit", () => {
      const sixMb = 6 * 1024 * 1024;
      expect(() => {
        LostFoundService.validateUploadedAttachment("large_photo.jpg", sixMb);
      }).toThrow(/exceeds maximum permitted limit/i);
    });
  });

  // =========================================================================
  // 3. REPORT CREATION & LIFECYCLE
  // =========================================================================
  describe("3. Report Creation & Lifecycle", () => {
    it("16. creates a new LOST report with generated case reference number", async () => {
      const report = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Graphing Tablet Stylus Pen",
          category: LostFoundCategory.ELECTRONICS,
          description: "Black pressure-sensitive stylus left in CAD Lab A.",
          location: "CAD Lab A, Room 304",
          dateLostFound: "2026-09-14",
        },
        "student-test-01",
        Role.STUDENT
      );

      expect(report.id).toBeDefined();
      expect(report.referenceNumber).toMatch(/^LF-\d{4}-[A-Z0-9]{4}$/);
      expect(report.type).toBe(LostFoundType.LOST);
      expect(report.status).toBe(LostFoundStatus.PUBLISHED);
      expect(report.reporterId).toBe("student-test-01");
    });

    it("17. creates a report with DRAFT status when specified", async () => {
      const draftReport = await LostFoundService.createReport(
        {
          type: LostFoundType.FOUND,
          title: "Draft Found: Set of Dorm Keys",
          category: LostFoundCategory.KEYS,
          description: "Found ring with three brass keys near hostel entrance.",
          location: "Boys Hostel Block 1 Entry",
          dateLostFound: "2026-09-14",
          status: LostFoundStatus.DRAFT,
        },
        "student-test-01",
        Role.STUDENT
      );

      expect(draftReport.status).toBe(LostFoundStatus.DRAFT);
    });

    it("18. conceals DRAFT reports from public community discovery feed", async () => {
      // Create a draft by student-test-01
      await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Private Draft Report Not Yet Ready",
          category: LostFoundCategory.BAG,
          description: "Personal backpack draft report.",
          location: "Campus Ground",
          dateLostFound: "2026-09-14",
          status: LostFoundStatus.DRAFT,
        },
        "student-test-01",
        Role.STUDENT
      );

      // Query feed as student-test-02
      const feed = await LostFoundService.getReports({
        userId: "student-test-02",
        role: Role.STUDENT,
      });

      const foundDraft = feed.items.find((i) => i.title === "Private Draft Report Not Yet Ready");
      expect(foundDraft).toBeUndefined();
    });

    it("19. permits author to see own draft report in their reports query", async () => {
      const draft = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Author Visible Draft Backpack",
          category: LostFoundCategory.BAG,
          description: "Author's draft backpack details.",
          location: "Campus Ground",
          dateLostFound: "2026-09-14",
          status: LostFoundStatus.DRAFT,
        },
        "student-test-01",
        Role.STUDENT
      );

      const res = await LostFoundService.getItemById(draft.id, "student-test-01", Role.STUDENT);
      expect(res).not.toBeNull();
      expect(res?.item.id).toBe(draft.id);
    });

    it("20. blocks other students from accessing draft item by ID", async () => {
      const draft = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Confidential Draft Notes",
          category: LostFoundCategory.BOOK,
          description: "Exam preparation notes folder draft.",
          location: "Library Annex",
          dateLostFound: "2026-09-14",
          status: LostFoundStatus.DRAFT,
        },
        "student-test-01",
        Role.STUDENT
      );

      const res = await LostFoundService.getItemById(draft.id, "student-test-02", Role.STUDENT);
      expect(res).toBeNull();
    });

    it("21. author can publish their draft report", async () => {
      const draft = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Draft Item Ready To Publish",
          category: LostFoundCategory.SPORTS,
          description: "Badminton racquet left near gym court 2.",
          location: "Gymnasium Court 2",
          dateLostFound: "2026-09-14",
          status: LostFoundStatus.DRAFT,
        },
        "student-test-01",
        Role.STUDENT
      );

      const published = await LostFoundService.publishReport(draft.id, "student-test-01", Role.STUDENT);
      expect(published.status).toBe(LostFoundStatus.PUBLISHED);
    });

    it("22. non-author student cannot publish another user's draft", async () => {
      const draft = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Student A Draft Item",
          category: LostFoundCategory.OTHER,
          description: "Miscellaneous item draft by student A.",
          location: "Quad",
          dateLostFound: "2026-09-14",
          status: LostFoundStatus.DRAFT,
        },
        "student-test-01",
        Role.STUDENT
      );

      await expect(
        LostFoundService.publishReport(draft.id, "student-test-02", Role.STUDENT)
      ).rejects.toThrow(/Unauthorized.*modify this report/i);
    });
  });

  // =========================================================================
  // 4. OWNERSHIP, ARCHIVAL & FILTERS
  // =========================================================================
  describe("4. Ownership, Archival & Filters", () => {
    it("23. author can update their own report fields", async () => {
      const report = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Blue Parker Pen",
          category: LostFoundCategory.STATIONERY,
          description: "Original metal body Parker ballpoint pen.",
          location: "Classroom 101",
          dateLostFound: "2026-09-14",
        },
        "student-test-01",
        Role.STUDENT
      );

      const updated = await LostFoundService.updateReport(
        report.id,
        { title: "Blue Parker Jotter Pen (Engraved)" },
        "student-test-01",
        Role.STUDENT
      );

      expect(updated.title).toBe("Blue Parker Jotter Pen (Engraved)");
    });

    it("24. non-author cannot update another student's report", async () => {
      const report = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Leather Notebook",
          category: LostFoundCategory.BOOK,
          description: "Brown leather journal with lecture notes.",
          location: "Library 2nd Floor",
          dateLostFound: "2026-09-14",
        },
        "student-test-01",
        Role.STUDENT
      );

      await expect(
        LostFoundService.updateReport(
          report.id,
          { title: "Hacked Notebook Title" },
          "student-test-02",
          Role.STUDENT
        )
      ).rejects.toThrow(/Unauthorized.*modify this report/i);
    });

    it("25. author can archive their own report", async () => {
      const report = await LostFoundService.createReport(
        {
          type: LostFoundType.LOST,
          title: "Umbrella (Found by friend)",
          category: LostFoundCategory.ACCESSORY,
          description: "Black folding umbrella, no longer needed to search.",
          location: "Canteen Corridor",
          dateLostFound: "2026-09-14",
        },
        "student-test-01",
        Role.STUDENT
      );

      const archived = await LostFoundService.archiveReport(report.id, "student-test-01", Role.STUDENT);
      expect(archived.status).toBe(LostFoundStatus.ARCHIVED);
    });

    it("26. filters reports by type (LOST vs FOUND)", async () => {
      const lostResults = await LostFoundService.getReports({ type: LostFoundType.LOST });
      expect(lostResults.items.every((i) => i.type === LostFoundType.LOST)).toBe(true);

      const foundResults = await LostFoundService.getReports({ type: LostFoundType.FOUND });
      expect(foundResults.items.every((i) => i.type === LostFoundType.FOUND)).toBe(true);
    });

    it("27. filters reports by category", async () => {
      const results = await LostFoundService.getReports({ category: LostFoundCategory.ELECTRONICS });
      expect(results.items.every((i) => i.category === LostFoundCategory.ELECTRONICS)).toBe(true);
    });

    it("28. searches reports by keyword query", async () => {
      const results = await LostFoundService.getReports({ search: "bottle" });
      expect(results.items.length).toBeGreaterThan(0);
      const matches = results.items.filter(
        (i) =>
          i.title.toLowerCase().includes("bottle") ||
          i.description.toLowerCase().includes("bottle")
      );
      expect(matches.length).toBe(results.items.length);
    });
  });

  // =========================================================================
  // 5. DETERMINISTIC MATCHING ENGINE
  // =========================================================================
  describe("5. Deterministic Matching Engine", () => {
    it("29. identifies strong potential match between counterpart lost & found items", async () => {
      // In demo seed:
      // lf-item-002: LOST Pacific Blue Water Bottle in Central Library
      // lf-item-014: FOUND Insulated Metal Water Bottle (Pacific Blue) in Central Library
      const matches = LostFoundService.findMatchesForItem("lf-item-002");
      expect(matches.length).toBeGreaterThan(0);

      const counterpart = matches.find((m) => m.foundItemId === "lf-item-014");
      expect(counterpart).toBeDefined();
      expect(counterpart!.matchScore).toBeGreaterThanOrEqual(70);
    });

    it("30. produces deterministic match scores across repeated evaluations", () => {
      const run1 = LostFoundService.findMatchesForItem("lf-item-002");
      const run2 = LostFoundService.findMatchesForItem("lf-item-002");

      expect(run1.length).toBe(run2.length);
      for (let i = 0; i < run1.length; i++) {
        expect(run1[i].matchScore).toBe(run2[i].matchScore);
        expect(run1[i].matchingFactors).toEqual(run2[i].matchingFactors);
      }
    });

    it("31. includes transparent matching factor explanations", () => {
      const matches = LostFoundService.findMatchesForItem("lf-item-002");
      const topMatch = matches[0];
      expect(topMatch.matchingFactors.length).toBeGreaterThan(0);
      expect(
        topMatch.matchingFactors.some((f) => f.includes("Category") || f.includes("Location"))
      ).toBe(true);
    });

    it("32. never matches items of the same type (LOST to LOST or FOUND to FOUND)", () => {
      const lostItem = DEMO_LOST_FOUND_ITEMS.find((i) => i.type === LostFoundType.LOST);
      expect(lostItem).toBeDefined();

      const matches = LostFoundService.findMatchesForItem(lostItem!.id);
      for (const m of matches) {
        // Counterpart should be of FOUND type
        const found = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === m.foundItemId);
        expect(found?.type).toBe(LostFoundType.FOUND);
      }
    });

    it("33. match score does NOT automatically transfer ownership or resolve item", async () => {
      const itemBefore = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === "lf-item-002");
      expect(itemBefore?.status).toBe(LostFoundStatus.PUBLISHED);

      // Run matching engine
      LostFoundService.findMatchesForItem("lf-item-002");

      const itemAfter = DEMO_LOST_FOUND_ITEMS.find((i) => i.id === "lf-item-002");
      expect(itemAfter?.status).toBe(LostFoundStatus.PUBLISHED);
      expect(itemAfter?.resolvedAt).toBeFalsy();
    });
  });

  // =========================================================================
  // 6. CLAIMS & DUPLICATE PREVENTION
  // =========================================================================
  describe("6. Claims & Duplicate Prevention", () => {
    it("34. permits authenticated student to submit recovery claim", async () => {
      const claim = await LostFoundService.submitClaim(
        {
          itemId: "lf-item-003",
          claimStatement: "This is my Casio scientific calculator misplaced during Tuesday's lab.",
          verificationAnswers: "Serial number under battery panel ends in 8492 with small sticker.",
        },
        "demo-student-001",
        Role.STUDENT
      );

      expect(claim.id).toBeDefined();
      expect(claim.status).toBe(ClaimStatus.PENDING);
      expect(claim.claimantId).toBe("demo-student-001");
    });

    it("35. prevents reporter from claiming their own reported item", async () => {
      const report = DEMO_LOST_FOUND_ITEMS.find((i) => i.reporterId === "demo-student-001" && i.status === LostFoundStatus.PUBLISHED);
      expect(report).toBeDefined();

      await expect(
        LostFoundService.submitClaim(
          {
            itemId: report!.id,
            claimStatement: "Attempting to claim my own reported item.",
            verificationAnswers: "Secret verification details.",
          },
          "demo-student-001",
          Role.STUDENT
        )
      ).rejects.toThrow(/cannot submit a claim on your own report/i);
    });

    it("36. prevents duplicate active claims on the same item by same student", async () => {
      // First claim
      await LostFoundService.submitClaim(
        {
          itemId: "lf-item-004",
          claimStatement: "First legitimate claim for the misplaced sports bag.",
          verificationAnswers: "Inside pocket contains a blue gym towel.",
        },
        "student-unique-01",
        Role.STUDENT
      );

      // Second duplicate claim
      await expect(
        LostFoundService.submitClaim(
          {
            itemId: "lf-item-004",
            claimStatement: "Second claim for the same bag.",
            verificationAnswers: "Repeating the claim answers.",
          },
          "student-unique-01",
          Role.STUDENT
        )
      ).rejects.toThrow(/already submitted an active claim/i);
    });

    it("37. blocks claims on DRAFT items", async () => {
      const draft = DEMO_LOST_FOUND_ITEMS.find((i) => i.status === LostFoundStatus.DRAFT);
      expect(draft).toBeDefined();

      await expect(
        LostFoundService.submitClaim(
          {
            itemId: draft!.id,
            claimStatement: "Claim on an unpublished draft item.",
            verificationAnswers: "Verification information.",
          },
          "student-test-01",
          Role.STUDENT
        )
      ).rejects.toThrow(/Claims can only be submitted on published items/i);
    });

    it("38. claimant can withdraw their PENDING claim", async () => {
      const claim = await LostFoundService.submitClaim(
        {
          itemId: "lf-item-006",
          claimStatement: "Submitting claim which I later realize was a mistake.",
          verificationAnswers: "Verification text for mistaken item.",
        },
        "student-withdraw-01",
        Role.STUDENT
      );

      const withdrawn = await LostFoundService.withdrawClaim(
        claim.id,
        "student-withdraw-01",
        Role.STUDENT
      );

      expect(withdrawn.status).toBe(ClaimStatus.WITHDRAWN);
    });

    it("39. non-claimant cannot withdraw someone else's claim", async () => {
      const claim = await LostFoundService.submitClaim(
        {
          itemId: "lf-item-007",
          claimStatement: "Student A's legitimate claim.",
          verificationAnswers: "Verification text A.",
        },
        "student-a",
        Role.STUDENT
      );

      await expect(
        LostFoundService.withdrawClaim(claim.id, "student-b", Role.STUDENT)
      ).rejects.toThrow(/Unauthorized/i);
    });

    it("40. cannot withdraw already VERIFIED or COMPLETED claim", async () => {
      // Find a verified claim from demo seed
      const verifiedClaim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.status === ClaimStatus.VERIFIED);
      expect(verifiedClaim).toBeDefined();

      await expect(
        LostFoundService.withdrawClaim(verifiedClaim!.id, verifiedClaim!.claimantId, Role.STUDENT)
      ).rejects.toThrow(/Only pending or under-review claims can be withdrawn/i);
    });
  });

  // =========================================================================
  // 7. ADMIN REVIEW & SELF-APPROVAL PREVENTION
  // =========================================================================
  describe("7. Admin Review & Self-Approval Prevention", () => {
    it("41. student CANNOT approve or review claims (403 Forbidden)", async () => {
      const pendingClaim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.status === ClaimStatus.PENDING);
      expect(pendingClaim).toBeDefined();

      await expect(
        LostFoundService.reviewClaim(
          pendingClaim!.id,
          {
            status: ClaimStatus.VERIFIED,
            reviewerRemarks: "Student attempting unauthorized review.",
          },
          pendingClaim!.claimantId,
          Role.STUDENT
        )
      ).rejects.toThrow(/Only.*administrators.*can review claims/i);
    });

    it("42. student cannot self-approve their own claim", async () => {
      const claim = await LostFoundService.submitClaim(
        {
          itemId: "lf-item-008",
          claimStatement: "My claim to test self-approval blocking.",
          verificationAnswers: "Special verification answers.",
        },
        "student-self-tester",
        Role.STUDENT
      );

      await expect(
        LostFoundService.reviewClaim(
          claim.id,
          { status: ClaimStatus.VERIFIED },
          "student-self-tester",
          Role.STUDENT
        )
      ).rejects.toThrow(/Only campus administrators/i);
    });

    it("43. admin can review claim to VERIFIED", async () => {
      const pendingClaim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.status === ClaimStatus.PENDING);
      expect(pendingClaim).toBeDefined();

      const reviewed = await LostFoundService.reviewClaim(
        pendingClaim!.id,
        {
          status: ClaimStatus.VERIFIED,
          reviewerRemarks: "Identified matching personal engraving. Approved for physical handover.",
        },
        "demo-admin-001",
        Role.ADMIN
      );

      expect(reviewed.status).toBe(ClaimStatus.VERIFIED);
      expect(reviewed.reviewedBy).toBe("demo-admin-001");
    });

    it("44. admin can reject a fraudulent or unsubstantiated claim", async () => {
      const claim = await LostFoundService.submitClaim(
        {
          itemId: "lf-item-009",
          claimStatement: "Vague claim with no proof.",
          verificationAnswers: "I think it is mine.",
        },
        "student-fraud-01",
        Role.STUDENT
      );

      const reviewed = await LostFoundService.reviewClaim(
        claim.id,
        {
          status: ClaimStatus.REJECTED,
          reviewerRemarks: "Verification answers do not match item characteristics.",
        },
        "demo-admin-001",
        Role.ADMIN
      );

      expect(reviewed.status).toBe(ClaimStatus.REJECTED);
    });

    it("45. conceals private verification details from normal student query", async () => {
      const verifiedClaim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.status === ClaimStatus.VERIFIED);
      expect(verifiedClaim).toBeDefined();

      // Query as third-party student
      const claimDetail = await LostFoundService.getClaimById(
        verifiedClaim!.id,
        "unrelated-student",
        Role.STUDENT
      );

      // Must be null (cannot view other people's claim secrets)
      expect(claimDetail).toBeNull();
    });
  });

  // =========================================================================
  // 8. HANDOVER & RESOLUTION READ-ONLY LOCK
  // =========================================================================
  describe("8. Handover & Resolution Read-Only Lock", () => {
    it("46. admin can complete handover for verified claim", async () => {
      // Set up a verified claim
      const claim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.status === ClaimStatus.VERIFIED);
      expect(claim).toBeDefined();

      const res = await LostFoundService.completeHandover(
        claim!.itemId,
        {
          claimId: claim!.id,
          handoverNotes: "Item handed over to student upon ID card verification at Security Desk 1.",
        },
        "demo-admin-001",
        Role.ADMIN
      );

      expect(res.item.status).toBe(LostFoundStatus.RESOLVED);
      expect(res.claim.status).toBe(ClaimStatus.COMPLETED);
    });

    it("47. student cannot execute handover completion", async () => {
      const claim = DEMO_LOST_FOUND_CLAIMS.find((c) => c.status === ClaimStatus.VERIFIED);
      expect(claim).toBeDefined();

      await expect(
        LostFoundService.completeHandover(
          claim!.itemId,
          { claimId: claim!.id },
          "student-tester",
          Role.STUDENT
        )
      ).rejects.toThrow(/Only administrators.*confirm handover/i);
    });

    it("48. admin can directly resolve an item with resolution notes", async () => {
      const item = DEMO_LOST_FOUND_ITEMS.find((i) => i.status === LostFoundStatus.PUBLISHED);
      expect(item).toBeDefined();

      const resolved = await LostFoundService.resolveItem(
        item!.id,
        { resolutionNotes: "Owner recovered item independently via faculty advisor." },
        "demo-admin-001",
        Role.ADMIN
      );

      expect(resolved.status).toBe(LostFoundStatus.RESOLVED);
      expect(resolved.resolvedAt).toBeDefined();
    });

    it("49. resolved item is locked and rejects subsequent claim submissions", async () => {
      // Find or create a resolved item
      const resolvedItem = DEMO_LOST_FOUND_ITEMS.find((i) => i.status === LostFoundStatus.RESOLVED);
      expect(resolvedItem).toBeDefined();

      await expect(
        LostFoundService.submitClaim(
          {
            itemId: resolvedItem!.id,
            claimStatement: "Attempting to claim an already resolved item.",
            verificationAnswers: "Should be blocked.",
          },
          "late-claimant",
          Role.STUDENT
        )
      ).rejects.toThrow(/Claims can only be submitted on published items/i);
    });

    it("50. resolved item cannot be updated (read-only enforcement)", async () => {
      const resolvedItem = DEMO_LOST_FOUND_ITEMS.find((i) => i.status === LostFoundStatus.RESOLVED);
      expect(resolvedItem).toBeDefined();

      await expect(
        LostFoundService.updateReport(
          resolvedItem!.id,
          { title: "Modifying Closed Case" },
          resolvedItem!.reporterId,
          Role.STUDENT
        )
      ).rejects.toThrow(/Resolved or closed reports cannot be modified/i);
    });
  });

  // =========================================================================
  // 9. ANALYTICS & METRICS
  // =========================================================================
  describe("9. Analytics & Institutional Metrics", () => {
    it("51. computes deterministic institutional analytics for admin", async () => {
      const analytics: any = await LostFoundService.getAnalytics("demo-admin-001", Role.ADMIN);

      expect(analytics.totalReports).toBeGreaterThanOrEqual(25);
      expect(analytics.lostReports).toBeGreaterThan(0);
      expect(analytics.foundReports).toBeGreaterThan(0);
      expect(analytics.totalReports).toBe(analytics.lostReports + analytics.foundReports);
      expect(analytics.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.resolutionRate).toBeLessThanOrEqual(100);
      expect(analytics.categoryBreakdown.length).toBeGreaterThan(0);
      expect(analytics.topLocations.length).toBeGreaterThan(0);
    });

    it("52. computes personal lost & found metrics for student", async () => {
      const studentAnalytics: any = await LostFoundService.getAnalytics("demo-student-001", Role.STUDENT);

      expect(studentAnalytics.myReportsCount).toBeDefined();
      expect(studentAnalytics.myActiveReportsCount).toBeDefined();
      expect(studentAnalytics.myClaimsCount).toBeDefined();
      expect(studentAnalytics.myResolvedClaimsCount).toBeDefined();
    });
  });
});

import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/rbac";
import { LostFoundService } from "@/services/lost-found.service";
import { updateReportSchema } from "@/validators/lost-found.schema";
import { LostFoundStatus, Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/lost-found/[id]
 * Fetch detailed report information, claims count, and potential matches.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await checkAuth();

    // Fetch raw item first to check draft status
    const result = await LostFoundService.getReportById(
      id,
      user?.id,
      user?.role
    );

    if (!result) {
      // Check if it's a draft item that user is not authorized to see
      const allReports = await LostFoundService.getReports({ limit: 1000 });
      const rawItem = allReports.items.find((i) => i.id === id);
      if (rawItem && rawItem.status === LostFoundStatus.DRAFT) {
        return NextResponse.json(
          { success: false, error: "This report is currently in draft mode and not published" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    if (result.item.status === LostFoundStatus.DRAFT && user?.role !== Role.ADMIN && user?.id !== result.item.reporterId) {
      return NextResponse.json(
        { success: false, error: "This report is currently in draft mode and not published" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      item: result.item,
      claimsCount: result.claimsCount,
      potentialMatches: result.potentialMatches,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/lost-found/[id]
 * Update report parameters (Author or Admin only).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = updateReportSchema.safeParse(body);

    if (!parseResult.success) {
      const zodError = parseResult.error as ZodError;
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          fieldErrors: zodError.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedItem = await LostFoundService.updateReport(
      id,
      parseResult.data,
      user.id,
      user.role
    );

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update report";
    let status = 400;
    if (message.includes("Forbidden") || message.includes("Unauthorized") || message.includes("permission")) {
      status = 403;
    }
    if (message.includes("not found")) status = 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

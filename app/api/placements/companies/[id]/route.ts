import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { updateCompanySchema } from "@/validators/placement.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/placements/companies/[id]
 * Get company details and active drives.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { id } = await params;
    const company = await PlacementService.getCompanyById(id);

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve company";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/placements/companies/[id]
 * Update company details (PLACEMENT_OFFICER, ADMIN only).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parseResult = updateCompanySchema.safeParse(body);

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

    const updated = await PlacementService.updateCompany(id, parseResult.data, user.id);
    return NextResponse.json({
      success: true,
      message: "Company details updated successfully",
      company: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update company";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

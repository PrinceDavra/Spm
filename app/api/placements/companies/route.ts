import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkRole } from "@/lib/auth/rbac";
import { PlacementService } from "@/services/placement.service";
import { createCompanySchema } from "@/validators/placement.schema";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * GET /api/placements/companies
 * List all companies with optional search.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await checkAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;

    const companies = await PlacementService.getCompanies(search);
    return NextResponse.json({
      success: true,
      companies,
      total: companies.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch companies";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/placements/companies
 * Create a new hiring partner company (PLACEMENT_OFFICER, ADMIN only).
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await checkRole([Role.PLACEMENT_OFFICER, Role.ADMIN]);
    if (error) return error;

    const body = await req.json();
    const parseResult = createCompanySchema.safeParse(body);

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

    const company = await PlacementService.createCompany(parseResult.data, user.id);

    return NextResponse.json(
      {
        success: true,
        message: `Company "${company.name}" registered successfully.`,
        company,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create company";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

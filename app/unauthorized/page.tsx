import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth/session";

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string; current?: string }>;
}) {
  const params = await searchParams;
  const user = await getSession();

  const currentRole = user?.role || params.current || "UNKNOWN";
  const requiredRole = params.required || "ELEVATED_PRIVILEGE";

  const dashboardRouteMap: Record<string, string> = {
    STUDENT: "/dashboard/student",
    FACULTY: "/dashboard/faculty",
    ADMIN: "/dashboard/admin",
    PLACEMENT_OFFICER: "/dashboard/placement",
    CLUB_COORDINATOR: "/dashboard/club",
  };

  const returnUrl = dashboardRouteMap[currentRole] || "/login";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center p-8 rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-6 shadow-sm">
          <ShieldAlert className="h-9 w-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900 mb-3">
          403 Forbidden &bull; Server-Side RBAC Guard
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Access Restricted
        </h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Your current session authenticated as{" "}
          <span className="font-semibold text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
            {currentRole}
          </span>{" "}
          does not possess the required privilege level (
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {requiredRole}
          </span>
          ) to access this protected sector.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={returnUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Authorized Dashboard
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              Sign Out / Switch Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

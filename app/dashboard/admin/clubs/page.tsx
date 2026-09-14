import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/rbac";
import { ClubService } from "@/services/club.service";
import Link from "next/link";
import {
  Users,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
} from "lucide-react";

export default async function AdminClubsPage() {
  const user = await requireRole([Role.ADMIN]);

  const { clubs } = await ClubService.getClubs({
    userId: user.id,
    role: user.role,
    limit: 100,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Student Organizations &amp; Club Governance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Oversee all campus societies, approve charters, assign faculty advisors, and audit club health.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-muted text-foreground">
                  {club.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    club.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : club.status === "DRAFT"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  {club.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="w-12 h-12 rounded-xl object-cover border border-border"
                />
                <div>
                  <h3 className="text-base font-bold text-foreground line-clamp-1">{club.name}</h3>
                  <div className="text-xs text-muted-foreground">
                    Coordinator: {club.coordinatorName || "Unassigned"}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">{club.shortDescription}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>{club.memberCount} members</span>
                <span>{club.upcomingEventsCount} events</span>
                <span className="font-bold text-foreground">{club.engagementScore}% Engagement</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <Link
                href={`/dashboard/student/clubs/${club.id}`}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View Details</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

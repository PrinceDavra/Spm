import { DemoEvent } from "./demo-events";

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate a standard RFC 5545 iCalendar (.ics) string for an event.
 */
export function generateICS(event: {
  id: string;
  title: string;
  description: string;
  summary?: string | null;
  venue: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  organizerName?: string;
}): string {
  const startDate = new Date(event.startDateTime);
  const endDate = new Date(event.endDateTime);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusSphere//Institutional Event System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@campussphere.edu`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(event.summary || event.description.slice(0, 200))}`,
    `LOCATION:${escapeICSText(event.venue)}`,
    `STATUS:CONFIRMED`,
    `ORGANIZER;CN=${escapeICSText(event.organizerName || "CampusSphere Coordinator")}:mailto:events@campussphere.edu`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

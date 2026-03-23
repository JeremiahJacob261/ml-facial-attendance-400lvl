import type { AttendanceRecord } from "@/types";

/**
 * Convert attendance records to CSV string.
 */
export function recordsToCSV(records: AttendanceRecord[]): string {
  const headers = ["Name", "matric_no", "Time", "Course", "Venue", "Status", "Method", "Confidence"];
  const rows = records.map((r) => {
    const time = new Date(r.timestamp).toLocaleString();
    return [
      escapeCSV(r.studentName),
      escapeCSV(r.matricNumber),
      escapeCSV(time),
      escapeCSV(r.course),
      escapeCSV(r.venue),
      escapeCSV(r.status),
      escapeCSV(r.method),
      r.confidence ? `${r.confidence.toFixed(1)}%` : "N/A",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Escape a CSV field value (handles commas, quotes, newlines).
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCSV(records: AttendanceRecord[], filename?: string): void {
  const csv = recordsToCSV(records);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename || `attendance_${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

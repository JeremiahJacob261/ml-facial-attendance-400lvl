import type { AttendanceRecord, SessionInfo } from "@/types";

// In-memory attendance store keyed by session ID
const attendanceStore = new Map<string, AttendanceRecord[]>();
let currentSession: SessionInfo | null = null;

/**
 * Create and start a new attendance session.
 */
export function startSession(course: string, venue: string): SessionInfo {
  const session: SessionInfo = {
    id: `session-${Date.now()}`,
    course,
    venue,
    startTime: new Date().toISOString(),
    isActive: true,
  };
  currentSession = session;
  attendanceStore.set(session.id, []);
  return session;
}

/**
 * Get the currently active session.
 */
export function getCurrentSession(): SessionInfo | null {
  return currentSession;
}

/**
 * End the current session.
 */
export function endSession(): void {
  if (currentSession) {
    currentSession.isActive = false;
  }
}

/**
 * Record attendance for a student in the current session.
 * Returns false if the student already has attendance recorded.
 */
export function recordAttendance(
  studentName: string,
  matricNumber: string,
  course: string,
  venue: string,
  confidence: number,
  method: "biometric" | "manual" = "biometric"
): { success: boolean; record: AttendanceRecord | null; message: string } {
  const sessionId = currentSession?.id;
  if (!sessionId || !currentSession?.isActive) {
    return {
      success: false,
      record: null,
      message: "No active session",
    };
  }

  const records = attendanceStore.get(sessionId) || [];

  // Check for duplicate attendance
  const isDuplicate = records.some(
    (r) => r.matricNumber === matricNumber
  );
  if (isDuplicate) {
    return {
      success: false,
      record: null,
      message: "Attendance already recorded for this student in this session",
    };
  }

  const record: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    studentName,
    matricNumber,
    timestamp: new Date().toISOString(),
    course,
    venue,
    status: "present",
    method,
    confidence,
  };

  records.push(record);
  attendanceStore.set(sessionId, records);

  return {
    success: true,
    record,
    message: "Attendance recorded successfully",
  };
}

/**
 * Get all records for the current session.
 */
export function getSessionRecords(): AttendanceRecord[] {
  if (!currentSession?.id) return [];
  return attendanceStore.get(currentSession.id) || [];
}

/**
 * Get all records across all sessions.
 */
export function getAllRecords(): AttendanceRecord[] {
  const allRecords: AttendanceRecord[] = [];
  attendanceStore.forEach((records) => {
    allRecords.push(...records);
  });
  // Sort by timestamp descending
  return allRecords.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get the count of present students in the current session.
 */
export function getPresentCount(): number {
  return getSessionRecords().filter((r) => r.status === "present").length;
}

/**
 * Clear session data.
 */
export function clearSession(sessionId?: string): void {
  if (sessionId) {
    attendanceStore.delete(sessionId);
  } else if (currentSession) {
    attendanceStore.delete(currentSession.id);
    currentSession = null;
  }
}

/**
 * Get all sessions.
 */
export function getAllSessions(): string[] {
  return Array.from(attendanceStore.keys());
}

import type { AttendanceRecord, SessionInfo } from "@/types";
import {
  getStoredRecords,
  loadAttendanceRecords,
  loadSessions,
  upsertAttendanceRecord,
  upsertAttendanceSession,
} from "@/services/localData";

// In-memory attendance store keyed by session ID
const attendanceStore = new Map<string, AttendanceRecord[]>();
let currentSession: SessionInfo | null = null;

function rebuildAttendanceStore(records: AttendanceRecord[]): void {
  attendanceStore.clear();
  records.forEach((record) => {
    if (!record.sessionId) return;
    const recordsForSession = attendanceStore.get(record.sessionId) || [];
    recordsForSession.push(record);
    attendanceStore.set(record.sessionId, recordsForSession);
  });
}

/**
 * Hydrate sessions and records from Supabase, falling back to local cache.
 */
export async function hydrateAttendance(): Promise<{
  records: AttendanceRecord[];
  session: SessionInfo | null;
}> {
  const [records, sessions] = await Promise.all([
    loadAttendanceRecords(),
    loadSessions(),
  ]);
  rebuildAttendanceStore(records);
  currentSession =
    sessions.find((session) => session.isActive) || currentSession || null;

  return {
    records,
    session: currentSession,
  };
}

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
  upsertAttendanceSession(session).catch((err) => {
    console.warn("Session sync failed", err);
  });
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
    currentSession.endTime = new Date().toISOString();
    upsertAttendanceSession(currentSession).catch((err) => {
      console.warn("Session sync failed", err);
    });
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
    sessionId,
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
  upsertAttendanceRecord(record).catch((err) => {
    console.warn("Attendance record sync failed", err);
  });

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
  const localRecords = getStoredRecords();
  localRecords.forEach((record) => {
    if (!allRecords.some((item) => item.id === record.id)) {
      allRecords.push(record);
    }
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

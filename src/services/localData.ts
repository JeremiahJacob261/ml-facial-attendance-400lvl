import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  AttendanceRecord,
  Course,
  Hall,
  SessionInfo,
  Student,
  SyncStatus,
} from "@/types";

type TableName =
  | "students"
  | "courses"
  | "halls"
  | "attendance_sessions"
  | "attendance_records";
type PendingAction = "upsert" | "delete";

interface PendingOperation {
  id: string;
  table: TableName;
  action: PendingAction;
  recordId: string;
  payload?: object;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface StudentRow {
  id: string;
  name: string;
  matric: string;
  photo_url: string | null;
  embedding: number[] | null;
  updated_at?: string;
}

interface CourseRow {
  id: string;
  code: string;
  title: string;
  updated_at?: string;
}

interface HallRow {
  id: string;
  name: string;
  capacity: number | null;
  location: string | null;
  updated_at?: string;
}

interface SessionRow {
  id: string;
  course_id: string | null;
  hall_id: string | null;
  course: string;
  hall: string;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
}

interface RecordRow {
  id: string;
  session_id: string | null;
  student_id: string | null;
  student_name: string;
  matric_number: string;
  course_id: string | null;
  hall_id: string | null;
  course: string;
  hall: string;
  status: "present" | "absent";
  method: "biometric" | "manual";
  confidence: number | null;
  timestamp: string;
}

const STUDENTS_KEY = "admin_students_v1";
const COURSES_KEY = "admin_courses_v1";
const HALLS_KEY = "admin_halls_v1";
const SESSIONS_KEY = "attendance_sessions_v1";
const RECORDS_KEY = "attendance_records_v1";
const PENDING_KEY = "supabase_pending_operations_v1";

export const DEFAULT_COURSES: Course[] = [
  {
    id: "course-advanced-systems-architecture",
    code: "CS401",
    title: "Advanced Systems Architecture",
  },
  {
    id: "course-database-management-systems",
    code: "CS302",
    title: "Database Management Systems",
  },
  {
    id: "course-machine-learning-fundamentals",
    code: "CS405",
    title: "Machine Learning Fundamentals",
  },
  {
    id: "course-network-security",
    code: "CS407",
    title: "Network Security",
  },
];

export const DEFAULT_HALLS: Hall[] = [
  {
    id: "hall-lecture-hall-4b",
    name: "Lecture Hall 4B",
    capacity: 120,
    location: "Main Academic Block",
  },
  {
    id: "hall-computer-lab-2",
    name: "Computer Lab 2",
    capacity: 60,
    location: "ICT Centre",
  },
  {
    id: "hall-auditorium-a",
    name: "Auditorium A",
    capacity: 300,
    location: "Auditorium Complex",
  },
  {
    id: "hall-seminar-room-102",
    name: "Seminar Room 102",
    capacity: 45,
    location: "Faculty Wing",
  },
];

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredArray<T>(key: string): T[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, value: T[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createEntityId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function getPendingOperations(): PendingOperation[] {
  return readStoredArray<PendingOperation>(PENDING_KEY);
}

export function getPendingCount(): number {
  return getPendingOperations().length;
}

function writePendingOperations(operations: PendingOperation[]): void {
  writeStoredArray(PENDING_KEY, operations);
}

function syncStatusFor(table: TableName, id: string): SyncStatus {
  const pending = getPendingOperations().find(
    (operation) => operation.table === table && operation.recordId === id
  );
  if (!pending) return "synced";
  return pending.attempts >= 3 ? "failed" : "pending";
}

function queueOfflineOperation(
  table: TableName,
  action: PendingAction,
  recordId: string,
  payload?: object,
  error?: unknown
): void {
  const operations = getPendingOperations();
  const message = error instanceof Error ? error.message : String(error || "");
  const existingIndex = operations.findIndex(
    (operation) => operation.table === table && operation.recordId === recordId
  );
  const operation: PendingOperation = {
    id:
      existingIndex >= 0
        ? operations[existingIndex].id
        : createEntityId("pending"),
    table,
    action,
    recordId,
    payload,
    createdAt:
      existingIndex >= 0 ? operations[existingIndex].createdAt : nowIso(),
    attempts: existingIndex >= 0 ? operations[existingIndex].attempts : 0,
    lastError: message || undefined,
  };

  if (existingIndex >= 0) {
    operations[existingIndex] = operation;
  } else {
    operations.push(operation);
  }

  writePendingOperations(operations);
}

async function remoteUpsert(
  table: TableName,
  payload: object
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase.from(table).upsert(payload, {
    onConflict: "id",
  });
  if (error) throw error;
}

async function remoteDelete(table: TableName, id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

async function readRemoteRows<T>(
  table: TableName,
  orderColumn: string
): Promise<T[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderColumn, { ascending: false });
  if (error) throw error;

  return (data || []) as T[];
}

function studentToRow(student: Student): StudentRow {
  return {
    id: student.id || createEntityId("student"),
    name: normalizeText(student.name),
    matric: normalizeText(student.matric),
    photo_url: student.photo_url?.trim() || null,
    embedding: student.embedding?.length ? student.embedding : null,
    updated_at: nowIso(),
  };
}

function rowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    matric: row.matric,
    photo_url: row.photo_url || undefined,
    embedding: row.embedding || undefined,
    updatedAt: row.updated_at,
    syncStatus: syncStatusFor("students", row.id),
  };
}

function courseToRow(course: Course): CourseRow {
  return {
    id: course.id || createEntityId("course"),
    code: normalizeText(course.code),
    title: normalizeText(course.title),
    updated_at: nowIso(),
  };
}

function rowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    updatedAt: row.updated_at,
    syncStatus: syncStatusFor("courses", row.id),
  };
}

function hallToRow(hall: Hall): HallRow {
  return {
    id: hall.id || createEntityId("hall"),
    name: normalizeText(hall.name),
    capacity: hall.capacity ?? null,
    location: hall.location ? normalizeText(hall.location) : null,
    updated_at: nowIso(),
  };
}

function rowToHall(row: HallRow): Hall {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity ?? undefined,
    location: row.location || undefined,
    updatedAt: row.updated_at,
    syncStatus: syncStatusFor("halls", row.id),
  };
}

function sessionToRow(session: SessionInfo): SessionRow {
  return {
    id: session.id,
    course_id: session.courseId || null,
    hall_id: session.hallId || null,
    course: session.course,
    hall: session.venue,
    start_time: session.startTime,
    end_time: session.endTime || null,
    is_active: session.isActive,
  };
}

function rowToSession(row: SessionRow): SessionInfo {
  return {
    id: row.id,
    courseId: row.course_id || undefined,
    hallId: row.hall_id || undefined,
    course: row.course,
    venue: row.hall,
    startTime: row.start_time,
    endTime: row.end_time || undefined,
    isActive: row.is_active,
    syncStatus: syncStatusFor("attendance_sessions", row.id),
  };
}

function recordToRow(record: AttendanceRecord): RecordRow {
  return {
    id: record.id,
    session_id: record.sessionId || null,
    student_id: record.studentId || null,
    student_name: record.studentName,
    matric_number: record.matricNumber,
    course_id: record.courseId || null,
    hall_id: record.hallId || null,
    course: record.course,
    hall: record.venue,
    status: record.status,
    method: record.method,
    confidence: record.confidence ?? null,
    timestamp: record.timestamp,
  };
}

function rowToRecord(row: RecordRow): AttendanceRecord {
  return {
    id: row.id,
    sessionId: row.session_id || undefined,
    studentId: row.student_id || undefined,
    studentName: row.student_name,
    matricNumber: row.matric_number,
    courseId: row.course_id || undefined,
    hallId: row.hall_id || undefined,
    course: row.course,
    venue: row.hall,
    status: row.status,
    method: row.method,
    confidence: row.confidence ?? undefined,
    timestamp: row.timestamp,
    syncStatus: syncStatusFor("attendance_records", row.id),
  };
}

function saveLocalStudents(students: Student[]): void {
  writeStoredArray(STUDENTS_KEY, students);
}

function saveLocalCourses(courses: Course[]): void {
  writeStoredArray(COURSES_KEY, courses);
}

function saveLocalHalls(halls: Hall[]): void {
  writeStoredArray(HALLS_KEY, halls);
}

function saveLocalSessions(sessions: SessionInfo[]): void {
  writeStoredArray(SESSIONS_KEY, sessions);
}

function saveLocalRecords(records: AttendanceRecord[]): void {
  writeStoredArray(RECORDS_KEY, records);
}

export function getStoredStudents(): Student[] | null {
  const students = readStoredArray<Student>(STUDENTS_KEY);
  if (students.length === 0) return null;

  return students.map((student) => ({
    ...student,
    id: student.id || `student-${student.matric}`,
    syncStatus: syncStatusFor("students", student.id || `student-${student.matric}`),
  }));
}

export function getStoredSessions(): SessionInfo[] {
  return readStoredArray<SessionInfo>(SESSIONS_KEY).map((session) => ({
    ...session,
    syncStatus: syncStatusFor("attendance_sessions", session.id),
  }));
}

export function getStoredRecords(): AttendanceRecord[] {
  return readStoredArray<AttendanceRecord>(RECORDS_KEY)
    .map((record) => ({
      ...record,
      syncStatus: syncStatusFor("attendance_records", record.id),
    }))
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export function saveStudents(students: Student[]): void {
  saveLocalStudents(
    students.map((student) => ({
      ...student,
      id: student.id || `student-${student.matric}`,
    }))
  );
}

export async function loadStudents(): Promise<Student[]> {
  try {
    const rows = await readRemoteRows<StudentRow>("students", "updated_at");
    if (rows && rows.length > 0) {
      const students = rows.map(rowToStudent);
      saveLocalStudents(students);
      return students;
    }
  } catch (err) {
    console.warn("Supabase students load failed, using local cache", err);
  }

  return getStoredStudents() || [];
}

export async function seedStudents(students: Student[]): Promise<Student[]> {
  const existing = await loadStudents();
  if (existing.length > 0) return existing;

  const seeded = students.map((student) => ({
    ...student,
    id: student.id || `student-${student.matric}`,
    syncStatus: isSupabaseConfigured() ? "synced" : "pending",
  })) satisfies Student[];
  saveLocalStudents(seeded);

  await Promise.all(
    seeded.map((student) => upsertStudent(student, { skipLocal: true }))
  );

  return getStoredStudents() || seeded;
}

export async function upsertStudent(
  student: Student,
  options?: { skipLocal?: boolean }
): Promise<SyncStatus> {
  const row = studentToRow(student);
  const nextStudent = rowToStudent(row);
  const students = getStoredStudents() || [];
  const nextStudents = [
    nextStudent,
    ...students.filter((item) => item.id !== row.id),
  ];

  if (!options?.skipLocal) saveLocalStudents(nextStudents);

  try {
    await remoteUpsert("students", row);
    saveLocalStudents(
      nextStudents.map((item) =>
        item.id === row.id ? { ...item, syncStatus: "synced" } : item
      )
    );
    return "synced";
  } catch (err) {
    queueOfflineOperation("students", "upsert", row.id, row, err);
    saveLocalStudents(
      nextStudents.map((item) =>
        item.id === row.id ? { ...item, syncStatus: syncStatusFor("students", row.id) } : item
      )
    );
    return syncStatusFor("students", row.id);
  }
}

export async function deleteStudent(id: string): Promise<SyncStatus> {
  saveLocalStudents((getStoredStudents() || []).filter((student) => student.id !== id));

  try {
    await remoteDelete("students", id);
    return "synced";
  } catch (err) {
    queueOfflineOperation("students", "delete", id, undefined, err);
    return syncStatusFor("students", id);
  }
}

export async function loadCourses(): Promise<Course[]> {
  try {
    const rows = await readRemoteRows<CourseRow>("courses", "updated_at");
    if (rows && rows.length > 0) {
      const courses = rows.map(rowToCourse);
      saveLocalCourses(courses);
      return courses;
    }
  } catch (err) {
    console.warn("Supabase courses load failed, using local cache", err);
  }

  const stored = readStoredArray<Course>(COURSES_KEY);
  if (stored.length > 0) {
    return stored.map((course) => ({
      ...course,
      syncStatus: syncStatusFor("courses", course.id),
    }));
  }

  saveLocalCourses(DEFAULT_COURSES);
  await Promise.all(DEFAULT_COURSES.map((course) => upsertCourse(course)));
  return readStoredArray<Course>(COURSES_KEY);
}

export async function upsertCourse(course: Course): Promise<SyncStatus> {
  const row = courseToRow(course);
  const nextCourse = rowToCourse(row);
  const courses = readStoredArray<Course>(COURSES_KEY);
  const nextCourses = [
    nextCourse,
    ...courses.filter((item) => item.id !== row.id),
  ];
  saveLocalCourses(nextCourses);

  try {
    await remoteUpsert("courses", row);
    saveLocalCourses(
      nextCourses.map((item) =>
        item.id === row.id ? { ...item, syncStatus: "synced" } : item
      )
    );
    return "synced";
  } catch (err) {
    queueOfflineOperation("courses", "upsert", row.id, row, err);
    saveLocalCourses(
      nextCourses.map((item) =>
        item.id === row.id ? { ...item, syncStatus: syncStatusFor("courses", row.id) } : item
      )
    );
    return syncStatusFor("courses", row.id);
  }
}

export async function deleteCourse(id: string): Promise<SyncStatus> {
  saveLocalCourses(readStoredArray<Course>(COURSES_KEY).filter((course) => course.id !== id));

  try {
    await remoteDelete("courses", id);
    return "synced";
  } catch (err) {
    queueOfflineOperation("courses", "delete", id, undefined, err);
    return syncStatusFor("courses", id);
  }
}

export async function loadHalls(): Promise<Hall[]> {
  try {
    const rows = await readRemoteRows<HallRow>("halls", "updated_at");
    if (rows && rows.length > 0) {
      const halls = rows.map(rowToHall);
      saveLocalHalls(halls);
      return halls;
    }
  } catch (err) {
    console.warn("Supabase halls load failed, using local cache", err);
  }

  const stored = readStoredArray<Hall>(HALLS_KEY);
  if (stored.length > 0) {
    return stored.map((hall) => ({
      ...hall,
      syncStatus: syncStatusFor("halls", hall.id),
    }));
  }

  saveLocalHalls(DEFAULT_HALLS);
  await Promise.all(DEFAULT_HALLS.map((hall) => upsertHall(hall)));
  return readStoredArray<Hall>(HALLS_KEY);
}

export async function upsertHall(hall: Hall): Promise<SyncStatus> {
  const row = hallToRow(hall);
  const nextHall = rowToHall(row);
  const halls = readStoredArray<Hall>(HALLS_KEY);
  const nextHalls = [
    nextHall,
    ...halls.filter((item) => item.id !== row.id),
  ];
  saveLocalHalls(nextHalls);

  try {
    await remoteUpsert("halls", row);
    saveLocalHalls(
      nextHalls.map((item) =>
        item.id === row.id ? { ...item, syncStatus: "synced" } : item
      )
    );
    return "synced";
  } catch (err) {
    queueOfflineOperation("halls", "upsert", row.id, row, err);
    saveLocalHalls(
      nextHalls.map((item) =>
        item.id === row.id ? { ...item, syncStatus: syncStatusFor("halls", row.id) } : item
      )
    );
    return syncStatusFor("halls", row.id);
  }
}

export async function deleteHall(id: string): Promise<SyncStatus> {
  saveLocalHalls(readStoredArray<Hall>(HALLS_KEY).filter((hall) => hall.id !== id));

  try {
    await remoteDelete("halls", id);
    return "synced";
  } catch (err) {
    queueOfflineOperation("halls", "delete", id, undefined, err);
    return syncStatusFor("halls", id);
  }
}

export async function loadSessions(): Promise<SessionInfo[]> {
  try {
    const rows = await readRemoteRows<SessionRow>("attendance_sessions", "start_time");
    if (rows) {
      const sessions = rows.map(rowToSession);
      saveLocalSessions(sessions);
      return sessions;
    }
  } catch (err) {
    console.warn("Supabase sessions load failed, using local cache", err);
  }

  return getStoredSessions();
}

export async function upsertAttendanceSession(
  session: SessionInfo
): Promise<SyncStatus> {
  const row = sessionToRow(session);
  const sessions = getStoredSessions();
  const nextSession = rowToSession(row);
  const nextSessions = [
    nextSession,
    ...sessions.filter((item) => item.id !== row.id),
  ];
  saveLocalSessions(nextSessions);

  try {
    await remoteUpsert("attendance_sessions", row);
    saveLocalSessions(
      nextSessions.map((item) =>
        item.id === row.id ? { ...item, syncStatus: "synced" } : item
      )
    );
    return "synced";
  } catch (err) {
    queueOfflineOperation("attendance_sessions", "upsert", row.id, row, err);
    saveLocalSessions(
      nextSessions.map((item) =>
        item.id === row.id
          ? { ...item, syncStatus: syncStatusFor("attendance_sessions", row.id) }
          : item
      )
    );
    return syncStatusFor("attendance_sessions", row.id);
  }
}

export async function loadAttendanceRecords(): Promise<AttendanceRecord[]> {
  try {
    const rows = await readRemoteRows<RecordRow>("attendance_records", "timestamp");
    if (rows) {
      const records = rows.map(rowToRecord);
      saveLocalRecords(records);
      return records;
    }
  } catch (err) {
    console.warn("Supabase records load failed, using local cache", err);
  }

  return getStoredRecords();
}

export async function upsertAttendanceRecord(
  record: AttendanceRecord
): Promise<SyncStatus> {
  const row = recordToRow(record);
  const records = getStoredRecords();
  const nextRecord = rowToRecord(row);
  const nextRecords = [
    nextRecord,
    ...records.filter((item) => item.id !== row.id),
  ];
  saveLocalRecords(nextRecords);

  try {
    await remoteUpsert("attendance_records", row);
    saveLocalRecords(
      nextRecords.map((item) =>
        item.id === row.id ? { ...item, syncStatus: "synced" } : item
      )
    );
    return "synced";
  } catch (err) {
    queueOfflineOperation("attendance_records", "upsert", row.id, row, err);
    saveLocalRecords(
      nextRecords.map((item) =>
        item.id === row.id
          ? { ...item, syncStatus: syncStatusFor("attendance_records", row.id) }
          : item
      )
    );
    return syncStatusFor("attendance_records", row.id);
  }
}

export async function flushPendingOperations(): Promise<{
  synced: number;
  failed: number;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { synced: 0, failed: getPendingCount() };

  const operations = getPendingOperations();
  const remaining: PendingOperation[] = [];
  let synced = 0;
  let failed = 0;

  for (const operation of operations) {
    try {
      if (operation.action === "delete") {
        await remoteDelete(operation.table, operation.recordId);
      } else if (operation.payload) {
        await remoteUpsert(operation.table, operation.payload);
      }
      synced++;
    } catch (err) {
      remaining.push({
        ...operation,
        attempts: operation.attempts + 1,
        lastError: err instanceof Error ? err.message : String(err),
      });
      failed++;
    }
  }

  writePendingOperations(remaining);
  return { synced, failed };
}

export function setupPendingSyncListener(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    flushPendingOperations().catch((err) => {
      console.warn("Pending sync failed", err);
    });
  });
}

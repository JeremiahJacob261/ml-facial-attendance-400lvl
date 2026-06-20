export type SyncStatus = "synced" | "pending" | "failed";

export interface Student {
  id?: string;
  name: string;
  matric: string;
  embedding?: number[];
  photo_url?: string;
  syncStatus?: SyncStatus;
  updatedAt?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  syncStatus?: SyncStatus;
  updatedAt?: string;
}

export interface Hall {
  id: string;
  name: string;
  capacity?: number;
  location?: string;
  syncStatus?: SyncStatus;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId?: string;
  studentId?: string;
  studentName: string;
  matricNumber: string;
  timestamp: string;
  courseId?: string;
  hallId?: string;
  course: string;
  venue: string;
  status: "present" | "absent";
  method: "biometric" | "manual";
  confidence?: number;
  syncStatus?: SyncStatus;
}

export interface SessionInfo {
  id: string;
  courseId?: string;
  hallId?: string;
  course: string;
  venue: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  syncStatus?: SyncStatus;
}

export interface RecognitionResult {
  matched: boolean;
  student: Student | null;
  distance: number;
  confidence: number;
}

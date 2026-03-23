export interface Student {
  name: string;
  matric: string;
  embedding: number[];
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  matricNumber: string;
  timestamp: string;
  course: string;
  venue: string;
  status: "present" | "absent";
  method: "biometric" | "manual";
  confidence?: number;
}

export interface SessionInfo {
  id: string;
  course: string;
  venue: string;
  startTime: string;
  isActive: boolean;
}

export interface RecognitionResult {
  matched: boolean;
  student: Student | null;
  distance: number;
  confidence: number;
}

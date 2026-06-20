export interface Student {
  id?: string;
  name: string;
  matric: string;
  embedding?: number[];
  photo_url?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
}

export interface Hall {
  id: string;
  name: string;
  capacity?: number;
  location?: string;
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

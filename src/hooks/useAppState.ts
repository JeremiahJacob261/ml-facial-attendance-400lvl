"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Student, AttendanceRecord, SessionInfo, RecognitionResult } from "@/types";
import { getStudents, getStudentCount } from "@/lib/csv/loader";
import { findBestMatch, DEFAULT_THRESHOLD } from "@/services/recognition";
import {
  startSession,
  getCurrentSession,
  endSession,
  recordAttendance,
  getSessionRecords,
  getAllRecords,
  getPresentCount,
  hydrateAttendance,
} from "@/services/attendance";
import {
  flushPendingOperations,
  setupPendingSyncListener,
} from "@/services/localData";

export interface AppState {
  // Data
  students: Student[];
  studentCount: number;
  isDataLoaded: boolean;
  dataError: string | null;

  // Session
  session: SessionInfo | null;
  sessionRecords: AttendanceRecord[];
  allRecords: AttendanceRecord[];
  presentCount: number;

  // Recognition
  lastResult: RecognitionResult | null;

  // Toast
  toast: { message: string; type: "success" | "error" | "info" } | null;

  // Actions
  loadData: () => Promise<void>;
  startNewSession: (course: string, venue: string) => void;
  endCurrentSession: () => void;
  recognizeAndRecord: (
    embedding: Float32Array,
    course: string,
    venue: string
  ) => RecognitionResult;
  refreshRecords: () => Promise<void>;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  dismissToast: () => void;
}

export function useAppState(): AppState {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [presentCount, setPresentCount] = useState(0);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToast({ message, type });
      toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setDataError(null);
      const data = await getStudents();
      setStudents(data);
      setIsDataLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load student data";
      setDataError(message);
      showToast(message, "error");
    }
  }, [showToast]);

  const startNewSession = useCallback(
    (course: string, venue: string) => {
      const s = startSession(course, venue);
      setSession(s);
      setSessionRecords([]);
      setPresentCount(0);
      showToast(`Session started: ${course}`, "success");
    },
    [showToast]
  );

  const endCurrentSession = useCallback(() => {
    endSession();
    setSession(getCurrentSession());
    showToast("Session ended", "info");
  }, [showToast]);

  const refreshRecords = useCallback(async () => {
    try {
      await flushPendingOperations();
      const hydrated = await hydrateAttendance();
      setSession(hydrated.session);
    } catch (err) {
      console.warn("Attendance hydration failed, using local records", err);
    }
    setSessionRecords(getSessionRecords());
    setAllRecords(getAllRecords());
    setPresentCount(getPresentCount());
  }, []);

  const recognizeAndRecord = useCallback(
    (embedding: Float32Array, course: string, venue: string): RecognitionResult => {
      let currentThreshold = DEFAULT_THRESHOLD;
      if (typeof window !== 'undefined') {
        const savedThreshold = localStorage.getItem("recognition_threshold");
        if (savedThreshold) {
          currentThreshold = parseFloat(savedThreshold);
        }
      }
      const result = findBestMatch(embedding, students, currentThreshold);
      setLastResult(result);

      if (result.matched && result.student) {
        const { success, message } = recordAttendance(
          result.student.name,
          result.student.matric,
          course,
          venue,
          result.confidence
        );

        if (success) {
          showToast(`Attendance Recorded: ${result.student.name}`, "success");
        } else {
          showToast(message, "info");
        }

        refreshRecords().catch((err) => {
          console.warn("Record refresh failed", err);
        });
      } else {
        showToast("Face Not Recognized", "error");
      }

      return result;
    },
    [students, refreshRecords, showToast]
  );

  // Load data on mount
  useEffect(() => {
    void loadData();
    void refreshRecords();
    setupPendingSyncListener();
  }, [loadData, refreshRecords]);

  return {
    students,
    studentCount: getStudentCount() || students.length,
    isDataLoaded,
    dataError,
    session,
    sessionRecords,
    allRecords,
    presentCount,
    lastResult,
    toast,
    loadData,
    startNewSession,
    endCurrentSession,
    recognizeAndRecord,
    refreshRecords,
    showToast,
    dismissToast,
  };
}

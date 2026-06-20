"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { useAppState } from "@/hooks/useAppState";
import { getCourses, getHalls } from "@/services/localData";
import type { Course, Hall } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const {
    studentCount,
    isDataLoaded,
    session,
    sessionRecords,
    presentCount,
    toast,
    startNewSession,
    dismissToast,
    refreshRecords,
  } = useAppState();

  const [courses, setCourses] = useState<Course[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [sessionLabel, setSessionLabel] = useState("");

  useEffect(() => {
    refreshRecords();
    const availableCourses = getCourses();
    const availableHalls = getHalls();
    setCourses(availableCourses);
    setHalls(availableHalls);
    setSelectedCourse((current) => current || availableCourses[0]?.title || "");
    setSelectedVenue((current) => current || availableHalls[0]?.name || "");
    // Client-only date formatting to avoid hydration mismatch
    const now = new Date();
    setDateStr(now.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    setSessionLabel(now.getHours() < 12 ? "Morning Session" : "Afternoon Session");
  }, [refreshRecords]);

  const totalEnrolled = studentCount || 48;
  const present = presentCount;
  const absent = totalEnrolled - present;
  const attendanceRate =
    totalEnrolled > 0 ? Math.round((present / totalEnrolled) * 100) : 0;

  const handleStartSession = () => {
    if (!selectedCourse || !selectedVenue) {
      return;
    }
    startNewSession(selectedCourse, selectedVenue);
    router.push("/attendance");
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <TopHeader subtitle={`CS302 • ${sessionLabel} • ${dateStr}`} />

      <main className="pt-24 px-6 max-w-7xl mx-auto">
        {/* Editorial Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Primary Action Card (Large / Mark Attendance) */}
          <section className="md:col-span-8 md:row-span-2 bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-flex items-center rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container mb-2">
                    {session?.isActive ? "SESSION ACTIVE" : "READY TO SCAN"}
                  </span>
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                    Mark Attendance
                  </h2>
                  <p className="text-on-surface-variant mt-1">
                    Initialize biometric facial recognition for the current
                    session.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                        Select Course
                      </label>
                      <div className="relative flex items-center group">
                        <select
                          className="appearance-none w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          disabled={courses.length === 0}
                        >
                          {courses.map((course) => (
                            <option key={course.id} value={course.title}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                        Select Venue
                      </label>
                      <div className="relative flex items-center group">
                        <select
                          className="appearance-none w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                          value={selectedVenue}
                          onChange={(e) => setSelectedVenue(e.target.value)}
                          disabled={halls.length === 0}
                        >
                          {halls.map((hall) => (
                            <option key={hall.id} value={hall.name}>
                              {hall.name}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-4xl text-primary opacity-20">
                  center_focus_weak
                </span>
              </div>
              {/* Camera Viewfinder Placeholder */}
              <div className="aspect-video w-full bg-surface-container-low rounded-2xl relative flex items-center justify-center border-2 border-dashed border-outline-variant/30 overflow-hidden group mt-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
                <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-primary-fixed opacity-40 rounded-tl-lg"></div>
                <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-primary-fixed opacity-40 rounded-tr-lg"></div>
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-primary-fixed opacity-40 rounded-bl-lg"></div>
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-primary-fixed opacity-40 rounded-br-lg"></div>
                <div className="text-center z-10">
                  <span className="material-symbols-outlined text-5xl text-outline mb-3">
                    camera_front
                  </span>
                  <p className="text-sm font-medium text-outline">
                    Camera inactive
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-end gap-3 relative z-10">
              <button
                onClick={() => router.push("/attendance")}
                className="px-6 py-3 rounded-2xl font-semibold text-primary hover:bg-primary-fixed/20 transition-colors"
              >
                Camera Settings
              </button>
              <button
                onClick={handleStartSession}
                disabled={!selectedCourse || !selectedVenue}
                className="px-8 py-3 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
                Start Session
              </button>
            </div>
          </section>

          {/* Today's Summary Card */}
          <section className="md:col-span-4 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-6">
                Today&apos;s Summary
              </h3>
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-on-surface-variant font-medium">
                      Total Enrolled
                    </p>
                    <p className="text-3xl font-extrabold text-on-surface">
                      {totalEnrolled}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-on-surface-variant font-medium">
                      Present
                    </p>
                    <p className="text-3xl font-extrabold text-primary">
                      {present}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    <span>Attendance Rate</span>
                    <span>{attendanceRate}%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-surface-container flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                <span className="text-xs font-medium text-on-surface-variant">
                  {absent} Absent
                </span>
              </div>
              <button
                onClick={() => router.push("/records")}
                className="text-secondary text-xs font-bold hover:underline"
              >
                View Records
              </button>
            </div>
          </section>

          {/* Live Session Card */}
          <section className="md:col-span-4 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-on-surface">
                Live Session
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary-container/10 rounded-lg">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${session?.isActive ? "bg-primary animate-pulse" : "bg-outline"}`}
                ></span>
                <span
                  className={`text-[10px] font-bold uppercase ${session?.isActive ? "text-primary" : "text-outline"}`}
                >
                  {session?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4">
              <p className="text-xs font-bold text-on-surface-variant mb-1">
                COURSE NAME
              </p>
              <p className="text-base font-bold text-on-surface leading-tight">
                {session?.course || selectedCourse}
              </p>
              {(!selectedCourse || !selectedVenue) && (
                <p className="text-xs text-error mt-3 font-medium">
                  Add at least one course and hall from Admin to start a session.
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>
                <span className="text-xs font-medium">
                  {session?.startTime
                    ? `Started at ${new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Not started"}
                </span>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="md:col-span-6 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">
                Recent Activity
              </h3>
              <span className="material-symbols-outlined text-outline">
                history
              </span>
            </div>
            <div className="space-y-4">
              {sessionRecords.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">
                  No attendance records yet. Start a session to begin.
                </p>
              ) : (
                sessionRecords.slice(0, 3).map((record) => {
                  const initials = record.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2);
                  const time = new Date(record.timestamp).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  );
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-container-low transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {record.studentName}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            ID: {record.matricNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">
                          {time}
                        </p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-medium">
                          Verified
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* System Status */}
          <section className="md:col-span-6 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
            <h3 className="text-lg font-bold text-on-surface mb-6">
              System Health
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-sm">
                    videocam
                  </span>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Camera
                  </p>
                </div>
                <p className="text-sm font-bold text-on-surface">Ready</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-sm">
                    psychology
                  </span>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Recognition
                  </p>
                </div>
                <p className="text-sm font-bold text-on-surface">
                  {isDataLoaded ? "Ready" : "Loading..."}
                </p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    cloud_off
                  </span>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Offline Mode
                  </p>
                </div>
                <p className="text-sm font-bold text-on-surface">Enabled</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-tertiary text-sm">
                    database
                  </span>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    CSV Data
                  </p>
                </div>
                <p className="text-sm font-bold text-on-surface">
                  {isDataLoaded ? `${studentCount} Students` : "Loading..."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}

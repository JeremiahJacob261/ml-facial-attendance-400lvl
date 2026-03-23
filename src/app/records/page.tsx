"use client";

import { useState, useEffect } from "react";
import TopHeader from "@/components/TopHeader";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { useAppState } from "@/hooks/useAppState";
import { downloadCSV } from "@/services/export";
import type { AttendanceRecord } from "@/types";

export default function RecordsPage() {
  const { allRecords, toast, dismissToast, refreshRecords, showToast } =
    useAppState();

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Get unique courses from records
  const courses = Array.from(
    new Set(allRecords.map((r) => r.course))
  ).filter(Boolean);

  // Filter records
  const filteredRecords = allRecords.filter((record) => {
    const matchesSearch =
      !searchQuery ||
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.course.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate =
      !dateFilter ||
      new Date(record.timestamp).toISOString().split("T")[0] === dateFilter;

    const matchesCourse =
      courseFilter === "all" || record.course === courseFilter;

    return matchesSearch && matchesDate && matchesCourse;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      showToast("No records to export", "info");
      return;
    }
    downloadCSV(filteredRecords);
    showToast(`Exported ${filteredRecords.length} records`, "success");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) +
      ", " +
      d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <TopHeader />

      <main className="max-w-7xl mx-auto px-6 pt-24 space-y-8">
        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">
              Records Explorer
            </h2>
            <p className="text-on-surface-variant text-sm">
              Managing {allRecords.length} attendance entries
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl font-semibold shadow-[0_12px_32px_rgba(13,99,27,0.15)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-xl">download</span>
            <span>Download CSV</span>
          </button>
        </div>

        {/* Filtering System */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Search */}
          <div className="md:col-span-6 bg-surface-container-lowest p-6 rounded-xl space-y-4">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest">
              Global Search
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-outline">
                search
              </span>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary text-on-surface placeholder:text-outline-variant outline-none"
                placeholder="Search student name, ID or course..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="md:col-span-3 bg-surface-container-lowest p-6 rounded-xl space-y-4">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest">
              Session Date
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-outline">
                calendar_today
              </span>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary text-on-surface outline-none"
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Course Filter */}
          <div className="md:col-span-3 bg-surface-container-lowest p-6 rounded-xl space-y-4">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest">
              Course Catalog
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-outline">
                school
              </span>
              <select
                className="w-full bg-surface-container-low border-none rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-secondary text-on-surface appearance-none outline-none"
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Courses</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 pb-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Historical Entries
            </span>
            <span className="text-xs font-medium text-outline">
              Showing {paginatedRecords.length} of {filteredRecords.length}
            </span>
          </div>

          {paginatedRecords.length === 0 ? (
            <div className="bg-surface-container-lowest p-12 rounded-xl text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">
                history_edu
              </span>
              <p className="text-on-surface-variant font-medium">
                No attendance records found
              </p>
              <p className="text-on-surface-variant/70 text-sm mt-1">
                Start a session from the dashboard to begin recording
                attendance.
              </p>
            </div>
          ) : (
            paginatedRecords.map((record) => (
              <div
                key={record.id}
                className="bg-surface-container-lowest p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-surface-container-low group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-on-surface-variant">
                    {getInitials(record.studentName)}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-none">
                      {record.studentName}
                    </h4>
                    <p className="text-on-surface-variant text-sm mt-1">
                      ID: {record.matricNumber}
                    </p>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 md:px-8">
                  <div>
                    <p className="text-[10px] font-bold text-outline uppercase">
                      Course
                    </p>
                    <p className="text-sm font-semibold">{record.course}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-outline uppercase">
                      Timestamp
                    </p>
                    <p className="text-sm font-semibold">
                      {formatTimestamp(record.timestamp)}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[10px] font-bold text-outline uppercase">
                      Method
                    </p>
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <span className="material-symbols-outlined text-[16px]">
                        {record.method === "biometric" ? "face" : "edit_note"}
                      </span>
                      {record.method === "biometric"
                        ? "Biometric"
                        : "Manual Entry"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold tracking-wide ${
                      record.status === "present"
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-tertiary-container text-on-tertiary-container"
                    }`}
                  >
                    {record.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${
                    currentPage === page
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            {totalPages > 5 && (
              <span className="px-2 text-outline">...</span>
            )}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-30"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
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

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import BottomNav from "@/components/BottomNav";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get("name") || "Unknown Student";
  const matric = searchParams.get("matric") || "N/A";
  const confidence = parseFloat(searchParams.get("confidence") || "0");
  const course = searchParams.get("course") || "N/A";
  const venue = searchParams.get("venue") || "N/A";
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white flex justify-between items-center px-6 py-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              school
            </span>
          </div>
          <h1 className="font-inter font-bold text-xl tracking-tight text-primary">
            Attendance Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95 duration-150 text-on-surface-variant">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>
      <div className="bg-surface-container-low h-[1px] w-full"></div>

      {/* Main Canvas: Editorial Bento Layout */}
      <main className="flex-grow p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: The Scanning Result */}
          <div className="lg:col-span-7 space-y-6">
            {/* Result Status Header */}
            <div className="flex flex-col gap-2">
              <span className="text-secondary font-bold tracking-widest text-[10px] uppercase">
                Biometric Verification System
              </span>
              <h2 className="font-inter font-extrabold text-4xl lg:text-5xl text-on-surface leading-tight">
                Verification Successful
              </h2>
            </div>

            {/* Passport Preview Card */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 border-outline-variant/10 flex flex-col md:flex-row gap-8 items-center md:items-stretch overflow-hidden">
              {/* Passport Frame */}
              <div className="relative w-64 h-80 flex-shrink-0 bg-surface-container rounded-2xl overflow-hidden border-4 border-primary-fixed/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-9xl text-outline/30">
                  person
                </span>
                {/* Viewfinder corners */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary-fixed"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary-fixed"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary-fixed"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary-fixed"></div>
              </div>

              {/* Details Content */}
              <div className="flex flex-col justify-center flex-grow text-center md:text-left">
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-bold uppercase tracking-wider">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    Attendance Recorded
                  </span>
                </div>
                <h3 className="font-inter font-bold text-3xl text-on-surface">
                  {name}
                </h3>
                <p className="text-on-surface-variant font-medium text-lg mt-1">
                  {matric}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low text-left">
                    <p className="text-xs font-bold text-on-surface-variant uppercase opacity-70">
                      Course Code
                    </p>
                    <p className="text-sm font-bold mt-1">{course}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low text-left">
                    <p className="text-xs font-bold text-on-surface-variant uppercase opacity-70">
                      Timestamp
                    </p>
                    <p className="text-sm font-bold mt-1">{time}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Context & Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Biometric Confidence */}
            <div className="bg-surface-container-lowest rounded-3xl p-8 border-outline-variant/10">
              <h4 className="font-inter font-bold text-xl mb-4">
                Biometric Confidence
              </h4>
              <div className="space-y-6">
                <div className="relative h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(confidence, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-on-surface-variant">
                    Match Score: {confidence.toFixed(1)}%
                  </span>
                  <span className="text-primary">Verified Secure</span>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary">
                    info
                  </span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Identity verified against local CSV dataset. Face vectors
                    match stored enrollment data.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Actions */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => router.push("/attendance")}
                className="w-full py-5 px-8 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-lg shadow-[0_12px_32px_rgba(13,99,27,0.15)] hover:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Scan Next Student
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button
                onClick={() => router.push("/attendance")}
                className="w-full py-5 px-8 rounded-2xl bg-surface-container-low text-secondary font-bold text-lg hover:bg-surface-container transition-colors active:scale-95 flex items-center justify-center gap-2 border border-transparent active:border-secondary/20"
              >
                <span className="material-symbols-outlined">refresh</span>
                Retry Scan
              </button>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-center gap-8 py-4 opacity-50">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-tighter">
                  Location
                </span>
                <span className="text-xs font-bold">{venue}</span>
              </div>
              <div className="w-[1px] h-8 bg-on-surface-variant/20"></div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-tighter">
                  Device ID
                </span>
                <span className="text-xs font-bold">AS-REG-009</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />

      {/* Spacer for bottom nav */}
      <div className="h-28 flex-shrink-0"></div>
    </div>
  );
}

export default function AttendanceResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <p className="text-on-surface-variant">Loading result...</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

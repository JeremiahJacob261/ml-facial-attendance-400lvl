"use client";

import { useState, useEffect } from "react";
import TopHeader from "@/components/TopHeader";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { useAppState } from "@/hooks/useAppState";
import { clearStudentCache } from "@/lib/csv/loader";
import { DEFAULT_THRESHOLD } from "@/services/recognition";

export default function SettingsPage() {
  const { studentCount, isDataLoaded, toast, showToast, dismissToast, loadData } =
    useAppState();

  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

  useEffect(() => {
    const savedThreshold = localStorage.getItem("recognition_threshold");
    if (savedThreshold) {
      setThreshold(parseFloat(savedThreshold));
    }
  }, []);

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    localStorage.setItem("recognition_threshold", val.toString());
  };

  const handleReloadData = async () => {
    clearStudentCache();
    await loadData();
    showToast("Student data reloaded", "success");
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <TopHeader subtitle="System Configuration" />

      <main className="max-w-7xl mx-auto px-6 pt-24 space-y-6">
        <div className="space-y-1 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-on-surface-variant text-sm">
            Configure system parameters and data sources
          </p>
        </div>

        {/* Data Source */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              database
            </span>
            <h3 className="text-lg font-bold text-on-surface">
              Data Source
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
              <div>
                <p className="font-medium text-on-surface">Student Data</p>
                <p className="text-sm text-on-surface-variant">
                  Supabase primary, local fallback, CSV seed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isDataLoaded ? "bg-primary" : "bg-error"}`}
                ></span>
                <span className="text-xs font-bold text-on-surface-variant">
                  {isDataLoaded ? `${studentCount} loaded` : "Not loaded"}
                </span>
              </div>
            </div>
            <button
              onClick={handleReloadData}
              className="w-full py-3 px-6 rounded-2xl bg-surface-container-low text-secondary font-semibold hover:bg-surface-container transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                refresh
              </span>
              Reload Student Data
            </button>
          </div>
        </section>

        {/* Recognition Settings */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              psychology
            </span>
            <h3 className="text-lg font-bold text-on-surface">
              Recognition Engine
            </h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-on-surface">
                  Matching Threshold
                </p>
                <span className="text-sm font-bold text-primary">
                  {threshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                <span>Strict (0.3)</span>
                <span>Lenient (0.9)</span>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">Algorithm</p>
                  <p className="text-sm text-on-surface-variant">
                    Euclidean Distance (face-api.js)
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary text-sm">
                  check_circle
                </span>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">Model</p>
                  <p className="text-sm text-on-surface-variant">
                    TinyFaceDetector + FaceRecognitionNet
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary text-sm">
                  check_circle
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Camera Settings */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              videocam
            </span>
            <h3 className="text-lg font-bold text-on-surface">
              Camera Configuration
            </h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">Facing Mode</p>
                  <p className="text-sm text-on-surface-variant">
                    Front-facing camera (user)
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">
                  flip_camera_ios
                </span>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">Auto-Capture</p>
                  <p className="text-sm text-on-surface-variant">
                    Capture after 3 consecutive detections
                  </p>
                </div>
                <div className="w-10 h-6 bg-primary rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Info */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">info</span>
            <h3 className="text-lg font-bold text-on-surface">System Info</h3>
          </div>
          <div className="space-y-3">
            {[
              ["Application", "Academic Sentinel v1.0"],
              ["Framework", "Next.js (App Router)"],
              ["Recognition", "face-api.js"],
              ["Data Source", "Supabase + Local Fallback"],
              ["Storage", "Supabase Primary"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-on-surface-variant">{label}</span>
                <span className="text-sm font-semibold text-on-surface">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>
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

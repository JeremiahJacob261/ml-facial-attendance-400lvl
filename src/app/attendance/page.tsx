"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { useAppState } from "@/hooks/useAppState";
import { loadCourses, loadHalls } from "@/services/localData";
import "@/types/face-api.d.ts";

export default function AttendancePage() {
  const router = useRouter();
  const {
    students,
    isDataLoaded,
    session,
    toast,
    startNewSession,
    recognizeAndRecord,
    dismissToast,
    showToast,
  } = useAppState();

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStatus, setScanStatus] = useState<
    "idle" | "scanning" | "identifying" | "matched" | "unknown"
  >("idle");
  const [matchedName, setMatchedName] = useState("");
  const [matchedMatric, setMatchedMatric] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [defaultCourse, setDefaultCourse] = useState("");
  const [defaultVenue, setDefaultVenue] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          window.faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          window.faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Failed to load face models:", err);
        showToast("Failed to load face recognition models", "error");
      }
    };

    if (typeof window !== "undefined" && window.faceapi) {
      loadModels();
    } else {
      const iv = setInterval(() => {
        if (typeof window !== "undefined" && window.faceapi) {
          clearInterval(iv);
          loadModels();
        }
      }, 200);
      return () => clearInterval(iv);
    }
  }, [showToast]);

  useEffect(() => {
    const loadDefaults = async () => {
      const [availableCourses, availableHalls] = await Promise.all([
        loadCourses(),
        loadHalls(),
      ]);
      setDefaultCourse(availableCourses[0]?.title || "");
      setDefaultVenue(availableHalls[0]?.name || "");
    };
    void loadDefaults();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraReady(true);
        setScanStatus("scanning");
      }
    } catch (err) {
      console.error("Camera error:", err);
      showToast("Camera Error: Unable to access camera", "error");
    }
  }, [showToast]);

  // Start camera when models are loaded
  useEffect(() => {
    if (!isModelLoading) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isModelLoading, startCamera]);

  // Auto-detect faces
  useEffect(() => {
    if (!isCameraReady || isModelLoading || !videoRef.current || !canvasRef.current)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    let consecutiveDetections = 0;
    const REQUIRED_DETECTIONS = 3;

    const detect = async () => {
      if (isProcessing || scanStatus === "matched") return;

      try {
        const detection = await window.faceapi
          .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        // Update canvas
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          const resized = window.faceapi.resizeResults(detection, {
            width: canvas.width,
            height: canvas.height,
          });
          window.faceapi.draw.drawDetections(canvas, resized);

          consecutiveDetections++;
          setScanStatus("identifying");

          if (consecutiveDetections >= REQUIRED_DETECTIONS && !isProcessing) {
            setIsProcessing(true);
            consecutiveDetections = 0;

            // Auto-capture and recognize
            const course = session?.course || defaultCourse;
            const venue = session?.venue || defaultVenue;

            if (!course || !venue) {
              showToast("Add a course and hall from Admin before capturing.", "error");
              setIsProcessing(false);
              return;
            }

            // Ensure session exists
            if (!session?.isActive) {
              startNewSession(course, venue);
            }

            const result = recognizeAndRecord(
              detection.descriptor,
              course,
              venue
            );

            if (result.matched && result.student) {
              setScanStatus("matched");
              setMatchedName(result.student.name);
              setMatchedMatric(result.student.matric);
              setConfidence(result.confidence);

              // Navigate to result page after a brief delay
              setTimeout(() => {
                router.push(
                  `/attendance/result?name=${encodeURIComponent(result.student!.name)}&matric=${encodeURIComponent(result.student!.matric)}&confidence=${result.confidence.toFixed(1)}&course=${encodeURIComponent(course)}&venue=${encodeURIComponent(venue)}&photo=${encodeURIComponent(result.student!.photo_url || "")}`
                );
              }, 1500);
            } else {
              setScanStatus("unknown");
              setTimeout(() => {
                setScanStatus("scanning");
                setIsProcessing(false);
              }, 2000);
            }
          }
        } else {
          consecutiveDetections = 0;
          // Use functional update to avoid stale closure issues with TS narrowing
          setScanStatus((prev) =>
            prev !== "matched" && prev !== "unknown" ? "scanning" : prev
          );
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    };

    const setupDetection = () => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      detectionIntervalRef.current = setInterval(detect, 400);
    };

    video.addEventListener("play", setupDetection);

    return () => {
      video.removeEventListener("play", setupDetection);
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [
    isCameraReady,
    isModelLoading,
    isProcessing,
    scanStatus,
    session,
    recognizeAndRecord,
    startNewSession,
    router,
    defaultCourse,
    defaultVenue,
    showToast,
  ]);

  const handleManualCapture = async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const detection = await window.faceapi
        .detectSingleFace(
          videoRef.current,
          new window.faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        showToast("No face detected. Position your face clearly.", "error");
        setIsProcessing(false);
        return;
      }

      const course = session?.course || defaultCourse;
      const venue = session?.venue || defaultVenue;

      if (!course || !venue) {
        showToast("Add a course and hall from Admin before capturing.", "error");
        setIsProcessing(false);
        return;
      }

      if (!session?.isActive) {
        startNewSession(course, venue);
      }

      const result = recognizeAndRecord(detection.descriptor, course, venue);

      if (result.matched && result.student) {
        setScanStatus("matched");
        setMatchedName(result.student.name);
        setMatchedMatric(result.student.matric);
        setConfidence(result.confidence);

        setTimeout(() => {
          router.push(
            `/attendance/result?name=${encodeURIComponent(result.student!.name)}&matric=${encodeURIComponent(result.student!.matric)}&confidence=${result.confidence.toFixed(1)}&course=${encodeURIComponent(course)}&venue=${encodeURIComponent(venue)}&photo=${encodeURIComponent(result.student!.photo_url || "")}`
          );
        }, 1500);
      } else {
        setScanStatus("unknown");
        setTimeout(() => {
          setScanStatus("scanning");
          setIsProcessing(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Manual capture error:", err);
      showToast("Error capturing face. Please try again.", "error");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body overflow-hidden h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white flex justify-between items-center px-6 py-4 w-full z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              school
            </span>
          </div>
          <h1 className="font-inter font-bold text-xl tracking-tight text-primary">
            Attendance Dashboard
          </h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined text-on-surface-variant">
            notifications
          </span>
        </button>
      </header>
      <div className="bg-surface-container-low h-[1px] w-full"></div>

      {/* Main Camera Canvas */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {/* Camera Feed */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {isModelLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-primary animate-pulse mb-4">
                  psychology
                </span>
                <p className="text-sm text-on-surface-variant font-medium">
                  Loading face recognition models...
                </p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-80"
            />
          )}
        </div>

        {/* Detection canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Biometric Viewfinder Overlay */}
        <div className="relative z-10 w-64 h-80 rounded-3xl scanner-frame flex items-center justify-center">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-fixed rounded-tl-3xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-fixed rounded-tr-3xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-fixed rounded-bl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-fixed rounded-br-3xl"></div>
          {/* Scanning Line */}
          <div className="w-full h-[2px] bg-primary-fixed absolute left-0 shadow-[0_0_15px_rgba(163,246,156,0.8)] opacity-40 animate-scan-line"></div>
          {/* Face Guide */}
          <span className="material-symbols-outlined text-white/20 text-9xl">
            face
          </span>
        </div>

        {/* Status Overlays */}
        <div className="absolute top-8 left-6 right-6 z-20 flex flex-col gap-3">
          <div className="glass-overlay rounded-2xl p-4 flex items-center justify-between border border-white/10">
            <div className="flex flex-col">
              <span className="text-white font-inter font-bold text-lg">
                {session?.course || defaultCourse || "No course configured"}
              </span>
              <span className="text-white/70 text-[12px] font-medium tracking-wide">
                {session?.venue || defaultVenue || "No hall configured"}
              </span>
            </div>
            <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
              {scanStatus === "scanning" || scanStatus === "idle"
                ? "LIVE SCAN"
                : scanStatus === "identifying"
                  ? "IDENTIFYING"
                  : scanStatus === "matched"
                    ? "MATCHED"
                    : "UNKNOWN"}
            </div>
          </div>

          {/* Active Scan Result */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low overflow-hidden flex items-center justify-center">
              <span
                className={`material-symbols-outlined text-2xl ${
                  scanStatus === "matched"
                    ? "text-primary"
                    : scanStatus === "unknown"
                      ? "text-error"
                      : "text-outline"
                }`}
              >
                {scanStatus === "matched"
                  ? "check_circle"
                  : scanStatus === "unknown"
                    ? "cancel"
                    : "face"}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-inter font-bold text-on-surface text-sm">
                {scanStatus === "idle" || scanStatus === "scanning"
                  ? "Scanning..."
                  : scanStatus === "identifying"
                    ? "Identifying..."
                    : scanStatus === "matched"
                      ? matchedName
                      : "Face Not Recognized"}
              </h3>
              <p className="text-on-surface-variant text-[11px]">
                {scanStatus === "idle" || scanStatus === "scanning"
                  ? "Position face in the frame"
                  : scanStatus === "identifying"
                    ? "Hold camera steady"
                    : scanStatus === "matched"
                      ? `${matchedMatric} • ${confidence.toFixed(1)}% confidence`
                      : "Try again or use manual entry"}
              </p>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                scanStatus === "matched"
                  ? "bg-primary"
                  : scanStatus === "unknown"
                    ? "bg-error"
                    : "bg-secondary animate-pulse"
              }`}
            ></div>
          </div>
        </div>

        {/* Capture Controls */}
        <div className="absolute bottom-32 left-0 w-full z-20 flex justify-center px-6">
          <button
            onClick={handleManualCapture}
            disabled={isProcessing || isModelLoading || !defaultCourse || !defaultVenue}
            className="group flex flex-col items-center gap-3 disabled:opacity-50"
          >
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 transition-transform active:scale-90">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl">
                  center_focus_weak
                </span>
              </div>
            </div>
            <span className="text-white font-inter font-bold text-sm tracking-widest uppercase drop-shadow-md">
              Capture Attendance
            </span>
          </button>
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

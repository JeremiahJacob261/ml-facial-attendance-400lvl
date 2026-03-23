"use client";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const bgColor =
    type === "success"
      ? "bg-primary-container text-on-primary-container"
      : type === "error"
        ? "bg-error-container text-on-error-container"
        : "bg-secondary-container text-on-secondary-container";

  const icon =
    type === "success"
      ? "check_circle"
      : type === "error"
        ? "error"
        : "info";

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] toast-enter">
      <div
        className={`${bgColor} px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 min-w-[280px] max-w-[90vw]`}
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <span className="text-sm font-semibold flex-1">{message}</span>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}

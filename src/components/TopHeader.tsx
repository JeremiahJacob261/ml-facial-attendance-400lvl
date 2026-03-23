"use client";

interface TopHeaderProps {
  subtitle?: string;
}

export default function TopHeader({ subtitle }: TopHeaderProps) {
  return (
    <header className="flex justify-between items-center px-6 py-4 w-full bg-white fixed top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">
            school
          </span>
        </div>
        <div>
          <h1 className="font-inter font-bold text-xl tracking-tight text-primary">
            Attendance Dashboard
          </h1>
          {subtitle && (
            <p className="text-[12px] font-medium text-on-surface-variant">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined text-on-surface-variant">
            notifications
          </span>
        </button>
      </div>
    </header>
  );
}

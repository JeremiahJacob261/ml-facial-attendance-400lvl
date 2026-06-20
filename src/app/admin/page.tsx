"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import TopHeader from "@/components/TopHeader";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { useAppState } from "@/hooks/useAppState";
import { clearStudentCache, getStudents } from "@/lib/csv/loader";
import { parseEmbedding } from "@/lib/csv/parser";
import {
  createEntityId,
  getCourses,
  getHalls,
  normalizeText,
  saveCourses,
  saveHalls,
  saveStudents,
} from "@/services/localData";
import type { Course, Hall, Student } from "@/types";

type AdminTab = "students" | "courses" | "halls" | "analytics";

interface StudentFormState {
  id?: string;
  name: string;
  matric: string;
  photo_url: string;
  embedding: string;
}

const emptyStudentForm: StudentFormState = {
  name: "",
  matric: "",
  photo_url: "",
  embedding: "",
};

const emptyCourseForm: Course = {
  id: "",
  code: "",
  title: "",
};

const emptyHallForm: Hall = {
  id: "",
  name: "",
  capacity: undefined,
  location: "",
};

function studentEmbeddingText(student: Student): string {
  return student.embedding?.length ? `[${student.embedding.join(",")}]` : "";
}

function compactStudent(student: Student): Student {
  return {
    id: student.id || createEntityId("student"),
    name: normalizeText(student.name),
    matric: normalizeText(student.matric),
    photo_url: student.photo_url ? student.photo_url.trim() : undefined,
    embedding: student.embedding?.length ? student.embedding : undefined,
  };
}

export default function AdminPage() {
  const {
    allRecords,
    sessionRecords,
    studentCount,
    toast,
    showToast,
    dismissToast,
    refreshRecords,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<AdminTab>("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentForm, setStudentForm] = useState<StudentFormState>(emptyStudentForm);
  const [courseForm, setCourseForm] = useState<Course>(emptyCourseForm);
  const [hallForm, setHallForm] = useState<Hall>(emptyHallForm);

  useEffect(() => {
    const loadAdminData = async () => {
      const loadedStudents = await getStudents();
      setStudents(loadedStudents);
      setCourses(getCourses());
      setHalls(getHalls());
      refreshRecords();
    };

    loadAdminData().catch(() => {
      showToast("Unable to load admin data", "error");
    });
  }, [refreshRecords, showToast]);

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.matric.toLowerCase().includes(query)
    );
  }, [students, studentQuery]);

  const topCourse = useMemo(() => {
    const counts = new Map<string, number>();
    allRecords.forEach((record) => {
      counts.set(record.course, (counts.get(record.course) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] || null;
  }, [allRecords]);

  const attendanceRate =
    students.length > 0 ? Math.round((sessionRecords.length / students.length) * 100) : 0;

  const persistStudents = (nextStudents: Student[]) => {
    const normalizedStudents = nextStudents.map(compactStudent);
    saveStudents(normalizedStudents);
    clearStudentCache();
    setStudents(normalizedStudents);
  };

  const handleStudentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = normalizeText(studentForm.name);
    const matric = normalizeText(studentForm.matric);
    if (!name || !matric) {
      showToast("Student name and matric number are required", "error");
      return;
    }

    const duplicate = students.some(
      (student) =>
        student.id !== studentForm.id &&
        student.matric.toLowerCase() === matric.toLowerCase()
    );
    if (duplicate) {
      showToast("A student with this matric number already exists", "error");
      return;
    }

    const embedding = studentForm.embedding.trim()
      ? parseEmbedding(studentForm.embedding)
      : undefined;
    if (studentForm.embedding.trim() && !embedding) {
      showToast("Embedding must be a comma-separated number array", "error");
      return;
    }

    const nextStudent: Student = compactStudent({
      id: studentForm.id || createEntityId("student"),
      name,
      matric,
      photo_url: studentForm.photo_url.trim() || undefined,
      embedding: embedding || undefined,
    });

    const nextStudents = studentForm.id
      ? students.map((student) => (student.id === studentForm.id ? nextStudent : student))
      : [nextStudent, ...students];

    persistStudents(nextStudents);
    setStudentForm(emptyStudentForm);
    showToast(studentForm.id ? "Student updated" : "Student added", "success");
  };

  const handleStudentEdit = (student: Student) => {
    setStudentForm({
      id: student.id,
      name: student.name,
      matric: student.matric,
      photo_url: student.photo_url || "",
      embedding: studentEmbeddingText(student),
    });
    setActiveTab("students");
  };

  const handleStudentDelete = (student: Student) => {
    if (!window.confirm(`Delete ${student.name}?`)) return;
    persistStudents(students.filter((item) => item.id !== student.id));
    showToast("Student deleted", "info");
  };

  const handleCourseSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = normalizeText(courseForm.code);
    const title = normalizeText(courseForm.title);

    if (!code || !title) {
      showToast("Course code and title are required", "error");
      return;
    }

    const duplicate = courses.some(
      (course) =>
        course.id !== courseForm.id &&
        (course.code.toLowerCase() === code.toLowerCase() ||
          course.title.toLowerCase() === title.toLowerCase())
    );
    if (duplicate) {
      showToast("A course with this code or title already exists", "error");
      return;
    }

    const nextCourse: Course = {
      id: courseForm.id || createEntityId("course"),
      code,
      title,
    };
    const nextCourses = courseForm.id
      ? courses.map((course) => (course.id === courseForm.id ? nextCourse : course))
      : [nextCourse, ...courses];

    saveCourses(nextCourses);
    setCourses(nextCourses);
    setCourseForm(emptyCourseForm);
    showToast(courseForm.id ? "Course updated" : "Course added", "success");
  };

  const handleHallSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = normalizeText(hallForm.name);
    const location = hallForm.location ? normalizeText(hallForm.location) : "";

    if (!name) {
      showToast("Hall name is required", "error");
      return;
    }

    const duplicate = halls.some(
      (hall) =>
        hall.id !== hallForm.id &&
        hall.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      showToast("A hall with this name already exists", "error");
      return;
    }

    const nextHall: Hall = {
      id: hallForm.id || createEntityId("hall"),
      name,
      capacity: hallForm.capacity ? Number(hallForm.capacity) : undefined,
      location: location || undefined,
    };
    const nextHalls = hallForm.id
      ? halls.map((hall) => (hall.id === hallForm.id ? nextHall : hall))
      : [nextHall, ...halls];

    saveHalls(nextHalls);
    setHalls(nextHalls);
    setHallForm(emptyHallForm);
    showToast(hallForm.id ? "Hall updated" : "Hall added", "success");
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <TopHeader subtitle="Admin Management" />

      <main className="max-w-7xl mx-auto px-6 pt-24 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin</h2>
            <p className="text-sm text-on-surface-variant">
              Manage records stored locally on this device.
            </p>
          </div>
          <div className="grid grid-cols-4 bg-surface-container-lowest rounded-2xl p-1 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
            {(["students", "courses", "halls", "analytics"] as AdminTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
              <h3 className="text-lg font-bold mb-5">
                {studentForm.id ? "Edit Student" : "Add Student"}
              </h3>
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Full name"
                  value={studentForm.name}
                  onChange={(event) =>
                    setStudentForm({ ...studentForm, name: event.target.value })
                  }
                />
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Matric number"
                  value={studentForm.matric}
                  onChange={(event) =>
                    setStudentForm({ ...studentForm, matric: event.target.value })
                  }
                />
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Photo URL (optional)"
                  value={studentForm.photo_url}
                  onChange={(event) =>
                    setStudentForm({ ...studentForm, photo_url: event.target.value })
                  }
                />
                <textarea
                  className="w-full min-h-28 bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="Embedding array (optional)"
                  value={studentForm.embedding}
                  onChange={(event) =>
                    setStudentForm({ ...studentForm, embedding: event.target.value })
                  }
                />
                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-bold">
                    {studentForm.id ? "Update" : "Add"}
                  </button>
                  {studentForm.id && (
                    <button
                      type="button"
                      onClick={() => setStudentForm(emptyStudentForm)}
                      className="px-5 py-3 rounded-2xl bg-surface-container-low font-bold text-on-surface-variant"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold">Students</h3>
                  <p className="text-sm text-on-surface-variant">
                    {filteredStudents.length} shown of {students.length || studentCount}
                  </p>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-xl">
                    search
                  </span>
                  <input
                    className="w-full md:w-72 bg-surface-container-low rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Search students"
                    value={studentQuery}
                    onChange={(event) => setStudentQuery(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id || student.matric}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-container-low"
                  >
                    <div>
                      <p className="font-bold">{student.name}</p>
                      <p className="text-sm text-on-surface-variant">{student.matric}</p>
                      <p className="text-xs text-outline mt-1">
                        {student.embedding?.length
                          ? `${student.embedding.length}D biometric profile`
                          : "No biometric profile"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStudentEdit(student)}
                        className="px-4 py-2 rounded-xl bg-white text-secondary font-bold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStudentDelete(student)}
                        className="px-4 py-2 rounded-xl bg-error-container text-on-error-container font-bold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <p className="text-center text-on-surface-variant py-10">
                    No students found.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-5">
                {courseForm.id ? "Edit Course" : "Add Course"}
              </h3>
              <form onSubmit={handleCourseSubmit} className="space-y-4">
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Course code"
                  value={courseForm.code}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, code: event.target.value })
                  }
                />
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Course title"
                  value={courseForm.title}
                  onChange={(event) =>
                    setCourseForm({ ...courseForm, title: event.target.value })
                  }
                />
                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-bold">
                    {courseForm.id ? "Update" : "Add"}
                  </button>
                  {courseForm.id && (
                    <button
                      type="button"
                      onClick={() => setCourseForm(emptyCourseForm)}
                      className="px-5 py-3 rounded-2xl bg-surface-container-low font-bold text-on-surface-variant"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
            <section className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-5">Courses</h3>
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low"
                  >
                    <div>
                      <p className="font-bold">{course.title}</p>
                      <p className="text-sm text-on-surface-variant">{course.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCourseForm(course)}
                        className="px-4 py-2 rounded-xl bg-white text-secondary font-bold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          saveCourses(courses.filter((item) => item.id !== course.id));
                          setCourses(courses.filter((item) => item.id !== course.id));
                          showToast("Course deleted", "info");
                        }}
                        className="px-4 py-2 rounded-xl bg-error-container text-on-error-container font-bold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-center text-on-surface-variant py-10">
                    No courses configured.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "halls" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-5">
                {hallForm.id ? "Edit Hall" : "Add Hall"}
              </h3>
              <form onSubmit={handleHallSubmit} className="space-y-4">
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Hall name"
                  value={hallForm.name}
                  onChange={(event) =>
                    setHallForm({ ...hallForm, name: event.target.value })
                  }
                />
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Capacity (optional)"
                  type="number"
                  min="0"
                  value={hallForm.capacity ?? ""}
                  onChange={(event) =>
                    setHallForm({
                      ...hallForm,
                      capacity: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
                <input
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Location (optional)"
                  value={hallForm.location || ""}
                  onChange={(event) =>
                    setHallForm({ ...hallForm, location: event.target.value })
                  }
                />
                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-bold">
                    {hallForm.id ? "Update" : "Add"}
                  </button>
                  {hallForm.id && (
                    <button
                      type="button"
                      onClick={() => setHallForm(emptyHallForm)}
                      className="px-5 py-3 rounded-2xl bg-surface-container-low font-bold text-on-surface-variant"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
            <section className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-5">Halls</h3>
              <div className="space-y-3">
                {halls.map((hall) => (
                  <div
                    key={hall.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low"
                  >
                    <div>
                      <p className="font-bold">{hall.name}</p>
                      <p className="text-sm text-on-surface-variant">
                        {[hall.capacity ? `${hall.capacity} seats` : "", hall.location]
                          .filter(Boolean)
                          .join(" • ") || "No extra details"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHallForm(hall)}
                        className="px-4 py-2 rounded-xl bg-white text-secondary font-bold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          saveHalls(halls.filter((item) => item.id !== hall.id));
                          setHalls(halls.filter((item) => item.id !== hall.id));
                          showToast("Hall deleted", "info");
                        }}
                        className="px-4 py-2 rounded-xl bg-error-container text-on-error-container font-bold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {halls.length === 0 && (
                  <p className="text-center text-on-surface-variant py-10">
                    No halls configured.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "analytics" && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                ["Students", students.length.toString(), "groups"],
                ["Courses", courses.length.toString(), "menu_book"],
                ["Halls", halls.length.toString(), "meeting_room"],
                ["Records", allRecords.length.toString(), "history_edu"],
                ["Rate", `${attendanceRate}%`, "monitoring"],
              ].map(([label, value, icon]) => (
                <div
                  key={label}
                  className="bg-surface-container-lowest rounded-3xl p-5 shadow-[0_4px_24px_rgba(26,28,28,0.04)]"
                >
                  <span className="material-symbols-outlined text-primary mb-3">
                    {icon}
                  </span>
                  <p className="text-sm text-on-surface-variant">{label}</p>
                  <p className="text-3xl font-extrabold">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-4">Top Course</h3>
                <p className="text-3xl font-extrabold text-primary">
                  {topCourse ? topCourse[1] : 0}
                </p>
                <p className="text-on-surface-variant">
                  {topCourse ? topCourse[0] : "No attendance recorded yet"}
                </p>
              </div>
              <div className="bg-surface-container-lowest rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-4">Recent Attendance</h3>
                <div className="space-y-3">
                  {allRecords.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-low"
                    >
                      <div>
                        <p className="font-bold text-sm">{record.studentName}</p>
                        <p className="text-xs text-on-surface-variant">{record.course}</p>
                      </div>
                      <p className="text-xs font-bold text-primary">
                        {new Date(record.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                  {allRecords.length === 0 && (
                    <p className="text-on-surface-variant">No attendance recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
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

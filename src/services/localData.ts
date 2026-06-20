import type { Course, Hall, Student } from "@/types";

const STUDENTS_KEY = "admin_students_v1";
const COURSES_KEY = "admin_courses_v1";
const HALLS_KEY = "admin_halls_v1";

export const DEFAULT_COURSES: Course[] = [
  {
    id: "course-advanced-systems-architecture",
    code: "CS401",
    title: "Advanced Systems Architecture",
  },
  {
    id: "course-database-management-systems",
    code: "CS302",
    title: "Database Management Systems",
  },
  {
    id: "course-machine-learning-fundamentals",
    code: "CS405",
    title: "Machine Learning Fundamentals",
  },
  {
    id: "course-network-security",
    code: "CS407",
    title: "Network Security",
  },
];

export const DEFAULT_HALLS: Hall[] = [
  {
    id: "hall-lecture-hall-4b",
    name: "Lecture Hall 4B",
    capacity: 120,
    location: "Main Academic Block",
  },
  {
    id: "hall-computer-lab-2",
    name: "Computer Lab 2",
    capacity: 60,
    location: "ICT Centre",
  },
  {
    id: "hall-auditorium-a",
    name: "Auditorium A",
    capacity: 300,
    location: "Auditorium Complex",
  },
  {
    id: "hall-seminar-room-102",
    name: "Seminar Room 102",
    capacity: 45,
    location: "Faculty Wing",
  },
];

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredArray<T>(key: string): T[] | null {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredArray<T>(key: string, value: T[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function createEntityId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function getStoredStudents(): Student[] | null {
  const students = readStoredArray<Student>(STUDENTS_KEY);
  return students?.map((student) => ({
    ...student,
    id: student.id || `student-${student.matric}`,
  })) ?? null;
}

export function saveStudents(students: Student[]): void {
  writeStoredArray(STUDENTS_KEY, students);
}

export function seedStudents(students: Student[]): Student[] {
  const existing = getStoredStudents();
  if (existing) return existing;

  const seeded = students.map((student) => ({
    ...student,
    id: student.id || `student-${student.matric}`,
  }));
  saveStudents(seeded);
  return seeded;
}

export function getCourses(): Course[] {
  const stored = readStoredArray<Course>(COURSES_KEY);
  if (stored) return stored;
  writeStoredArray(COURSES_KEY, DEFAULT_COURSES);
  return DEFAULT_COURSES;
}

export function saveCourses(courses: Course[]): void {
  writeStoredArray(COURSES_KEY, courses);
}

export function getHalls(): Hall[] {
  const stored = readStoredArray<Hall>(HALLS_KEY);
  if (stored) return stored;
  writeStoredArray(HALLS_KEY, DEFAULT_HALLS);
  return DEFAULT_HALLS;
}

export function saveHalls(halls: Hall[]): void {
  writeStoredArray(HALLS_KEY, halls);
}

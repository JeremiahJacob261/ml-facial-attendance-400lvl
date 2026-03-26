import type { Student } from "@/types";
import { parseCSV, parseEmbedding } from "./parser";
import { validateStudent } from "./validator";

// Module-level cache for parsed students
let cachedStudents: Student[] | null = null;
let loadError: string | null = null;

/**
 * Load and parse students from the CSV file.
 * Results are cached in memory — subsequent calls return the cached data.
 */
export async function getStudents(): Promise<Student[]> {
  if (cachedStudents !== null) return cachedStudents;
  if (loadError) throw new Error(loadError);

  try {
    const response = await fetch("/data/students.csv");
    if (!response.ok) {
      throw new Error(`Failed to load students.csv: ${response.statusText}`);
    }

    const csvText = await response.text();
    const { data, errors } = parseCSV(csvText);

    if (errors.length > 0) {
      console.warn("CSV parse warnings:", errors);
    }

    const students: Student[] = [];
    let expectedLength: number | null = null;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Extract embedding from the row
      const embeddingStr =
        row["embedding"] ||
        row["face_embedding"] ||
        row["feature_vector"] ||
        row["face embedding"] ||
        row["face_descriptors"];

      const embedding = parseEmbedding(embeddingStr);

      // Set expected length from first valid embedding
      if (embedding && expectedLength === null) {
        expectedLength = embedding.length;
      }

      // Validate
      const validation = validateStudent(row, embedding, expectedLength, i + 1);
      if (!validation.valid) {
        console.warn("Skipping invalid row:", validation.errors);
        continue;
      }

      // Extract name and matric with flexible column matching
      const name = (
        row["name"] ||
        row["student name"] ||
        row["student_name"] ||
        ""
      ).trim();
      const matric = (
        row["matric"] ||
        row["matric_number"] ||
        row["matric_no"] ||
        row["matriculation number"] ||
        ""
      ).trim();

      const photo_url = (
        row["photo_url"] ||
        row["photo"] ||
        row["image_url"] ||
        ""
      ).trim();

      students.push({
        name,
        matric,
        embedding: embedding!,
        photo_url: photo_url || undefined,
      });
    }

    cachedStudents = students;
    console.log(`Loaded ${students.length} students from CSV`);
    return students;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error loading CSV";
    loadError = message;
    console.error("CSV load error:", message);
    throw err;
  }
}

/**
 * Force reload the CSV data (clears cache).
 */
export function clearStudentCache(): void {
  cachedStudents = null;
  loadError = null;
}

/**
 * Get the total number of loaded students.
 */
export function getStudentCount(): number {
  return cachedStudents?.length ?? 0;
}

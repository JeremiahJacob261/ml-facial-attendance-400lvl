import type { Student } from "@/types";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a single student record parsed from CSV.
 */
export function validateStudent(
  row: Record<string, string>,
  embedding: number[] | null,
  expectedEmbeddingLength: number | null,
  rowIndex: number
): ValidationResult {
  const errors: string[] = [];

  // Validate name
  const name = row["name"] || row["student name"] || row["student_name"];
  if (!name || name.trim().length === 0) {
    errors.push(`Row ${rowIndex}: Missing student name`);
  }

  // Validate matric number
  const matric =
    row["matric"] ||
    row["matric_number"] ||
    row["matric_no"] ||
    row["matriculation number"];
  if (!matric || matric.trim().length === 0) {
    errors.push(`Row ${rowIndex}: Missing matric number`);
  }

  // Validate embedding
  if (!embedding) {
    errors.push(`Row ${rowIndex}: Missing or invalid embedding`);
  } else {
    // Check for NaN values
    if (embedding.some((v) => isNaN(v))) {
      errors.push(`Row ${rowIndex}: Embedding contains NaN values`);
    }

    // Check vector length consistency
    if (expectedEmbeddingLength !== null && embedding.length !== expectedEmbeddingLength) {
      errors.push(
        `Row ${rowIndex}: Embedding length ${embedding.length} doesn't match expected ${expectedEmbeddingLength}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate the entire dataset for consistency.
 */
export function validateDataset(students: Student[]): ValidationResult {
  const errors: string[] = [];

  if (students.length === 0) {
    errors.push("Dataset is empty");
    return { valid: false, errors };
  }

  // Check embedding length consistency
  const embeddingLengths = new Set(
    students.filter((s) => s.embedding?.length).map((s) => s.embedding!.length)
  );
  if (embeddingLengths.size > 1) {
    errors.push(
      `Inconsistent embedding lengths found: ${Array.from(embeddingLengths).join(", ")}`
    );
  }

  // Check for duplicate matric numbers
  const matrics = new Set<string>();
  for (const student of students) {
    if (matrics.has(student.matric)) {
      errors.push(`Duplicate matric number: ${student.matric}`);
    }
    matrics.add(student.matric);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

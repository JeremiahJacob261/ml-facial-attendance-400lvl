import type { Student, RecognitionResult } from "@/types";

/**
 * Compute Euclidean distance between two embedding vectors.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector length mismatch: ${a.length} vs ${b.length}`
    );
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Compute cosine similarity between two vectors.
 * Returns value between -1 and 1 (1 = identical).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector length mismatch: ${a.length} vs ${b.length}`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Default recognition threshold (Euclidean distance).
 * Lower = stricter matching.
 */
export const DEFAULT_THRESHOLD = 0.6;

/**
 * Find the best matching student from the dataset for a given face embedding.
 *
 * Uses face-api.js Euclidean distance when available, otherwise falls back
 * to our own implementation.
 *
 * @param embedding - The face embedding from camera capture (Float32Array or number[])
 * @param students - Array of students with stored embeddings
 * @param threshold - Maximum distance for a valid match (default: 0.6)
 * @returns RecognitionResult with the best match or null
 */
export function findBestMatch(
  embedding: Float32Array | number[],
  students: Student[],
  threshold: number = DEFAULT_THRESHOLD
): RecognitionResult {
  if (!students || students.length === 0) {
    return { matched: false, student: null, distance: Infinity, confidence: 0 };
  }

  const embeddingArray = Array.from(embedding);

  let bestMatch: Student | null = null;
  let bestDistance = Infinity;

  for (const student of students) {
    if (!student.embedding || student.embedding.length === 0) continue;

    try {
      // Use face-api's euclidean distance if available, otherwise our own
      let distance: number;

      if (
        typeof window !== "undefined" &&
        window.faceapi?.euclideanDistance
      ) {
        distance = window.faceapi.euclideanDistance(
          embeddingArray,
          student.embedding
        );
      } else {
        distance = euclideanDistance(embeddingArray, student.embedding);
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = student;
      }
    } catch (err) {
      // Skip students with incompatible embeddings
      console.warn(
        `Skipping student ${student.matric}: embedding comparison failed`,
        err
      );
    }
  }

  if (bestMatch && bestDistance < threshold) {
    const confidence = Math.max(0, (1 - bestDistance) * 100);
    return {
      matched: true,
      student: bestMatch,
      distance: bestDistance,
      confidence,
    };
  }

  return {
    matched: false,
    student: null,
    distance: bestDistance,
    confidence: Math.max(0, (1 - bestDistance) * 100),
  };
}

import Papa from "papaparse";

export interface CSVRow {
  [key: string]: string;
}

/**
 * Parse CSV text into typed rows using PapaParse.
 * Handles headers, quoting, and malformed rows gracefully.
 */
export function parseCSV(csvText: string): {
  data: CSVRow[];
  errors: Papa.ParseError[];
} {
  const result = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep everything as string; we parse embeddings manually
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  return {
    data: result.data,
    errors: result.errors,
  };
}

/**
 * Parse an embedding string like "[0.1, 0.2, 0.3, ...]" into a number array.
 */
export function parseEmbedding(embeddingStr: string): number[] | null {
  if (!embeddingStr || typeof embeddingStr !== "string") return null;

  try {
    // Remove brackets and whitespace
    const cleaned = embeddingStr.replace(/[\[\]]/g, "").trim();
    if (!cleaned) return null;

    const values = cleaned.split(",").map((v) => {
      const num = parseFloat(v.trim());
      if (isNaN(num)) throw new Error(`Invalid number: ${v}`);
      return num;
    });

    return values;
  } catch {
    return null;
  }
}

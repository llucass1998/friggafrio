import crypto from "crypto";

export type DownloadedSpreadsheet = {
  buffer: Buffer;
  sha256: string;
  contentType: string;
  size: number;
  downloadedAt: Date;
};

export async function downloadGoogleSheetWorkbook(
  url: string,
  timeoutMs: number = 30000
): Promise<DownloadedSpreadsheet> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to download spreadsheet: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      contentType.includes("text/html") ||
      !contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      throw new Error(`Invalid content type: ${contentType}. Expected XLSX spreadsheet.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      throw new Error("Downloaded file is empty.");
    }

    // 10 MB limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      throw new Error(`Downloaded file is too large: ${buffer.length} bytes (max ${MAX_SIZE} bytes).`);
    }

    const sha256 = crypto.createHash("sha256").update(new Uint8Array(buffer)).digest("hex").toUpperCase();

    return {
      buffer,
      sha256,
      contentType,
      size: buffer.length,
      downloadedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Download timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
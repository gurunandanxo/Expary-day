import { createWorker } from "tesseract.js";

export interface OcrResult {
  rawText: string;
  confidence: number;
  lines: string[];
}

let ocrWorkerPromise: ReturnType<typeof createWorker> | null = null;

async function getOcrWorker(onProgress?: (progress: number) => void) {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          onProgress?.(Math.round(m.progress * 100));
        }
      },
    });
  }
  const worker = await ocrWorkerPromise;
  return worker;
}

/**
 * Preprocess a canvas to boost text contrast (grayscale + adaptive threshold)
 * to dramatically improve OCR detection on shiny bottles and curved packaging.
 */
export function preprocessCanvasForOcr(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;

  const ctx = outputCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(canvas, 0, 0);

  try {
    const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = imgData.data;

    // Convert to high-contrast grayscale
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      // Luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Increase contrast
      const contrast = 1.3;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      const contrasted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

      data[i] = contrasted;
      data[i + 1] = contrasted;
      data[i + 2] = contrasted;
    }

    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  } catch (err) {
    console.warn("[OCR] Canvas preprocessing warning, using raw canvas:", err);
    return canvas;
  }
}

/**
 * Execute real optical character recognition on a canvas or image source.
 */
export async function recognizeTextFromCanvas(
  canvas: HTMLCanvasElement,
  onProgress?: (percent: number) => void,
): Promise<OcrResult> {
  console.log("[OCR] Starting text recognition...");
  const processed = preprocessCanvasForOcr(canvas);
  const worker = await getOcrWorker(onProgress);

  const { data } = await worker.recognize(processed);

  const rawText: string = data.text || "";
  const confidence = Math.round(data.confidence || 0);
  const lines: string[] = rawText
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  console.log(
    `[OCR] Recognition completed with confidence ${confidence}%. Text length: ${rawText.length}`,
  );

  return {
    rawText,
    confidence,
    lines,
  };
}

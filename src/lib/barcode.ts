import { BrowserMultiFormatReader } from "@zxing/browser";

export interface DetectedBarcode {
  rawValue: string;
  format?: string | undefined;
}

interface WindowWithBarcodeDetector {
  BarcodeDetector?: {
    new (options?: { formats: string[] }): {
      detect: (
        source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
      ) => Promise<Array<{ rawValue: string; format?: string }>>;
    };
    getSupportedFormats: () => Promise<string[]>;
  };
}

let zxingReader: BrowserMultiFormatReader | null = null;

function getZxingReader(): BrowserMultiFormatReader {
  if (!zxingReader) {
    zxingReader = new BrowserMultiFormatReader();
  }
  return zxingReader;
}

/**
 * Detect barcode from a canvas, video, or image source.
 * Tries native BarcodeDetector first, then falls back to ZXing.
 */
export async function detectBarcode(
  source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
): Promise<DetectedBarcode | null> {
  // Method 1: Check for native BarcodeDetector API (Supported in Chrome, Edge, Chromium Android)
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const win = window as unknown as WindowWithBarcodeDetector;
      if (win.BarcodeDetector) {
        const supportedFormats = await win.BarcodeDetector.getSupportedFormats();
        const detector = new win.BarcodeDetector({
          formats:
            supportedFormats.length > 0
              ? supportedFormats
              : [
                  "ean_13",
                  "ean_8",
                  "upc_a",
                  "upc_e",
                  "code_128",
                  "code_39",
                  "qr_code",
                  "data_matrix",
                ],
        });

        const barcodes = await detector.detect(source);
        if (barcodes && barcodes.length > 0) {
          const primary = barcodes[0];
          if (primary) {
            console.log("[Barcode] Detected via native BarcodeDetector:", primary.rawValue);
            return {
              rawValue: String(primary.rawValue).trim(),
              format: primary.format,
            };
          }
        }
      }
    } catch (nativeErr) {
      console.warn("[Barcode] Native BarcodeDetector error, falling back to ZXing:", nativeErr);
    }
  }

  // Method 2: Fallback to ZXing BrowserMultiFormatReader
  try {
    const reader = getZxingReader();
    let result = null;

    if (source instanceof HTMLCanvasElement) {
      result = reader.decodeFromCanvas(source);
    } else if (source instanceof HTMLImageElement) {
      result = await reader.decodeFromImageElement(source);
    } else if (source instanceof HTMLVideoElement) {
      result = await reader.decodeOnceFromVideoElement(source);
    }

    if (result) {
      const text = result.getText();
      console.log("[Barcode] Detected via ZXing:", text);
      return {
        rawValue: text.trim(),
        format: result.getBarcodeFormat()?.toString(),
      };
    }
  } catch (zxingErr) {
    // NotFoundException is normal when no barcode is in the frame
  }

  return null;
}

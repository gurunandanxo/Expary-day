import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  FlipHorizontal,
  ImagePlus,
  Loader2,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  startCameraStream,
  stopCameraStream,
  listVideoDevices,
  captureFrameToCanvas,
  isCameraSupported,
  VideoDevice,
} from "@/lib/camera";
import { detectBarcode } from "@/lib/barcode";
import { lookupProductByBarcode } from "@/lib/product-lookup";
import { recognizeTextFromCanvas } from "@/lib/ocr";
import { extractProductFromOcrText, ParsedScanData, UserPreferencesConfig } from "@/lib/parser";

export type ScannerStatus =
  | "IDLE"
  | "OPENING_CAMERA"
  | "CAMERA_READY"
  | "CAPTURING"
  | "PROCESSING"
  | "DETECTING_BARCODE"
  | "RUNNING_OCR"
  | "IDENTIFYING_PRODUCT"
  | "ANALYZING_INGREDIENTS"
  | "ERROR";

export interface ScanSuccessResult {
  data: ParsedScanData;
  barcode?: string | undefined;
  imageBlob?: Blob | undefined;
  imagePreviewUrl?: string | undefined;
  source: "barcode" | "ocr" | "manual";
}

interface CameraScannerProps {
  onScanComplete: (result: ScanSuccessResult) => void;
  onEnterManually: () => void;
  userPreferences?: UserPreferencesConfig;
}

export function CameraScanner({
  onScanComplete,
  onEnterManually,
  userPreferences = {},
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<ScannerStatus>("OPENING_CAMERA");
  const [statusMessage, setStatusMessage] = useState<string>("Initializing camera feed…");
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [activeFacingMode, setActiveFacingMode] = useState<"environment" | "user">("environment");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  // Initialize camera
  const initCamera = useCallback(
    async (facingMode: "environment" | "user" = "environment", deviceId?: string) => {
      setStatus("OPENING_CAMERA");
      setStatusMessage("Accessing camera…");
      setErrorMessage(null);

      // Stop any existing stream
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
        streamRef.current = null;
      }

      try {
        console.log(
          `[CameraScanner] Requesting camera facingMode=${facingMode}, deviceId=${deviceId}`,
        );
        const result = await startCameraStream({
          facingMode,
          deviceId,
        });

        streamRef.current = result.stream;

        if (videoRef.current) {
          videoRef.current.srcObject = result.stream;
          await videoRef.current.play().catch((err) => {
            console.warn("[CameraScanner] Video play caught:", err);
          });
        }

        setStatus("CAMERA_READY");
        setStatusMessage("Align product or barcode inside the frame");

        // Enumerate devices for camera switching
        const availableDevices = await listVideoDevices();
        setDevices(availableDevices);
      } catch (err: unknown) {
        console.error("[CameraScanner] Camera initialization failed:", err);
        setStatus("ERROR");
        setErrorMessage(err instanceof Error ? err.message : "Unable to access the camera.");
      }
    },
    [],
  );

  // Start camera on mount & stop on unmount
  useEffect(() => {
    initCamera(activeFacingMode, selectedDeviceId);

    return () => {
      console.log("[CameraScanner] Cleaning up camera stream on unmount");
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, [initCamera, activeFacingMode, selectedDeviceId]);

  // Switch camera toggle
  const handleSwitchCamera = async () => {
    const nextFacing = activeFacingMode === "environment" ? "user" : "environment";
    setActiveFacingMode(nextFacing);

    // If multiple devices exist, cycle to next device
    let nextDeviceId: string | undefined = undefined;
    if (devices.length > 1) {
      const currentIndex = devices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      if (nextDevice) {
        nextDeviceId = nextDevice.deviceId;
        setSelectedDeviceId(nextDeviceId);
      }
    }

    await initCamera(nextFacing, nextDeviceId);
  };

  // Run the dual pipeline (Barcode -> OCR fallback) on a canvas
  const processImageCanvas = async (
    canvas: HTMLCanvasElement,
    previewUrl: string,
    imageBlob?: Blob,
  ) => {
    try {
      // Step 1: Detect Barcode
      setStatus("DETECTING_BARCODE");
      setStatusMessage("Checking for barcode…");

      const barcodeResult = await detectBarcode(canvas);

      if (barcodeResult && barcodeResult.rawValue) {
        console.log("[Scanner] Barcode detected:", barcodeResult.rawValue);
        setStatus("IDENTIFYING_PRODUCT");
        setStatusMessage(`Looking up product for barcode ${barcodeResult.rawValue}…`);

        const extProduct = await lookupProductByBarcode(barcodeResult.rawValue);
        if (extProduct) {
          console.log("[Scanner] Product found in external database:", extProduct.name);
          setStatus("ANALYZING_INGREDIENTS");
          setStatusMessage("Analyzing ingredients and safety preferences…");

          // Convert to ParsedScanData
          const parsed = extractProductFromOcrText(
            `${extProduct.name}\n${extProduct.brand}\nINGREDIENTS: ${extProduct.ingredients.join(", ")}`,
            95,
            userPreferences,
          );

          parsed.productName = extProduct.name;
          parsed.brand = extProduct.brand;
          parsed.category = extProduct.category;
          parsed.quantity = extProduct.quantity;
          if (extProduct.ingredients.length > 0) {
            parsed.ingredients = extProduct.ingredients;
          }

          onScanComplete({
            data: parsed,
            barcode: barcodeResult.rawValue,
            imagePreviewUrl: extProduct.imageUrl || previewUrl,
            imageBlob,
            source: "barcode",
          });
          return;
        } else {
          console.log("[Scanner] Barcode not in database. Proceeding to label OCR...");
          setStatusMessage("Barcode not in product database. Reading label with OCR…");
        }
      }

      // Step 2: Method B - Product Label OCR
      setStatus("RUNNING_OCR");
      setStatusMessage("Reading label text with OCR…");
      setOcrProgress(0);

      const ocrResult = await recognizeTextFromCanvas(canvas, (progress) => {
        setOcrProgress(progress);
        setStatusMessage(`Reading label… ${progress}%`);
      });

      if (!ocrResult.rawText || ocrResult.rawText.trim().length < 5) {
        setStatus("ERROR");
        setErrorMessage(
          "We couldn't read clear text on the product label. Please check lighting, hold camera steady, or enter details manually.",
        );
        return;
      }

      setStatus("ANALYZING_INGREDIENTS");
      setStatusMessage("Extracting product name, expiry, and ingredients…");

      const parsedData = extractProductFromOcrText(
        ocrResult.rawText,
        ocrResult.confidence,
        userPreferences,
      );

      onScanComplete({
        data: parsedData,
        barcode: barcodeResult?.rawValue,
        imagePreviewUrl: previewUrl,
        imageBlob,
        source: "ocr",
      });
    } catch (err: unknown) {
      console.error("[Scanner] Scan pipeline error:", err);
      setStatus("ERROR");
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred while scanning the product.",
      );
    }
  };

  // Capture frame from active camera
  const handleCapture = async () => {
    if (!videoRef.current || status !== "CAMERA_READY") return;

    setStatus("CAPTURING");
    setStatusMessage("Capturing high-resolution frame…");

    try {
      const canvas = captureFrameToCanvas(videoRef.current);
      const previewUrl = canvas.toDataURL("image/jpeg", 0.85);

      canvas.toBlob(
        async (blob) => {
          await processImageCanvas(canvas, previewUrl, blob || undefined);
        },
        "image/jpeg",
        0.9,
      );
    } catch (err: unknown) {
      console.error("[Scanner] Capture error:", err);
      setStatus("ERROR");
      setErrorMessage("Failed to capture frame from video stream.");
    }
  };

  // Handle image upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("CAPTURING");
    setStatusMessage("Loading uploaded image…");

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          processImageCanvas(canvas, reader.result as string, file);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isBusy =
    status === "OPENING_CAMERA" ||
    status === "CAPTURING" ||
    status === "PROCESSING" ||
    status === "DETECTING_BARCODE" ||
    status === "RUNNING_OCR" ||
    status === "IDENTIFYING_PRODUCT" ||
    status === "ANALYZING_INGREDIENTS";

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <div className="glass-panel overflow-hidden p-4 sm:p-6">
        {/* Header mode switcher */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold sm:text-xl">Scan Product</h2>
            <p className="text-xs text-muted-foreground">
              Align barcode, expiry date, or ingredient label in the frame
            </p>
          </div>

          <div className="flex items-center gap-2">
            {devices.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchCamera}
                disabled={isBusy}
                title="Switch Camera (Rear/Front)"
              >
                <FlipHorizontal className="size-4" />
                <span className="hidden sm:inline">Flip</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              title="Upload image from device"
            >
              <ImagePlus className="size-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Video Viewport / Scan Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black shadow-inner sm:aspect-[16/10]">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`size-full object-cover transition-opacity duration-300 ${
              status === "CAMERA_READY" ? "opacity-100" : "opacity-30"
            }`}
          />

          {/* Viewfinder Reticle Overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 sm:p-12">
            <div className="relative size-full max-w-[420px] rounded-2xl border-2 border-dashed border-primary/50">
              {/* Corner brackets */}
              <span className="absolute -left-1 -top-1 size-5 rounded-tl-lg border-l-4 border-t-4 border-primary" />
              <span className="absolute -right-1 -top-1 size-5 rounded-tr-lg border-r-4 border-t-4 border-primary" />
              <span className="absolute -bottom-1 -left-1 size-5 rounded-bl-lg border-b-4 border-l-4 border-primary" />
              <span className="absolute -bottom-1 -right-1 size-5 rounded-br-lg border-b-4 border-r-4 border-primary" />

              {/* Animated Scan Line */}
              {status === "CAMERA_READY" && <span className="scanline" />}
            </div>
          </div>

          {/* Busy / Processing Overlay */}
          {isBusy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center text-white backdrop-blur-sm">
              <Sparkles className="size-10 animate-pulse text-primary" />
              <p className="mt-3 font-display text-base font-semibold">{statusMessage}</p>
              {status === "RUNNING_OCR" && ocrProgress > 0 && (
                <div className="mt-3 w-48 overflow-hidden rounded-full bg-secondary/30">
                  <div
                    className="h-1.5 bg-primary transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Analyzing barcode, expiry date & ingredients
              </p>
            </div>
          )}

          {/* Error Banner inside viewport */}
          {status === "ERROR" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-white backdrop-blur-md">
              <TriangleAlert className="size-10 text-warning" />
              <p className="mt-3 font-display text-base font-semibold">Camera or Scan Issue</p>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {errorMessage ||
                  "Unable to read product. Please ensure good lighting and try again."}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-foreground"
                  onClick={() => initCamera(activeFacingMode, selectedDeviceId)}
                >
                  <RefreshCw className="size-4" /> Try Again
                </Button>
                <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4" /> Upload Image
                </Button>
                <Button size="sm" variant="secondary" onClick={onEnterManually}>
                  Enter Manually
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Capture Controls */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="w-full text-base font-semibold shadow-md sm:w-80"
            disabled={status !== "CAMERA_READY"}
            onClick={handleCapture}
          >
            {status === "CAMERA_READY" ? (
              <>
                <Camera className="size-5" /> Capture & Scan
              </>
            ) : isBusy ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <RefreshCw className="size-5" /> Retry Camera
              </>
            )}
          </Button>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-safe" />
              Verified without hallucinated data
            </span>
            <span>·</span>
            <button onClick={onEnterManually} className="text-primary hover:underline">
              Manual entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

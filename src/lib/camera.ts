export interface VideoDevice {
  deviceId: string;
  label: string;
}

export interface CameraStreamOptions {
  deviceId?: string | undefined;
  facingMode?: "environment" | "user" | undefined;
}

export interface CameraStreamResult {
  stream: MediaStream;
  activeDeviceId?: string | undefined;
  facingMode?: string | undefined;
}

/**
 * Stop all tracks on a MediaStream so the device camera light turns off.
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (err) {
    console.error("[Camera] Error stopping media tracks:", err);
  }
}

/**
 * Check if the current context supports getUserMedia (HTTPS or localhost).
 */
export function isCameraSupported(): { supported: boolean; reason?: string | undefined } {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Camera cannot be accessed on the server." };
  }

  // Check secure context (required by browsers for getUserMedia)
  const isSecure =
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!isSecure) {
    return {
      supported: false,
      reason: "Camera access requires a secure connection (HTTPS) or localhost.",
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      reason: "Your browser does not support the camera MediaDevices API.",
    };
  }

  return { supported: true };
}

/**
 * Request camera access with preferred environment (rear) camera.
 */
export async function startCameraStream(
  options: CameraStreamOptions = {},
): Promise<CameraStreamResult> {
  const check = isCameraSupported();
  if (!check.supported) {
    throw new Error(check.reason || "Camera is not supported in this environment.");
  }

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: 1920, min: 640 },
    height: { ideal: 1080, min: 480 },
  };

  if (options.deviceId) {
    videoConstraints.deviceId = { exact: options.deviceId };
  } else {
    videoConstraints.facingMode = { ideal: options.facingMode || "environment" };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings?.() || {};

    return {
      stream,
      activeDeviceId: settings.deviceId,
      facingMode: settings.facingMode,
    };
  } catch (error: unknown) {
    const errName = error instanceof Error ? error.name : "";
    // If environment camera failed with specific device constraint, fallback to any video device
    if (options.facingMode === "environment" && errName !== "NotAllowedError") {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        const track = fallbackStream.getVideoTracks()[0];
        const settings = track?.getSettings?.() || {};
        return {
          stream: fallbackStream,
          activeDeviceId: settings.deviceId,
          facingMode: settings.facingMode,
        };
      } catch (fallbackError: unknown) {
        throw handleCameraError(fallbackError);
      }
    }
    throw handleCameraError(error);
  }
}

/**
 * List available video input devices (cameras).
 */
export async function listVideoDevices(): Promise<VideoDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === "videoinput")
      .map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${index + 1}`,
      }));
  } catch (err) {
    console.warn("[Camera] Unable to enumerate devices:", err);
    return [];
  }
}

/**
 * Capture a frame from an active <video> element to an HTMLCanvasElement.
 */
export function captureFrameToCanvas(video: HTMLVideoElement): HTMLCanvasElement {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create canvas 2D rendering context.");

  ctx.drawImage(video, 0, 0, width, height);
  return canvas;
}

/**
 * Convert canvas to Blob.
 */
export function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob."));
      },
      "image/jpeg",
      quality,
    );
  });
}

function handleCameraError(error: unknown): Error {
  const errName = error instanceof Error ? error.name : "";
  const errMsg = error instanceof Error ? error.message : String(error);

  if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
    return new Error(
      "Camera permission was denied. Please allow camera access in your browser settings to scan products.",
    );
  }
  if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
    return new Error(
      "No camera device was found on this device. You can upload a photo of the product instead.",
    );
  }
  if (errName === "NotReadableError" || errName === "TrackStartError") {
    return new Error(
      "Camera is currently in use by another application or tab. Please close other apps and try again.",
    );
  }
  if (errName === "OverconstrainedError") {
    return new Error(
      "The requested camera resolution or facing mode is not supported by your device.",
    );
  }
  return new Error(errMsg || "Unable to access the camera.");
}

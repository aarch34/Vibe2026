/**
 * Multi-pass high-accuracy QR code decoder for image files.
 * Specifically built to handle mobile camera photos (12-48MP),
 * screen photos, lighting variations, and rotations.
 */
export async function decodeQRCodeFromImageFile(file: File): Promise<string | null> {
  // Pass 1: Try Native BarcodeDetector if supported in the browser (Android Chrome, Chromium)
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const barcodeDetector = new BarcodeDetectorClass({
        formats: ["qr_code"],
      });
      const bitmap = await createImageBitmap(file);
      const barcodes = await barcodeDetector.detect(bitmap);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch (e) {
      console.warn("Native BarcodeDetector pass skipped or failed:", e);
    }
  }

  // Pass 2: Canvas Normalization + jsQR
  try {
    const img = await loadImageFromFile(file);

    // Test multiple downscaled dimensions to handle extreme high-res phone cameras
    const targetSizes = [1200, 800, 1600];
    const jsQRModule = await import("jsqr");
    const jsQR = jsQRModule.default || jsQRModule;

    for (const maxDim of targetSizes) {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) continue;

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      // Attempt standard & inverted decode
      let res = jsQR(imageData.data, width, height, {
        inversionAttempts: "attemptBoth",
      });
      if (res && res.data) {
        return res.data;
      }

      // Attempt contrast enhancement for dim / washed-out festival photos
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const val = gray > 130 ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      res = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
      if (res && res.data) {
        return res.data;
      }
    }
  } catch (err) {
    console.warn("jsQR canvas pass warning:", err);
  }

  // Pass 3: html5-qrcode fallback
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    let container = document.getElementById("html5-qr-hidden-region");
    if (!container) {
      container = document.createElement("div");
      container.id = "html5-qr-hidden-region";
      container.style.position = "absolute";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "400px";
      container.style.height = "400px";
      document.body.appendChild(container);
    }
    const html5QrCode = new Html5Qrcode("html5-qr-hidden-region");
    const decoded = await html5QrCode.scanFile(file, false);
    if (decoded) return decoded;
  } catch (err) {
    console.warn("html5-qrcode fallback scan error:", err);
  }

  return null;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

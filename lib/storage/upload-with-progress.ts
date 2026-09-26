export interface UploadProgressEvent {
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  loadedMb: string;
  totalMb: string;
}

/**
 * Uploads a media file (video or image) to /api/media/upload with real-time XHR upload progress
 */
export function uploadMediaWithProgress(
  file: File,
  category = "posts",
  onProgress?: (progress: UploadProgressEvent) => void
): Promise<{ url: string; [key: string]: any }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/upload", true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
          const totalMb = (event.total / (1024 * 1024)).toFixed(1);
          onProgress({
            percent,
            loadedBytes: event.loaded,
            totalBytes: event.total,
            loadedMb,
            totalMb,
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            resolve(data);
          } else {
            reject(new Error(data.error || "Media uploaded but URL was missing"));
          }
        } catch {
          reject(new Error("Invalid server response from media upload"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error during media upload."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload timed out. Please check your network."));
    };

    xhr.send(formData);
  });
}

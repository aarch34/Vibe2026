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
export async function uploadMediaWithProgress(
  file: File,
  category = "posts",
  onProgress?: (progress: UploadProgressEvent) => void
): Promise<{ url: string; [key: string]: any }> {
  // 1. Get Presigned URL
  const presignRes = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    }),
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok || !presignData.success || !presignData.data?.uploadUrl) {
    throw new Error(presignData.error || "Failed to obtain upload URL");
  }

  const { uploadUrl, publicUrl, token } = presignData.data;
  const isDirectUpload = uploadUrl.startsWith("http");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // For direct uploads (Supabase Signed URL), we PUT the file directly
    // For fallback uploads (local dev), we POST FormData
    xhr.open(isDirectUpload ? "PUT" : "POST", uploadUrl, true);

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
        if (isDirectUpload) {
          // Direct Supabase uploads return empty JSON or no JSON, we already know the publicUrl
          resolve({ url: publicUrl, success: true });
        } else {
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

    if (isDirectUpload) {
      // Supabase storage signed URL requires the raw file and specific content type
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(file);
    } else {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      xhr.send(formData);
    }
  });
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback: direct link open
    window.open(url, '_blank');
  }
}

export async function resizeImageToThumbnail(dataUrl: string, maxWidth = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("No context");
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7)); // Optimized JPEG
    };
    img.onerror = (e) => reject(e);
  });
}

export async function optimizeImageForApi(dataUrl: string, maxSize = 3000, quality = 0.90): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      } else {
        // If image is already smaller, return original
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (e) => reject(e);
  });
}

export async function mergeImages(imageUrls: string[], maxWidth = 2048): Promise<string> {
  if (imageUrls.length === 0) return "";
  if (imageUrls.length === 1) return imageUrls[0];

  return new Promise((resolve, reject) => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    imageUrls.forEach((url, index) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        images[index] = img;
        loadedCount++;
        if (loadedCount === imageUrls.length) {
          const margin = 20;
          const cols = images.length <= 4 ? 2 : 3;
          const rows = Math.ceil(images.length / cols);

          const itemWidth = Math.floor((maxWidth - (cols + 1) * margin) / cols);

          const canvas = document.createElement("canvas");
          canvas.width = maxWidth;

          let totalHeight = 0;
          const rowHeights: number[] = [];
          for (let r = 0; r < rows; r++) {
            let maxHeightInRow = 0;
            for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              if (images[idx]) {
                const h = (images[idx].height * itemWidth) / images[idx].width;
                if (h > maxHeightInRow) maxHeightInRow = h;
              }
            }
            rowHeights[r] = maxHeightInRow;
            totalHeight += maxHeightInRow + margin;
          }
          canvas.height = totalHeight + margin;

          const ctx = canvas.getContext("2d");
          if (!ctx) { reject("No context"); return; }

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          let currentY = margin;
          for (let r = 0; r < rows; r++) {
            let currentX = margin;
            for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              if (images[idx]) {
                const imgWidth = itemWidth;
                const imgHeight = (images[idx].height * itemWidth) / images[idx].width;
                ctx.drawImage(images[idx], currentX, currentY, imgWidth, imgHeight);
              }
              currentX += itemWidth + margin;
            }
            currentY += rowHeights[r] + margin;
          }
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        }
      };
      img.onerror = (e) => {
        console.error("Image load error for merge:", url, e);
        // Fill with a placeholder blank or just skip
        loadedCount++;
        if (loadedCount === imageUrls.length) resolve(""); // Should ideally handle partial success
      };
    });
  });
}

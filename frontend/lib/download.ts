import JSZip from 'jszip';

/**
 * Downloads a file or image directly to the user\'s laptop/computer.
 * Converts data URLs, blob URLs, and remote URLs to an explicit Blob download.
 */
export async function downloadImageToLaptop(url: string, filename: string): Promise<boolean> {
  if (!url || typeof window === 'undefined') {
    return false;
  }

  try {
    let blob: Blob;

    if (url.startsWith('data:')) {
      const parts = url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'no-cache',
      });
      if (!response.ok) {
        throw new Error('HTTP error status: ' + response.status);
      }
      blob = await response.blob();
    }

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    }, 1000);

    return true;
  } catch (err) {
    console.warn('Direct blob download failed, falling back to direct link:', err);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 500);
      return true;
    } catch {
      window.open(url, '_blank');
      return false;
    }
  }
}

/**
 * Bundles multiple images into a single .zip file and triggers an instant download to the laptop.
 */
export async function downloadImagesAsZip(
  files: { url: string; filename: string }[],
  zipFilename: string = 'chest_xray_analysis.zip'
): Promise<boolean> {
  if (!files || files.length === 0 || typeof window === 'undefined') {
    return false;
  }

  try {
    const zip = new JSZip();

    for (const item of files) {
      if (!item.url) continue;

      try {
        if (item.url.startsWith('data:')) {
          const parts = item.url.split(',');
          zip.file(item.filename, parts[1], { base64: true });
        } else {
          const res = await fetch(item.url, {
            mode: 'cors',
            cache: 'no-cache',
          });
          if (res.ok) {
            const blob = await res.blob();
            zip.file(item.filename, blob);
          }
        }
      } catch (err) {
        console.warn("Failed to add file to zip:", err);
      }
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const objectUrl = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    }, 1500);

    return true;
  } catch (err) {
    console.error('Failed to create or download zip archive:', err);
    return false;
  }
}

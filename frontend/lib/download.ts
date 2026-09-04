/**
 * Downloads a file or image directly to the user's laptop/computer.
 * Converts data URLs, blob URLs, and remote URLs to an explicit Blob download.
 */
export async function downloadImageToLaptop(url: string, filename: string): Promise<boolean> {
  if (!url || typeof window === 'undefined') {
    return false;
  }

  try {
    let blob: Blob;

    if (url.startsWith('data:')) {
      // Base64 Data URL to Blob
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
      // HTTP/HTTPS or blob URL: fetch as blob
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

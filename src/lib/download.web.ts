// Browser downloads for exports.

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveText(filename: string, text: string, mimeType: string) {
  download(filename, new Blob([text], { type: mimeType }));
}

export const canSaveImage = true;

async function renderPng(svg: string, width: number, height: number): Promise<Blob> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not render the image');
  return blob;
}

export async function saveSvgAsPng(filename: string, svg: string, width: number, height: number) {
  download(filename, await renderPng(svg, width, height));
}

/** Opens the system share sheet with the image where the browser supports it (most phones), else downloads it */
export async function shareSvgAsPng(filename: string, svg: string, width: number, height: number, text?: string) {
  const blob = await renderPng(svg, width, height);
  const file = new File([blob], filename, { type: 'image/png' });
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (err) {
      // Closing the share sheet is not an error worth showing
      if ((err as Error).name === 'AbortError') return;
    }
  }
  download(filename, blob);
}

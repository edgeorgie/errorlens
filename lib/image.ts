export interface Prepared {
  base64: string;
  mediaType: "image/jpeg";
  width: number;
  height: number;
  dataUrl: string;
}

/** Scales (w, h) down so the longest side is at most `max`, keeping the aspect ratio. Never upscales. */
export function fitDims(w: number, h: number, max = 1568): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

export function splitDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const m = dataUrl.match(/^data:([\w/+.-]+);base64,(.+)$/);
  return m ? { mediaType: m[1], base64: m[2] } : null;
}

// Runs in the browser: shrinks large screenshots so the request stays small and cheap.
export async function prepareImage(source: Blob): Promise<Prepared> {
  const bmp = await createImageBitmap(source);
  const { width, height } = fitDims(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
  const parts = splitDataUrl(dataUrl);
  if (!parts) throw new Error("Could not encode the image.");
  return { base64: parts.base64, mediaType: "image/jpeg", width, height, dataUrl };
}

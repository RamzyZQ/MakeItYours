import {
  DEFAULT_PHOTO_ADJUSTMENT,
  type EditorObject,
  type PhotoBoothDocument,
  type PhotoAdjustment,
} from "../types/photoBoothEditor";
import type { PhotoBoothSide, PhotoBoothTemplate, PhotoFilter, PhotoSlot } from "../types/templates";

const FILTERS: Record<PhotoFilter, string> = {
  none: "none",
  grayscale: "grayscale(1)",
  vintage: "sepia(0.55) saturate(0.8) contrast(1.05)",
  "soft-pink": "sepia(0.12) saturate(1.08) hue-rotate(-6deg)",
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const loadedImages = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cachedImage = imageCache.get(src);
  if (cachedImage) return cachedImage;

  const imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      loadedImages.set(src, image);
      resolve(image);
    };
    image.onerror = () => {
      imageCache.delete(src);
      reject(new Error(`Gagal memuat gambar: ${src}`));
    };
    image.src = src;
  });
  imageCache.set(src, imagePromise);
  return imagePromise;
}

export function clampPhotoPan(
  src: string,
  slot: PhotoSlot,
  adjustment: PhotoAdjustment,
): PhotoAdjustment {
  const image = loadedImages.get(src);
  if (!image) return adjustment;

  const scale = Math.max(slot.width / image.width, slot.height / image.height) * adjustment.zoom;
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  const rotation = (adjustment.rotation * Math.PI) / 180;
  const rotatedWidth = (imageWidth * Math.abs(Math.cos(rotation))) +
    (imageHeight * Math.abs(Math.sin(rotation)));
  const rotatedHeight = (imageWidth * Math.abs(Math.sin(rotation))) +
    (imageHeight * Math.abs(Math.cos(rotation)));
  const maxPanX = Math.max(0, (rotatedWidth - slot.width) / 2);
  const maxPanY = Math.max(0, (rotatedHeight - slot.height) / 2);

  return {
    ...adjustment,
    panX: Math.max(-maxPanX, Math.min(adjustment.panX, maxPanX)),
    panY: Math.max(-maxPanY, Math.min(adjustment.panY, maxPanY)),
  };
}

export function getTemplateSide(template: PhotoBoothTemplate, side: PhotoBoothSide) {
  return side === "front"
    ? { frameUrl: template.frameUrl, canvasSize: template.canvasSize, photoSlots: template.photoSlots }
    : {
        frameUrl: template.backFrameUrl,
        canvasSize: template.backCanvasSize,
        photoSlots: template.backPhotoSlots,
      };
}

function drawPhoto(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  slot: PhotoSlot,
  adjustment: PhotoAdjustment,
  filter: string,
) {
  const scale = Math.max(slot.width / image.width, slot.height / image.height) * adjustment.zoom;
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  const rotation = (adjustment.rotation * Math.PI) / 180;
  const rotatedWidth = (imageWidth * Math.abs(Math.cos(rotation))) +
    (imageHeight * Math.abs(Math.sin(rotation)));
  const rotatedHeight = (imageWidth * Math.abs(Math.sin(rotation))) +
    (imageHeight * Math.abs(Math.cos(rotation)));
  const panX = Math.max(
    -Math.max(0, (rotatedWidth - slot.width) / 2),
    Math.min(adjustment.panX, Math.max(0, (rotatedWidth - slot.width) / 2)),
  );
  const panY = Math.max(
    -Math.max(0, (rotatedHeight - slot.height) / 2),
    Math.min(adjustment.panY, Math.max(0, (rotatedHeight - slot.height) / 2)),
  );
  context.save();
  context.beginPath();
  context.rect(slot.x, slot.y, slot.width, slot.height);
  context.clip();
  context.filter = filter;
  context.translate(slot.x + slot.width / 2 + panX, slot.y + slot.height / 2 + panY);
  context.rotate(rotation);
  context.scale(adjustment.flipX ? -1 : 1, adjustment.flipY ? -1 : 1);
  context.drawImage(
    image,
    -imageWidth / 2,
    -imageHeight / 2,
    imageWidth,
    imageHeight,
  );
  context.restore();
}

function drawStroke(context: CanvasRenderingContext2D, stroke: PhotoBoothDocument["strokes"][number]) {
  if (!stroke.points.length) return;
  context.save();
  context.globalCompositeOperation = stroke.mode === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);
  stroke.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  if (stroke.points.length === 1) {
    context.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y + 0.01);
  }
  context.stroke();
  context.restore();
}

function drawObject(
  context: CanvasRenderingContext2D,
  object: EditorObject,
  image: HTMLImageElement | null,
  selected: boolean,
) {
  context.save();
  context.translate(object.x, object.y);
  context.rotate((object.rotation * Math.PI) / 180);

  if (object.kind === "text") {
    const fontSize = object.fontSize ?? 64;
    context.fillStyle = object.color ?? "#382c30";
    context.font = `600 ${fontSize}px "${object.fontFamily ?? "Quicksand"}", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const lines = (object.text ?? "").split("\n");
    const lineHeight = fontSize * 1.15;
    lines.forEach((line, index) => {
      context.fillText(line, 0, (index - (lines.length - 1) / 2) * lineHeight, object.width);
    });
  } else if (object.kind === "sticker") {
    context.font = `${object.height}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(object.emoji ?? "✨", 0, 0);
  } else if (image) {
    context.drawImage(image, -object.width / 2, -object.height / 2, object.width, object.height);
  }

  if (selected) {
    context.strokeStyle = "#b83e68";
    context.lineWidth = 3;
    context.setLineDash([10, 7]);
    context.strokeRect(-object.width / 2, -object.height / 2, object.width, object.height);
    context.setLineDash([]);
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(object.width / 2, object.height / 2, 10, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  context.restore();
}

export async function renderPhotoBoothCanvas(
  canvas: HTMLCanvasElement,
  template: PhotoBoothTemplate,
  photos: (string | null)[],
  filter: PhotoFilter,
  side: PhotoBoothSide,
  editorDocument: PhotoBoothDocument,
  showSelection = false,
): Promise<void> {
  const { width, height } = getTemplateSide(template, side).canvasSize;
  const { frameUrl, photoSlots } = getTemplateSide(template, side);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas tidak tersedia di browser ini.");
  }

  context.clearRect(0, 0, width, height);
  const photoImages = await Promise.all(
    photoSlots.map((_, index) => {
      const source = photos[index];
      return source ? loadImage(source) : Promise.resolve(null);
    }),
  );
  const frame = await loadImage(frameUrl);

  photoSlots.forEach((slot, index) => {
    const image = photoImages[index];
    if (!image) return;
    drawPhoto(
      context,
      image,
      slot,
      editorDocument.photoAdjustments[index] ?? DEFAULT_PHOTO_ADJUSTMENT,
      FILTERS[filter],
    );
  });

  context.filter = "none";
  context.drawImage(frame, 0, 0, width, height);

  if (editorDocument.strokes.length) {
    const drawingCanvas = document.createElement("canvas");
    drawingCanvas.width = width;
    drawingCanvas.height = height;
    const drawingContext = drawingCanvas.getContext("2d");
    if (!drawingContext) {
      throw new Error("Canvas tidak tersedia untuk merender brush.");
    }
    editorDocument.strokes.forEach((stroke) => drawStroke(drawingContext, stroke));
    context.drawImage(drawingCanvas, 0, 0);
  }

  const objectImages = await Promise.all(
    editorDocument.objects.map((object) =>
      object.kind === "image" && object.src ? loadImage(object.src) : Promise.resolve(null),
    ),
  );
  editorDocument.objects.forEach((object, index) => {
    drawObject(
      context,
      object,
      objectImages[index],
      showSelection && editorDocument.selectedObjectId === object.id,
    );
  });
}

function swapObjects<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const fromItem = next[from];
  const toItem = next[to];
  if (fromItem === undefined || toItem === undefined) return items;
  next[from] = toItem;
  next[to] = fromItem;
  return next;
}

export function moveObjectUp(document: PhotoBoothDocument, objectId: string): PhotoBoothDocument {
  const index = document.objects.findIndex((item) => item.id === objectId);
  if (index < 0 || index >= document.objects.length - 1) return document;
  return { ...document, objects: swapObjects(document.objects, index, index + 1) };
}

export function moveObjectDown(document: PhotoBoothDocument, objectId: string): PhotoBoothDocument {
  const index = document.objects.findIndex((item) => item.id === objectId);
  if (index <= 0) return document;
  return { ...document, objects: swapObjects(document.objects, index, index - 1) };
}

export function bringObjectToFront(document: PhotoBoothDocument, objectId: string): PhotoBoothDocument {
  const index = document.objects.findIndex((item) => item.id === objectId);
  if (index < 0 || index === document.objects.length - 1) return document;
  const objects = [...document.objects];
  const [item] = objects.splice(index, 1);
  if (!item) return document;
  objects.push(item);
  return { ...document, objects };
}

export function sendObjectToBack(document: PhotoBoothDocument, objectId: string): PhotoBoothDocument {
  const index = document.objects.findIndex((item) => item.id === objectId);
  if (index <= 0) return document;
  const objects = [...document.objects];
  const [item] = objects.splice(index, 1);
  if (!item) return document;
  objects.unshift(item);
  return { ...document, objects };
}

export function rotateLandscapeCanvasToPortrait(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const portraitCanvas = document.createElement("canvas");
  portraitCanvas.width = canvas.height;
  portraitCanvas.height = canvas.width;

  const context = portraitCanvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas tidak tersedia untuk preview portrait.");
  }

  context.translate(portraitCanvas.width / 2, portraitCanvas.height / 2);
  context.rotate(Math.PI / 2);
  context.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return portraitCanvas;
}

export function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  format: "png" | "jpg",
  fileName: string,
): void {
  let exportCanvas = canvas;
  let mimeType = "image/png";

  if (format === "jpg") {
    exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const context = exportCanvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas tidak tersedia untuk ekspor JPG.");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.drawImage(canvas, 0, 0);
    mimeType = "image/jpeg";
  }

  const link = document.createElement("a");
  link.download = fileName;
  link.href = exportCanvas.toDataURL(mimeType, format === "jpg" ? 0.94 : undefined);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

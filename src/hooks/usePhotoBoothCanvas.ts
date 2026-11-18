import { useEffect, useRef, useState } from "react";
import { renderPhotoBoothCanvas } from "../services/photoBoothCanvas";
import type { PhotoBoothDocument } from "../types/photoBoothEditor";
import type { PhotoBoothSide, PhotoBoothTemplate, PhotoFilter } from "../types/templates";

export function usePhotoBoothCanvas(
  template: PhotoBoothTemplate,
  photos: (string | null)[],
  filter: PhotoFilter,
  side: PhotoBoothSide,
  editorDocument: PhotoBoothDocument,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let active = true;
    setIsRendering(true);
    setRenderError(null);
    const renderCanvas = document.createElement("canvas");
    void renderPhotoBoothCanvas(
      renderCanvas,
      template,
      photos,
      filter,
      side,
      editorDocument,
      true,
    )
      .then(() => {
        if (!active) return;
        canvas.width = renderCanvas.width;
        canvas.height = renderCanvas.height;
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas tidak tersedia di browser ini.");
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(renderCanvas, 0, 0);
        setIsRendering(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setRenderError(error instanceof Error ? error.message : String(error));
        setIsRendering(false);
      });

    return () => {
      active = false;
    };
  }, [template, photos, filter, side, editorDocument]);

  return { canvasRef, renderError, isRendering };
}

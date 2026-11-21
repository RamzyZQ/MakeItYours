import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Brush,
  Camera,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Download,
  Eraser,
  FlipHorizontal,
  FlipVertical,
  Hand,
  ImagePlus,
  MessageCircle,
  Move,
  Plus,
  RefreshCw,
  Redo2,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Sticker,
  Trash2,
  Type,
  Undo2,
  Upload,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import AppHeader from "../components/AppHeader";
import CheckoutModal from "../components/CheckoutModal";
import CheckoutProductPreview from "../components/CheckoutProductPreview";
import KeychainPreview from "../components/KeychainPreview";
import KeychainColorSelector from "../components/keychain/KeychainColorSelector";
import KeychainFilterDialog from "../components/keychain/KeychainFilterDialog";
import KeychainTemplateRail from "../components/keychain/KeychainTemplateRail";
import { usePhotoBoothEditor } from "../hooks/usePhotoBoothEditor";
import { usePhotoBoothCanvas } from "../hooks/usePhotoBoothCanvas";
import {
  bringObjectToFront,
  clampPhotoPan,
  downloadCanvasImage,
  getTemplateSide,
  moveObjectDown,
  moveObjectUp,
  renderPhotoBoothCanvas,
  rotateLandscapeCanvasToPortrait,
  sendObjectToBack,
} from "../services/photoBoothCanvas";
import { useStoreSettingsContext } from "../contexts/StoreSettingsContext";
import {
  DEFAULT_KEYCHAIN_ORDER,
  FRAME_MODELS,
  getKeychainColor,
  type KeychainOrder,
} from "../types/keychain";
import {
  PHOTOBOOTH_TEMPLATES,
  type PhotoBoothSide,
  type PhotoBoothTemplate,
  type PhotoFilter,
} from "../types/templates";
import {
  DEFAULT_PHOTO_ADJUSTMENT,
  type BrushStroke,
  type EditorObject,
  type PhotoBoothDocument,
  type PhotoBoothTool,
} from "../types/photoBoothEditor";

type InputMode = "upload" | "camera";

const FILTER_OPTIONS: { id: PhotoFilter; label: string; description: string }[] = [
  { id: "none", label: "Normal", description: "Warna asli" },
  { id: "grayscale", label: "B&W Classic", description: "Hitam putih" },
  { id: "vintage", label: "Vintage Warm", description: "Hangat dan klasik" },
  { id: "soft-pink", label: "Soft Glow", description: "Lembut dan cerah" },
];

const FONT_OPTIONS = [
  "Quicksand",
  "Plus Jakarta Sans",
  "Cherry Bomb One",
  "Cormorant Garamond",
  "Frankfurter Normal",
  "Roca One",
  "Copperplate Gothic 29 BC",
  "Times New Roman MT",
  "Perandory",
  "DM Sans",
  "Poppins",
  "Montserrat",
  "Nunito",
  "Playfair Display",
  "Lora",
  "Caveat",
  "Pacifico",
  "Bebas Neue",
  "Georgia",
  "serif",
  "cursive",
  "monospace",
];
const STICKER_OPTIONS = ["✨", "💖", "🌸", "🎀", "⭐", "☁️", "🦋", "🍓", "🌼", "♥"];
const TEXT_COLOR_OPTIONS = ["#382c30", "#b83e68", "#ffffff", "#7d9bb5", "#e7b44a", "#2B2B2B"];

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Format hasil foto tidak dapat dibaca."));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file foto."));
    reader.readAsDataURL(file);
  });
}

function captureVideoFrame(video: HTMLVideoElement): string {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas tidak tersedia untuk mengambil foto.");
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.94);
}

function waitOneSecond(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 1000));
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Gagal menyiapkan PNG untuk diunggah."));
      }
    }, "image/png");
  });
}

async function getApiError(response: Response, fallback: string): Promise<string> {
  const result: unknown = await response.json().catch(() => null);
  if (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    return result.error;
  }
  return fallback;
}

export default function Keychain() {
  const { settings } = useStoreSettingsContext();

  // Lazy-load font editor
  React.useEffect(() => {
    const existing = document.getElementById("keychain-editor-fonts");
    if (existing) return;
    const link = document.createElement("link");
    link.id = "keychain-editor-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;700&family=Cherry+Bomb+One&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;700&family=Lora:wght@400;700&family=Montserrat:wght@400;700&family=Nunito:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);
  const [order, setOrder] = useState<KeychainOrder>(DEFAULT_KEYCHAIN_ORDER);
  const [template, setTemplate] = useState<PhotoBoothTemplate>(
    PHOTOBOOTH_TEMPLATES.find((item) => item.id === "8") ?? PHOTOBOOTH_TEMPLATES[0],
  );
  const [activeSide, setActiveSide] = useState<PhotoBoothSide>("front");
  const [photosBySide, setPhotosBySide] = useState<Record<PhotoBoothSide, (string | null)[]>>({
    front: [...DEFAULT_KEYCHAIN_ORDER.photos],
    back: [null],
  });
  const [filter, setFilter] = useState<PhotoFilter>(template.defaultFilter);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captureSlot, setCaptureSlot] = useState<number | null>(null);
  const [captureTotal, setCaptureTotal] = useState(0);
  const [activeTool, setActiveTool] = useState<PhotoBoothTool>("move");
  const [brushColor, setBrushColor] = useState("#b83e68");
  const [brushSize, setBrushSize] = useState(12);
  const [fontOptions, setFontOptions] = useState<string[]>(FONT_OPTIONS);
  const [textDraft, setTextDraft] = useState("Tulis sesuatu");
  const [textFont, setTextFont] = useState(FONT_OPTIONS[0]);
  const [textColor, setTextColor] = useState("#382c30");
  const [textSize, setTextSize] = useState(64);
  const [activeSticker, setActiveSticker] = useState(STICKER_OPTIONS[0]);
  const [filterSettingsOpen, setFilterSettingsOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPreviews, setCheckoutPreviews] = useState<{ front: string; back: string } | null>(null);
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false);
  const [toolDockCollapsed, setToolDockCollapsed] = useState(false);
  const [focusTextInput, setFocusTextInput] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeIsError, setNoticeIsError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slotRef = useRef(0);
  const photoInputSideRef = useRef<PhotoBoothSide>("front");
  const batchInputSideRef = useRef<PhotoBoothSide>("front");
  const batchInputSlotCountRef = useRef(0);
  const cancelledCaptureRef = useRef(false);
  const customFontInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    side: PhotoBoothSide;
    objectId: string;
    offsetX: number;
    offsetY: number;
    initial: EditorObject;
    before: PhotoBoothDocument;
    mode: "move" | "resize" | "rotate";
    moved: boolean;
  } | null>(null);
  const photoDragRef = useRef<{
    side: PhotoBoothSide;
    index: number;
    lastX: number;
    lastY: number;
    before: PhotoBoothDocument;
    moved: boolean;
  } | null>(null);
  const canvasPanDragRef = useRef<{
    side: PhotoBoothSide;
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const brushStrokeRef = useRef<{ side: PhotoBoothSide; stroke: BrushStroke } | null>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);
  const multipleInputRef = useRef<HTMLInputElement>(null);
  const stickerPngInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const liveDrawingRef = useRef<HTMLCanvasElement>(null);
  const filterDialogRef = useRef<HTMLDialogElement>(null);
  const filterSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const photoSettingsRef = useRef<HTMLDivElement>(null);
  const canvasZoomRef = useRef(1);
  const canvasPanRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const pendingOrderRef = useRef<{ code: string; uploadToken: string } | null>(null);
  const checkoutCodeRef = useRef("");
  const { documents, history, updateDocument, recordDocumentSnapshot, undo, redo } =
    usePhotoBoothEditor();
  const frontRender = usePhotoBoothCanvas(
    template,
    photosBySide.front,
    filter,
    "front",
    documents.front,
  );
  const backRender = usePhotoBoothCanvas(
    template,
    photosBySide.back,
    filter,
    "back",
    documents.back,
  );
  useEffect(() => {
    return () => {
      if (checkoutPreviews) {
        URL.revokeObjectURL(checkoutPreviews.front);
        URL.revokeObjectURL(checkoutPreviews.back);
      }
    };
  }, [checkoutPreviews]);
  const sideTemplate = getTemplateSide(template, activeSide);
  const sidePhotos = photosBySide[activeSide];
  const currentDocument = documents[activeSide];
  const currentSlots = sideTemplate.photoSlots;
  const renderError = frontRender.renderError ?? backRender.renderError;
  const isRendering = frontRender.isRendering || backRender.isRendering;
  const activeSlotCount = currentSlots.length;
  const emptySlotIndices = currentSlots.reduce<number[]>((emptySlots, _slot, index) => {
    if (!sidePhotos[index]) emptySlots.push(index);
    return emptySlots;
  }, []);
  const frontPhotoCount = photosBySide.front.slice(0, template.photoSlots.length).filter(Boolean).length;
  const backPhotoCount = photosBySide.back.slice(0, template.backPhotoSlots.length).filter(Boolean).length;
  const selectedColor = getKeychainColor(order.frameModel);
  const keychainStock = settings.keychainStock;
  const allKeychainOutOfStock = FRAME_MODELS.every((frame) => keychainStock[frame.id] <= 0);

  const notify = (message: string, isError = false) => {
    setNotice(message);
    setNoticeIsError(isError);
    window.setTimeout(() => {
      setNotice((current) => (current === message ? null : current));
    }, 3500);
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  useEffect(() => {
    if (inputMode !== "camera" && cameraStream) {
      cancelledCaptureRef.current = true;
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [inputMode, cameraStream]);

  useEffect(() => {
    const dialog = filterDialogRef.current;
    if (!dialog) return;

    if (filterSettingsOpen && !dialog.open) {
      dialog.showModal();
    } else if (!filterSettingsOpen && dialog.open) {
      dialog.close();
    }
  }, [filterSettingsOpen]);

  useEffect(() => {
    if (!filterSettingsOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterSettingsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [filterSettingsOpen]);

  useEffect(() => {
    const canvas = liveDrawingRef.current;
    if (!canvas) return;
    canvas.width = sideTemplate.canvasSize.width;
    canvas.height = sideTemplate.canvasSize.height;
  }, [sideTemplate.canvasSize.height, sideTemplate.canvasSize.width]);

  useEffect(() => {
    const handleDelete = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
        return;
      }
      if (!currentDocument.selectedObjectId) return;
      event.preventDefault();
      updateDocument(activeSide, (document) => ({
        ...document,
        objects: document.objects.filter((item) => item.id !== document.selectedObjectId),
        selectedObjectId: null,
      }));
    };
    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [activeSide, currentDocument.selectedObjectId, updateDocument]);

  const stopCamera = () => {
    cancelledCaptureRef.current = true;
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setIsCapturing(false);
    setCountdown(null);
    setCaptureSlot(null);
    setCaptureTotal(0);
  };

  const openPhotoPicker = (index: number, side = activeSide) => {
    if (photosBySide[side][index]) {
      updateDocument(side, (document) => ({
        ...document,
        selectedPhotoIndex: index,
        selectedObjectId: null,
      }), false);
      return;
    }
    updateDocument(side, (document) => ({
      ...document,
      selectedPhotoIndex: null,
      selectedObjectId: null,
    }), false);
    slotRef.current = index;
    photoInputSideRef.current = side;
    singleInputRef.current?.click();
  };

  const onPickPhoto = async (
    index: number,
    file: File | undefined,
    side: PhotoBoothSide,
  ) => {
    if (!file) return;
    if (photosBySide[side][index]) {
      notify("Hapus foto yang ada sebelum mengisi slot ini.", true);
      return;
    }
    if (!file.type.startsWith("image/")) {
      notify("Pilih file dengan format gambar.", true);
      return;
    }

    try {
      const photo = await readImageFile(file);
      setPhotosBySide((current) => {
        if (current[side][index]) return current;
        const photos = [...current[side]];
        photos[index] = photo;
        return { ...current, [side]: photos };
      });
      updateDocument(side, (document) => ({
        ...document,
        selectedPhotoIndex: null,
        selectedObjectId: null,
      }), false);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal memuat foto.", true);
    }
  };

  const onPickMultiplePhotos = async (
    files: FileList | null,
    side: PhotoBoothSide,
    slotCount: number,
  ) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      notify("Semua file harus berupa gambar.", true);
      return;
    }
    const emptyIndices = photosBySide[side]
      .slice(0, slotCount)
      .reduce<number[]>((indices, photo, index) => {
        if (!photo) indices.push(index);
        return indices;
      }, []);
    if (!emptyIndices.length) {
      notify("Semua slot sudah terisi. Hapus foto sebelum mengunggah foto baru.", true);
      return;
    }
    if (selectedFiles.length > emptyIndices.length) {
      notify(`Tersedia ${emptyIndices.length} slot kosong. Foto selebihnya tidak dipakai.`);
    }

    try {
      const photosToLoad = await Promise.all(
        selectedFiles.slice(0, emptyIndices.length).map(readImageFile),
      );
      setPhotosBySide((current) => {
        const photos = [...current[side]];
        const stillEmptyIndices = photos
          .slice(0, slotCount)
          .reduce<number[]>((indices, photo, index) => {
            if (!photo) indices.push(index);
            return indices;
          }, []);
        photosToLoad.forEach((photo, photoIndex) => {
          const targetIndex = stillEmptyIndices[photoIndex];
          if (targetIndex !== undefined) photos[targetIndex] = photo;
        });
        return { ...current, [side]: photos };
      });
      updateDocument(side, (document) => ({
        ...document,
        selectedPhotoIndex: null,
        selectedObjectId: null,
      }), false);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal memuat foto.", true);
    }
  };

  const clearPhoto = (index: number, side = activeSide) => {
    setPhotosBySide((current) => {
      const photos = [...current[side]];
      photos[index] = null;
      return { ...current, [side]: photos };
    });
    updateDocument(side, (document) => ({
      ...document,
      photoAdjustments: document.photoAdjustments.map((adjustment, currentIndex) =>
        currentIndex === index ? DEFAULT_PHOTO_ADJUSTMENT : adjustment,
      ),
      selectedPhotoIndex: document.selectedPhotoIndex === index ? null : document.selectedPhotoIndex,
    }));
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      notify("Browser ini tidak mendukung akses kamera.", true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });
      setCameraStream(stream);
    } catch (error) {
      notify(
        error instanceof Error
          ? `Kamera tidak dapat diakses: ${error.message}`
          : "Kamera tidak dapat diakses. Periksa izin kamera browser.",
        true,
      );
    }
  };

  const captureSequence = async () => {
    const video = videoRef.current;
    const targetSlots = emptySlotIndices;
    if (!targetSlots.length) {
      notify("Semua slot sudah terisi. Hapus foto untuk mengambil foto baru.", true);
      return;
    }
    if (!cameraStream || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      notify("Aktifkan kamera dan tunggu sampai pratinjau siap.", true);
      return;
    }

    cancelledCaptureRef.current = false;
    setIsCapturing(true);
    const captureSide = activeSide;
    updateDocument(captureSide, (document) => ({
      ...document,
      selectedPhotoIndex: null,
      selectedObjectId: null,
    }), false);
    const captureCount = targetSlots.length;
    setCaptureTotal(captureCount);
    try {
      for (let index = 0; index < captureCount; index += 1) {
        if (cancelledCaptureRef.current) return;
        setCaptureSlot(index + 1);
        for (let seconds = 3; seconds > 0; seconds -= 1) {
          if (cancelledCaptureRef.current) return;
          setCountdown(seconds);
          await waitOneSecond();
        }
        if (cancelledCaptureRef.current) return;

        const photo = captureVideoFrame(video);
        const targetIndex = targetSlots[index];
        setPhotosBySide((current) => {
          const photos = [...current[captureSide]];
          if (!photos[targetIndex]) photos[targetIndex] = photo;
          return { ...current, [captureSide]: photos };
        });
      }
      notify(`${captureCount} foto berhasil diambil.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal mengambil foto.", true);
    } finally {
      cancelledCaptureRef.current = false;
      setIsCapturing(false);
      setCountdown(null);
      setCaptureSlot(null);
      setCaptureTotal(0);
    }
  };

  const chooseTemplate = (nextTemplate: PhotoBoothTemplate) => {
    updateDocument(activeSide, (document) => ({
      ...document,
      selectedPhotoIndex: null,
    }), false);
    setTemplate(nextTemplate);
    setFilter(nextTemplate.defaultFilter);
  };

  const createExportCanvas = async (side: PhotoBoothSide) => {
    const canvas = document.createElement("canvas");
    const sideDocument = documents[side];
    await renderPhotoBoothCanvas(
      canvas,
      template,
      photosBySide[side],
      filter,
      side,
      sideDocument,
      false,
    );
    return canvas;
  };

  const downloadBothSides = async (format: "png" | "jpg") => {
    if (renderError || isRendering) {
      notify("Pratinjau belum siap. Periksa kembali foto dan template.", true);
      return;
    }

    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        createExportCanvas("front"),
        createExportCanvas("back"),
      ]);
      downloadCanvasImage(frontCanvas, format, `MakeitYours-${template.id}-Depan.${format}`);
      downloadCanvasImage(backCanvas, format, `MakeitYours-${template.id}-Belakang.${format}`);
      notify(`File sisi depan dan belakang diunduh sebagai ${format.toUpperCase()}.`);
    } catch (error) {
      notify(
        error instanceof Error ? `Gagal mengekspor gambar: ${error.message}` : "Gagal mengekspor gambar.",
        true,
      );
    }
  };

  const onBeforeCheckoutSend = async (): Promise<string | null> => {
    if (renderError || isRendering) {
      return "Pratinjau belum siap. Tunggu sampai gambar selesai dirender lalu coba lagi.";
    }

    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        createExportCanvas("front"),
        createExportCanvas("back"),
      ]);
      let pendingOrder = pendingOrderRef.current;
      if (!pendingOrder) {
        const createResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: template.id,
            templateName: template.name,
            frameModel: order.frameModel,
          }),
        });
        if (!createResponse.ok) {
          return await getApiError(createResponse, "Pesanan tidak dapat dibuat. Coba lagi.");
        }
        const result: unknown = await createResponse.json();
        if (
          typeof result !== "object" ||
          result === null ||
          !("code" in result) ||
          typeof result.code !== "string" ||
          !("uploadToken" in result) ||
          typeof result.uploadToken !== "string"
        ) {
          return "Respons server pesanan tidak valid. Coba lagi.";
        }
        pendingOrder = { code: result.code, uploadToken: result.uploadToken };
        pendingOrderRef.current = pendingOrder;
      }

      const uploadHeaders = {
        Authorization: `Bearer ${pendingOrder.uploadToken}`,
        "Content-Type": "image/png",
      };
      const [frontBlob, backBlob] = await Promise.all([
        canvasToPngBlob(frontCanvas),
        canvasToPngBlob(backCanvas),
      ]);
      const frontUpload = await fetch("/api/orders/upload?side=front", {
        method: "PUT",
        headers: uploadHeaders,
        body: frontBlob,
      });
      if (!frontUpload.ok) {
        return await getApiError(frontUpload, "Gagal mengunggah sisi depan. Periksa koneksi lalu coba lagi.");
      }
      const backUpload = await fetch("/api/orders/upload?side=back", {
        method: "PUT",
        headers: uploadHeaders,
        body: backBlob,
      });
      if (!backUpload.ok) {
        return await getApiError(backUpload, "Gagal mengunggah sisi belakang. Periksa koneksi lalu coba lagi.");
      }

      const completeResponse = await fetch("/api/orders/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${pendingOrder.uploadToken}` },
      });
      if (!completeResponse.ok) {
        return await getApiError(completeResponse, "Desain belum tersimpan lengkap. Coba lagi.");
      }
      const completed: unknown = await completeResponse.json();
      if (
        typeof completed !== "object" ||
        completed === null ||
        !("code" in completed) ||
        completed.code !== pendingOrder.code
      ) {
        return "Kode pesanan tidak cocok dengan hasil unggahan. Coba lagi.";
      }
      checkoutCodeRef.current = pendingOrder.code;
      return null;
    } catch (error) {
      if (error instanceof TypeError) {
        return "Koneksi internet bermasalah. Periksa koneksi lalu tekan coba lagi.";
      }
      return error instanceof Error
        ? `Gagal menyimpan desain: ${error.message}`
        : "Gagal menyimpan desain pesanan.";
    }
  };

  const openCheckout = async () => {
    if (isPreparingCheckout) return;
    if (allKeychainOutOfStock || keychainStock[order.frameModel] <= 0) {
      notify("Semua varian keychain sedang habis.", true);
      return;
    }
    if (renderError || isRendering) {
      notify("Pratinjau belum siap. Tunggu sampai gambar selesai dirender lalu coba lagi.", true);
      return;
    }

    setIsPreparingCheckout(true);
    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        createExportCanvas("front"),
        createExportCanvas("back"),
      ]);
      const backPreviewCanvas = rotateLandscapeCanvasToPortrait(backCanvas);
      const [frontBlob, backBlob] = await Promise.all([
        canvasToPngBlob(frontCanvas),
        canvasToPngBlob(backPreviewCanvas),
      ]);
      setCheckoutPreviews({
        front: URL.createObjectURL(frontBlob),
        back: URL.createObjectURL(backBlob),
      });
      checkoutCodeRef.current = "";
      pendingOrderRef.current = null;
      setCheckoutOpen(true);
    } catch (error) {
      notify(
        error instanceof Error
          ? `Gagal menyiapkan preview checkout: ${error.message}`
          : "Gagal menyiapkan preview checkout.",
        true,
      );
    } finally {
      setIsPreparingCheckout(false);
    }
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setCheckoutPreviews(null);
    pendingOrderRef.current = null;
    checkoutCodeRef.current = "";
  };

  const currentOrder = {
    ...order,
    photos: photosBySide.front,
    backPhotos: photosBySide.back,
    photoSlotCount: template.photoSlots.length,
    backPhotoSlotCount: template.backPhotoSlots.length,
    templateName: template.name,
  };
  const activeFilter = FILTER_OPTIONS.find((option) => option.id === filter) ?? FILTER_OPTIONS[0];
  const isCheckoutBusy = isPreparingCheckout || isRendering;
  const selectedObject = currentDocument.objects.find(
    (item) => item.id === currentDocument.selectedObjectId,
  );
  const selectedPhotoIndex = currentDocument.selectedPhotoIndex;
  const clearPhotoSelection = (side: PhotoBoothSide = activeSide) => {
    updateDocument(side, (document) =>
      document.selectedPhotoIndex === null
        ? document
        : { ...document, selectedPhotoIndex: null },
    false);
  };
  const selectEditorTool = (tool: PhotoBoothTool) => {
    if (tool !== "brush" && tool !== "eraser") clearLiveDrawing();
    if (tool !== "move") clearPhotoSelection();
    setToolDockCollapsed(false);
    if (tool === "text" && selectedObject?.kind === "text") {
      setActiveTool("text");
      setFocusTextInput(true);
      return;
    }
    setActiveTool(tool);
  };
  const changeActiveSide = (side: PhotoBoothSide) => {
    if (side === activeSide) return;
    clearPhotoSelection();
    setActiveSide(side);
  };
  const selectedPhotoAdjustment = selectedPhotoIndex === null
    ? DEFAULT_PHOTO_ADJUSTMENT
    : currentDocument.photoAdjustments[selectedPhotoIndex] ?? DEFAULT_PHOTO_ADJUSTMENT;
  const selectedLayerIndex = selectedObject
    ? currentDocument.objects.findIndex((item) => item.id === selectedObject.id)
    : -1;
  const canMoveLayerUp = selectedLayerIndex >= 0 && selectedLayerIndex < currentDocument.objects.length - 1;
  const canMoveLayerDown = selectedLayerIndex > 0;
  const showToolPopover = (activeTool !== "move" && activeTool !== "hand") || Boolean(selectedObject);

  useEffect(() => {
    if (keychainStock[order.frameModel] > 0 || allKeychainOutOfStock) return;
    const fallback = FRAME_MODELS.find((frame) => keychainStock[frame.id] > 0);
    if (!fallback) return;
    setOrder((current) => ({ ...current, frameModel: fallback.id }));
    notify(`Warna ${selectedColor.label} sedang habis. Diganti ke ${fallback.label}.`);
  }, [allKeychainOutOfStock, keychainStock, order.frameModel, selectedColor.label]);

  useEffect(() => {
    if (!focusTextInput || selectedObject?.kind !== "text") return;
    const timer = window.setTimeout(() => {
      const input = textInputRef.current;
      input?.focus();
      input?.select();
      setFocusTextInput(false);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [focusTextInput, selectedObject]);

  useEffect(() => {
    if (selectedPhotoIndex === null) return;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        canvasStageRef.current?.contains(event.target) ||
        photoSettingsRef.current?.contains(event.target)
      ) return;
      updateDocument(activeSide, (document) => ({
        ...document,
        selectedPhotoIndex: null,
      }), false);
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [activeSide, selectedPhotoIndex, updateDocument]);

  const applyCanvasZoom = (
    value: number,
    updateLabel = true,
    anchor?: { x: number; y: number },
  ) => {
    const zoom = Math.max(0.5, Math.min(3, value));
    const previousZoom = canvasZoomRef.current;
    let pan = canvasPanRef.current;
    const bounds = canvasWrapRef.current?.getBoundingClientRect();
    if (anchor && bounds && previousZoom) {
      const ratio = zoom / previousZoom;
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      pan = {
        x: pan.x + (anchor.x - centerX) * (1 - ratio),
        y: pan.y + (anchor.y - centerY) * (1 - ratio),
      };
      canvasPanRef.current = pan;
      setCanvasPan(pan);
    }

    canvasZoomRef.current = zoom;
    if (canvasWrapRef.current) {
      canvasWrapRef.current.style.transform =
        `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`;
    }
    if (updateLabel) setCanvasZoom(zoom);
  };

  const applyCanvasPan = (x: number, y: number, commit = true) => {
    const pan = { x, y };
    canvasPanRef.current = pan;
    if (canvasWrapRef.current) {
      canvasWrapRef.current.style.transform =
        `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${canvasZoomRef.current})`;
    }
    if (commit) setCanvasPan(pan);
  };

  const resetCanvasView = () => {
    applyCanvasPan(0, 0, false);
    applyCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  };

  const handleCanvasWheel = (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      applyCanvasZoom(
        canvasZoomRef.current * Math.exp(-event.deltaY * 0.0015),
        true,
        { x: event.clientX, y: event.clientY },
      );
      return;
    }

    if (event.shiftKey) {
      event.preventDefault();
      const deltaX = event.deltaX || event.deltaY;
      applyCanvasPan(canvasPanRef.current.x - deltaX, canvasPanRef.current.y);
    }
  };

  const handleCanvasTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 2) return;
    event.preventDefault();
    const [first, second] = Array.from(event.touches);
    pinchStartRef.current = {
      distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
      zoom: canvasZoomRef.current,
    };

    const photoDrag = photoDragRef.current;
    if (photoDrag?.moved) recordDocumentSnapshot(photoDrag.side, photoDrag.before);
    const objectDrag = dragRef.current;
    if (objectDrag?.moved) recordDocumentSnapshot(objectDrag.side, objectDrag.before);
    canvasPanDragRef.current = null;
    setIsCanvasPanning(false);
    photoDragRef.current = null;
    dragRef.current = null;
    brushStrokeRef.current = null;
    const overlay = liveDrawingRef.current;
    if (overlay) overlay.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
  };

  const handleCanvasTouchMove = (event: TouchEvent) => {
    if (!pinchStartRef.current || event.touches.length !== 2) return;
    event.preventDefault();
    const [first, second] = Array.from(event.touches);
    const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    if (!pinchStartRef.current.distance) return;
    applyCanvasZoom(
      pinchStartRef.current.zoom * distance / pinchStartRef.current.distance,
      false,
    );
  };

  const handleCanvasTouchEnd = (event: TouchEvent) => {
    if (event.touches.length >= 2 || !pinchStartRef.current) return;
    pinchStartRef.current = null;
    setCanvasZoom(canvasZoomRef.current);
    setCanvasPan(canvasPanRef.current);
  };

  const canvasGestureHandlersRef = useRef({
    wheel: handleCanvasWheel,
    touchStart: handleCanvasTouchStart,
    touchMove: handleCanvasTouchMove,
    touchEnd: handleCanvasTouchEnd,
  });
  canvasGestureHandlersRef.current = {
    wheel: handleCanvasWheel,
    touchStart: handleCanvasTouchStart,
    touchMove: handleCanvasTouchMove,
    touchEnd: handleCanvasTouchEnd,
  };

  useEffect(() => {
    const stage = canvasStageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => canvasGestureHandlersRef.current.wheel(event);
    const handleTouchStart = (event: TouchEvent) => canvasGestureHandlersRef.current.touchStart(event);
    const handleTouchMove = (event: TouchEvent) => canvasGestureHandlersRef.current.touchMove(event);
    const handleTouchEnd = (event: TouchEvent) => canvasGestureHandlersRef.current.touchEnd(event);

    stage.addEventListener("wheel", handleWheel, { passive: false });
    stage.addEventListener("touchstart", handleTouchStart, { passive: false });
    stage.addEventListener("touchmove", handleTouchMove, { passive: false });
    stage.addEventListener("touchend", handleTouchEnd);
    stage.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      stage.removeEventListener("wheel", handleWheel);
      stage.removeEventListener("touchstart", handleTouchStart);
      stage.removeEventListener("touchmove", handleTouchMove);
      stage.removeEventListener("touchend", handleTouchEnd);
      stage.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const updatePhotoAdjustment = (
    index: number,
    patch: Partial<typeof DEFAULT_PHOTO_ADJUSTMENT>,
    recordHistory = true,
  ) => {
    updateDocument(activeSide, (document) => {
      const photoAdjustments = [...document.photoAdjustments];
      const adjustment = {
        ...DEFAULT_PHOTO_ADJUSTMENT,
        ...photoAdjustments[index],
        ...patch,
      };
      const photoSource = photosBySide[activeSide][index];
      const photoSlot = sideTemplate.photoSlots[index];
      photoAdjustments[index] = photoSource && photoSlot
        ? clampPhotoPan(photoSource, photoSlot, adjustment)
        : adjustment;
      return { ...document, photoAdjustments, selectedPhotoIndex: index };
    }, recordHistory);
  };

  const updateSelectedObject = (patch: Partial<EditorObject>) => {
    if (!selectedObject) return;
    updateDocument(activeSide, (document) => ({
      ...document,
      objects: document.objects.map((item) =>
        item.id === selectedObject.id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const addEditorObject = (object: EditorObject) => {
    updateDocument(activeSide, (document) => ({
      ...document,
      objects: [...document.objects, object],
      selectedObjectId: object.id,
      selectedPhotoIndex: null,
    }));
    if (object.kind === "text") {
      // Switch ke "move" setelah menambah teks agar klik berikutnya tidak
      // membuat teks baru lagi (mencegah duplikat tidak disengaja)
      setActiveTool("move");
      setFocusTextInput(true);
      setToolDockCollapsed(false);
      return;
    }
    setActiveTool("move");
  };

  const toLocalPoint = (point: { x: number; y: number }, item: EditorObject) => {
    const rad = (-item.rotation * Math.PI) / 180;
    const dx = point.x - item.x;
    const dy = point.y - item.y;
    return {
      x: dx * Math.cos(rad) - dy * Math.sin(rad),
      y: dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  };

  const hitTestObject = (point: { x: number; y: number }) =>
    [...currentDocument.objects].reverse().find((item) => {
      const local = toLocalPoint(point, item);
      return (
        Math.abs(local.x) <= item.width / 2 + 10 &&
        Math.abs(local.y) <= item.height / 2 + 10
      );
    });

  const createTextObject = (x: number, y: number): EditorObject => ({
    id: `text-${Date.now()}`,
    kind: "text",
    x,
    y,
    width: Math.min(sideTemplate.canvasSize.width * 0.72, 560),
    height: textSize * 1.4,
    rotation: 0,
    text: textDraft.trim() || "Teks baru",
    fontFamily: textFont,
    fontSize: textSize,
    color: textColor,
  });

  const addCenteredText = () => {
    // Jika sudah ada teks yang terpilih, fokuskan saja (jangan duplikat)
    if (selectedObject?.kind === "text") {
      setFocusTextInput(true);
      return;
    }
    addEditorObject(createTextObject(
      sideTemplate.canvasSize.width / 2,
      sideTemplate.canvasSize.height / 2,
    ));
  };

  const selectCanvasObject = (object: EditorObject) => {
    updateDocument(activeSide, (document) => ({
      ...document,
      selectedObjectId: object.id,
      selectedPhotoIndex: null,
    }), false);
    setToolDockCollapsed(false);
    if (object.kind === "text") {
      // TIDAK berpindah ke activeTool "text" otomatis, agar pengguna tetap dapat move/transform di kanvas
      setTextDraft(object.text ?? "Teks baru");
      setTextFont(object.fontFamily ?? fontOptions[0]);
      setTextColor(object.color ?? "#382c30");
      setTextSize(object.fontSize ?? 64);
    }
  };

  const handleUploadFont = async (file: File | undefined) => {
    if (!file) return;
    try {
      const rawName = file.name.replace(/\.[^/.]+$/, "").trim();
      const fontName = rawName || "CustomFont";
      const buffer = await file.arrayBuffer();
      const fontFace = new FontFace(fontName, buffer);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);
      setFontOptions((prev) => (prev.includes(fontName) ? prev : [fontName, ...prev]));
      setTextFont(fontName);
      if (selectedObject?.kind === "text") {
        updateSelectedObject({ fontFamily: fontName });
      }
      notify(`Font "${fontName}" berhasil dimuat! ✨`);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Gagal memuat file font (.ttf / .otf / .woff2).",
        true,
      );
    }
  };

  const applyObjectLayer = (
    mutator: (document: PhotoBoothDocument, objectId: string) => PhotoBoothDocument,
  ) => {
    if (!selectedObject) return;
    updateDocument(activeSide, (document) => mutator(document, selectedObject.id));
  };

  const deleteSelectedObject = () => {
    if (!selectedObject) return;
    updateDocument(activeSide, (document) => ({
      ...document,
      objects: document.objects.filter((item) => item.id !== selectedObject.id),
      selectedObjectId: null,
    }));
    if (activeTool === "text") setActiveTool("move");
  };

  const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * sideTemplate.canvasSize.width,
      y: ((event.clientY - bounds.top) / bounds.height) * sideTemplate.canvasSize.height,
    };
  };

  const clearLiveDrawing = () => {
    const overlay = liveDrawingRef.current;
    overlay?.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
  };

  const drawToolCursor = (canvas: HTMLCanvasElement, point: { x: number; y: number }) => {
    const overlay = liveDrawingRef.current;
    const context = overlay?.getContext("2d");
    const bounds = canvas.getBoundingClientRect();
    if (!overlay || !context || !bounds.width) return;

    context.clearRect(0, 0, overlay.width, overlay.height);
    const screenScale = bounds.width / overlay.width;
    const lineWidth = Math.min(1 / screenScale, Math.max(1, brushSize / 4));
    const radius = Math.max(0, brushSize / 2 - lineWidth);
    context.save();
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.strokeStyle = "#ffffff";
    context.lineWidth = lineWidth * 2;
    context.stroke();
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.strokeStyle = activeTool === "eraser" ? "#382c30" : brushColor;
    context.lineWidth = lineWidth * 0.75;
    context.stroke();
    context.restore();
  };

  const handleCanvasPointerLeave = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!brushStrokeRef.current) clearLiveDrawing();
    event.currentTarget.style.cursor = "default";
  };

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const point = {
      x: ((event.clientX - bounds.left) / bounds.width) * sideTemplate.canvasSize.width,
      y: ((event.clientY - bounds.top) / bounds.height) * sideTemplate.canvasSize.height,
    };
    const hit = hitTestObject(point);
    if (hit?.kind !== "text") return;
    selectCanvasObject(hit);
    setFocusTextInput(true);
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (pinchStartRef.current && event.pointerType === "touch") return;
    if (activeTool === "hand") {
      canvasPanDragRef.current = {
        side: activeSide,
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      setIsCanvasPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const point = canvasPoint(event);
    if (activeTool === "text") {
      const existing = hitTestObject(point);
      if (existing) {
        selectCanvasObject(existing);
        return;
      }
      addEditorObject(createTextObject(point.x, point.y));
      return;
    }

    if (activeTool === "sticker") {
      addEditorObject({
        id: `sticker-${Date.now()}`,
        kind: "sticker",
        x: point.x,
        y: point.y,
        width: 116,
        height: 116,
        rotation: 0,
        emoji: activeSticker,
      });
      return;
    }

    if (activeTool === "brush" || activeTool === "eraser") {
      clearLiveDrawing();
      const stroke: BrushStroke = {
        points: [point],
        color: brushColor,
        width: brushSize,
        mode: activeTool,
      };
      brushStrokeRef.current = { side: activeSide, stroke };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    // 1. Cek apakah ada objek yang sedang terpilih dan pointer mengenai handle Rotate atau Resize
    if (selectedObject) {
      const localP = toLocalPoint(point, selectedObject);
      const rotateHandleY = -selectedObject.height / 2 - 34;
      const isRotateHit = Math.hypot(localP.x - 0, localP.y - rotateHandleY) <= 24;

      if (isRotateHit) {
        dragRef.current = {
          side: activeSide,
          objectId: selectedObject.id,
          offsetX: 0,
          offsetY: 0,
          initial: selectedObject,
          before: currentDocument,
          mode: "rotate",
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      const resizeHandleX = selectedObject.width / 2;
      const resizeHandleY = selectedObject.height / 2;
      const isResizeHit = Math.hypot(localP.x - resizeHandleX, localP.y - resizeHandleY) <= 24;

      if (isResizeHit) {
        dragRef.current = {
          side: activeSide,
          objectId: selectedObject.id,
          offsetX: 0,
          offsetY: 0,
          initial: selectedObject,
          before: currentDocument,
          mode: "resize",
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
    }

    const hit = hitTestObject(point);
    if (!hit) {
      const photoIndex = currentSlots.findIndex((slot, index) => {
        if (!Boolean(sidePhotos[index])) return false;
        if (!slot.rotation) {
          return (
            point.x >= slot.x &&
            point.x <= slot.x + slot.width &&
            point.y >= slot.y &&
            point.y <= slot.y + slot.height
          );
        }
        const centerX = slot.x + slot.width / 2;
        const centerY = slot.y + slot.height / 2;
        const rad = (-slot.rotation * Math.PI) / 180;
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
        return Math.abs(lx) <= slot.width / 2 && Math.abs(ly) <= slot.height / 2;
      });
      updateDocument(activeSide, (document) => ({
        ...document,
        selectedObjectId: null,
        selectedPhotoIndex: photoIndex >= 0 ? photoIndex : null,
      }), false);
      if (photoIndex >= 0) {
        photoDragRef.current = {
          side: activeSide,
          index: photoIndex,
          lastX: point.x,
          lastY: point.y,
          before: currentDocument,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }

    selectCanvasObject(hit);
    dragRef.current = {
      side: activeSide,
      objectId: hit.id,
      offsetX: point.x - hit.x,
      offsetY: point.y - hit.y,
      initial: hit,
      before: currentDocument,
      mode: "move",
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const panDrag = canvasPanDragRef.current;
    if (panDrag?.side === activeSide && panDrag.pointerId === event.pointerId) {
      const deltaX = event.clientX - panDrag.lastX;
      const deltaY = event.clientY - panDrag.lastY;
      panDrag.lastX = event.clientX;
      panDrag.lastY = event.clientY;
      applyCanvasPan(
        canvasPanRef.current.x + deltaX,
        canvasPanRef.current.y + deltaY,
        false,
      );
      return;
    }

    const point = canvasPoint(event);
    const activeStroke = brushStrokeRef.current;
    if (activeStroke?.side === activeSide) {
      const previous = activeStroke.stroke.points[activeStroke.stroke.points.length - 1];
      activeStroke.stroke.points.push(point);
      const overlay = liveDrawingRef.current;
      const context = overlay?.getContext("2d");
      if (context) {
        context.save();
        context.strokeStyle = activeStroke.stroke.mode === "eraser" ? "#b83e68" : activeStroke.stroke.color;
        context.lineWidth = activeStroke.stroke.mode === "eraser" ? 2 : activeStroke.stroke.width;
        context.lineCap = "round";
        context.lineJoin = "round";
        if (activeStroke.stroke.mode === "eraser") {
          context.setLineDash([6, 5]);
        }
        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(point.x, point.y);
        context.stroke();
        context.restore();
      }
      return;
    }

    if (activeTool === "brush" || activeTool === "eraser") {
      drawToolCursor(event.currentTarget, point);
      return;
    }

    const drag = dragRef.current;
    const photoDrag = photoDragRef.current;
    if (photoDrag?.side === activeSide) {
      const deltaX = point.x - photoDrag.lastX;
      const deltaY = point.y - photoDrag.lastY;
      photoDrag.lastX = point.x;
      photoDrag.lastY = point.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 0) {
        photoDrag.moved = true;
        const slot = currentSlots[photoDrag.index];
        let moveX = deltaX;
        let moveY = deltaY;
        if (slot?.rotation) {
          const rad = (-slot.rotation * Math.PI) / 180;
          moveX = deltaX * Math.cos(rad) - deltaY * Math.sin(rad);
          moveY = deltaX * Math.sin(rad) + deltaY * Math.cos(rad);
        }
        updatePhotoAdjustment(photoDrag.index, {
          panX: (currentDocument.photoAdjustments[photoDrag.index]?.panX ?? 0) + moveX,
          panY: (currentDocument.photoAdjustments[photoDrag.index]?.panY ?? 0) + moveY,
        }, false);
      }
      return;
    }
    if (drag && drag.side === activeSide) {
      drag.moved = true;
      updateDocument(drag.side, (document) => ({
        ...document,
        objects: document.objects.map((item) => {
          if (item.id !== drag.objectId) return item;
          if (drag.mode === "rotate") {
            const angleRad = Math.atan2(point.y - drag.initial.y, point.x - drag.initial.x);
            let deg = Math.round((angleRad * 180) / Math.PI + 90);
            deg = ((deg % 360) + 540) % 360 - 180;
            return { ...item, rotation: deg };
          }
          if (drag.mode === "resize") {
            const localP = toLocalPoint(point, drag.initial);
            const scaleX = Math.max(0.3, (localP.x * 2) / drag.initial.width);
            const scaleY = Math.max(0.3, (localP.y * 2) / drag.initial.height);
            const scale = Math.max(0.3, Math.min(5, Math.max(scaleX, scaleY)));
            const newWidth = Math.max(40, Math.round(drag.initial.width * scale));
            if (item.kind === "text") {
              const baseFontSize = drag.initial.fontSize ?? 64;
              const newFontSize = Math.max(16, Math.min(220, Math.round(baseFontSize * scale)));
              return {
                ...item,
                width: newWidth,
                fontSize: newFontSize,
                height: Math.round(newFontSize * 1.4),
              };
            }
            const newHeight = Math.max(40, Math.round(drag.initial.height * scale));
            return { ...item, width: newWidth, height: newHeight };
          }
          return { ...item, x: point.x - drag.offsetX, y: point.y - drag.offsetY };
        }),
      }), false);
      return;
    }

    // Dynamic cursor feedback saat kursor berada di atas kanvas
    if (activeTool === "move" && selectedObject) {
      const localP = toLocalPoint(point, selectedObject);
      const rotateHandleY = -selectedObject.height / 2 - 34;
      const isRotateHover = Math.hypot(localP.x - 0, localP.y - rotateHandleY) <= 24;
      const resizeHandleX = selectedObject.width / 2;
      const resizeHandleY = selectedObject.height / 2;
      const isResizeHover = Math.hypot(localP.x - resizeHandleX, localP.y - resizeHandleY) <= 24;
      const isBodyHover = Math.abs(localP.x) <= selectedObject.width / 2 + 10 && Math.abs(localP.y) <= selectedObject.height / 2 + 10;

      if (isRotateHover) {
        event.currentTarget.style.cursor = "grab";
      } else if (isResizeHover) {
        event.currentTarget.style.cursor = "nwse-resize";
      } else if (isBodyHover) {
        event.currentTarget.style.cursor = "move";
      } else {
        event.currentTarget.style.cursor = "default";
      }
    } else if (activeTool === "move") {
      const hit = hitTestObject(point);
      event.currentTarget.style.cursor = hit ? "move" : "default";
    }
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const panDrag = canvasPanDragRef.current;
    if (panDrag?.side === activeSide && panDrag.pointerId === event.pointerId) {
      canvasPanDragRef.current = null;
      setCanvasPan(canvasPanRef.current);
      setIsCanvasPanning(false);
    }

    const activeStroke = brushStrokeRef.current;
    if (activeStroke?.side === activeSide) {
      clearLiveDrawing();
      updateDocument(activeSide, (document) => ({
        ...document,
        strokes: [...document.strokes, activeStroke.stroke],
        selectedObjectId: null,
      }));
      brushStrokeRef.current = null;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerIsInside = event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;
    if (
      event.type !== "pointercancel" &&
      pointerIsInside &&
      (activeTool === "brush" || activeTool === "eraser")
    ) {
      drawToolCursor(event.currentTarget, canvasPoint(event));
    }

    const photoDrag = photoDragRef.current;
    if (photoDrag?.side === activeSide) {
      if (photoDrag.moved) recordDocumentSnapshot(photoDrag.side, photoDrag.before);
      photoDragRef.current = null;
    }

    const drag = dragRef.current;
    if (drag?.side === activeSide) {
      if (drag.moved) recordDocumentSnapshot(drag.side, drag.before);
      dragRef.current = null;
    }
    event.currentTarget.style.cursor = "default";
  };

  const onPickStickerPng = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "image/png") {
      notify("Pilih file dekorasi dengan format PNG.", true);
      return;
    }
    try {
      const source = await readImageFile(file);
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("File PNG tidak dapat dibaca."));
        image.src = source;
      });
      const scale = Math.min(1, 240 / image.width, 240 / image.height);
      addEditorObject({
        id: `image-${Date.now()}`,
        kind: "image",
        x: sideTemplate.canvasSize.width / 2,
        y: sideTemplate.canvasSize.height / 2,
        width: image.width * scale,
        height: image.height * scale,
        rotation: 0,
        src: source,
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal memuat dekorasi.", true);
    }
  };

  const layerControls = selectedObject && (
    <div className="booth-layer-actions" role="group" aria-label="Urutan layer objek">
      <button
        type="button"
        title="Pindah ke Depan / Atas"
        aria-label="Pindah ke depan"
        disabled={!canMoveLayerUp}
        onClick={() => applyObjectLayer(moveObjectUp)}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Pindah ke Belakang / Bawah"
        aria-label="Pindah ke belakang"
        disabled={!canMoveLayerDown}
        onClick={() => applyObjectLayer(moveObjectDown)}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Paling depan"
        aria-label="Bawa ke paling depan"
        disabled={!canMoveLayerUp}
        onClick={() => applyObjectLayer(bringObjectToFront)}
      >
        <ChevronsUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Paling belakang"
        aria-label="Kirim ke paling belakang"
        disabled={!canMoveLayerDown}
        onClick={() => applyObjectLayer(sendObjectToBack)}
      >
        <ChevronsDown className="h-4 w-4" />
      </button>
    </div>
  );

  const selectedText = selectedObject?.kind === "text" ? selectedObject : null;

  const toolTopBar = (
    <>
      <input
        ref={customFontInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={(e) => {
          void handleUploadFont(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={stickerPngInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(event) => {
          void onPickStickerPng(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      {(selectedText || activeTool === "text") && (
        <div className="booth-tool-topbar">
          {selectedText ? (
            <>
              <input
                ref={textInputRef}
                type="text"
                maxLength={60}
                placeholder="Tulis sesuatu..."
                value={selectedText.text ?? ""}
                onChange={(e) => updateSelectedObject({ text: e.target.value })}
                className="h-8 w-28 sm:w-40 md:w-52 px-2.5 text-xs font-semibold rounded-lg border border-[var(--booth-border)] bg-white text-[var(--booth-ink)] focus:outline-none focus:ring-1 focus:ring-[#DB2777] shrink-0"
              />
              <select
                value={selectedText.fontFamily ?? fontOptions[0]}
                onChange={(e) => updateSelectedObject({ fontFamily: e.target.value })}
                className="h-8 px-2 text-xs font-semibold rounded-lg border border-[var(--booth-border)] bg-white text-[var(--booth-ink)] max-w-[120px] sm:max-w-[140px] shrink-0 focus:outline-none focus:ring-1 focus:ring-[#DB2777]"
              >
                {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
              <button
                type="button"
                title="Unggah font sendiri (.ttf, .otf, .woff2)"
                onClick={() => customFontInputRef.current?.click()}
                className="h-8 px-2 rounded-lg border border-[var(--booth-border)] bg-white hover:bg-pink-50 text-[#DB2777] text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Font</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                <label
                  className="relative flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 cursor-pointer overflow-hidden shadow-xs hover:scale-105 transition-transform shrink-0"
                  style={{ backgroundColor: selectedText.color ?? "#382c30" }}
                  title="Pilih warna bebas"
                >
                  <input
                    type="color"
                    value={selectedText.color ?? "#382c30"}
                    onChange={(e) => updateSelectedObject({ color: e.target.value })}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                </label>
                <div className="hidden lg:flex items-center gap-1">
                  {TEXT_COLOR_OPTIONS.slice(0, 5).map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Pilih warna ${color}`}
                      onClick={() => updateSelectedObject({ color })}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full border border-black/10 shadow-xs hover:scale-110 transition-transform ${selectedText.color === color ? "ring-2 ring-[#DB2777]" : ""}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 border-l border-gray-200 pl-1">
                <button
                  type="button"
                  title="Pindah ke depan"
                  disabled={!canMoveLayerUp}
                  onClick={() => applyObjectLayer(moveObjectUp)}
                  className="p-1 rounded text-gray-500 hover:text-black disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Pindah ke belakang"
                  disabled={!canMoveLayerDown}
                  onClick={() => applyObjectLayer(moveObjectDown)}
                  className="p-1 rounded text-gray-500 hover:text-black disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                title="Hapus teks"
                onClick={deleteSelectedObject}
                className="h-8 w-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center justify-center shrink-0 ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Selesai"
                onClick={() => {
                  updateDocument(activeSide, (doc) => ({ ...doc, selectedObjectId: null }), false);
                  if (activeTool === "text") selectEditorTool("move");
                }}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={addCenteredText}
                className="h-8 px-3 rounded-lg bg-[#DB2777] text-white text-xs font-bold hover:bg-[#be185d] flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Teks
              </button>
              <input
                type="text"
                placeholder="Tulis sesuatu..."
                maxLength={60}
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                className="h-8 w-28 sm:w-40 md:w-52 px-2.5 text-xs font-semibold rounded-lg border border-[var(--booth-border)] bg-white text-[var(--booth-ink)] focus:outline-none focus:ring-1 focus:ring-[#DB2777] shrink-0"
              />
              <select
                value={textFont}
                onChange={(e) => setTextFont(e.target.value)}
                className="h-8 px-2 text-xs font-semibold rounded-lg border border-[var(--booth-border)] bg-white text-[var(--booth-ink)] max-w-[120px] sm:max-w-[140px] shrink-0 focus:outline-none focus:ring-1 focus:ring-[#DB2777]"
              >
                {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
              <button
                type="button"
                title="Unggah font sendiri (.ttf, .otf, .woff2)"
                onClick={() => customFontInputRef.current?.click()}
                className="h-8 px-2 rounded-lg border border-[var(--booth-border)] bg-white hover:bg-pink-50 text-[#DB2777] text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Font</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                <label
                  className="relative flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 cursor-pointer overflow-hidden shadow-xs hover:scale-105 transition-transform shrink-0"
                  style={{ backgroundColor: textColor }}
                  title="Pilih warna bebas"
                >
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
              <button
                type="button"
                title="Tutup"
                onClick={() => selectEditorTool("move")}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0 ml-auto"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}

      {activeTool === "brush" && (
        <div className="booth-tool-topbar">
          <span className="text-xs font-bold text-[var(--booth-ink)] flex items-center gap-1.5 shrink-0">
            <Brush className="h-4 w-4 text-[#DB2777]" />
            Brush
          </span>
          <label
            className="relative flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 cursor-pointer overflow-hidden shadow-xs shrink-0"
            style={{ backgroundColor: brushColor }}
            title="Pilih warna brush"
          >
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
            />
          </label>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {["#b83e68", "#382c30", "#ffffff", "#e7a5bd", "#7d9bb5", "#e7b44a"].map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Warna ${color}`}
                onClick={() => setBrushColor(color)}
                style={{ backgroundColor: color }}
                className={`w-5 h-5 rounded-full border border-black/10 shadow-xs hover:scale-110 transition-transform ${brushColor === color ? "ring-2 ring-[#DB2777]" : ""}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">{brushSize}px</span>
            <input
              type="range"
              min="3"
              max="80"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 sm:w-28 accent-[#DB2777]"
            />
          </div>
          <button
            type="button"
            title="Tutup"
            onClick={() => selectEditorTool("move")}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0 ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {activeTool === "eraser" && (
        <div className="booth-tool-topbar">
          <span className="text-xs font-bold text-[var(--booth-ink)] flex items-center gap-1.5 shrink-0">
            <Eraser className="h-4 w-4 text-[#DB2777]" />
            Penghapus
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">{brushSize}px</span>
            <input
              type="range"
              min="3"
              max="80"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 sm:w-36 accent-[#DB2777]"
            />
          </div>
          <button
            type="button"
            title="Tutup"
            onClick={() => selectEditorTool("move")}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0 ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {activeTool === "sticker" && (
        <div className="booth-tool-topbar">
          <span className="text-xs font-bold text-[var(--booth-ink)] flex items-center gap-1 shrink-0 mr-1">
            <Sticker className="h-4 w-4 text-[#DB2777]" />
            Stiker:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {STICKER_OPTIONS.map((sticker) => (
              <button
                key={sticker}
                type="button"
                aria-label={`Pilih stiker ${sticker}`}
                onClick={() => {
                  setActiveSticker(sticker);
                  setActiveTool("sticker");
                }}
                className={`w-7 h-7 rounded-lg text-base flex items-center justify-center hover:bg-pink-50 transition-colors shrink-0 ${activeSticker === sticker ? "bg-pink-100 ring-1 ring-[#DB2777]" : ""}`}
              >
                {sticker}
              </button>
            ))}
          </div>
          <button
            type="button"
            title="Unggah stiker PNG"
            onClick={() => stickerPngInputRef.current?.click()}
            className="h-8 px-2.5 rounded-lg border border-[var(--booth-border)] bg-white hover:bg-pink-50 text-gray-700 text-xs font-semibold flex items-center gap-1 shrink-0"
          >
            <Upload className="h-3.5 w-3.5 text-[#DB2777]" />
            <span className="hidden sm:inline">PNG</span>
          </button>
          <button
            type="button"
            title="Tutup"
            onClick={() => selectEditorTool("move")}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0 ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {selectedObject && selectedObject.kind !== "text" && (
        <div className="booth-tool-topbar">
          <span className="text-xs font-bold text-[var(--booth-ink)] shrink-0">
            Objek terpilih
          </span>
          <div className="flex items-center gap-0.5 shrink-0 border-l border-gray-200 pl-1.5">
            <button
              type="button"
              title="Pindah ke depan"
              disabled={!canMoveLayerUp}
              onClick={() => applyObjectLayer(moveObjectUp)}
              className="p-1 rounded text-gray-500 hover:text-black disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Pindah ke belakang"
              disabled={!canMoveLayerDown}
              onClick={() => applyObjectLayer(moveObjectDown)}
              className="p-1 rounded text-gray-500 hover:text-black disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            title="Hapus objek"
            onClick={deleteSelectedObject}
            className="h-8 w-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center justify-center shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Selesai"
            onClick={() => updateDocument(activeSide, (doc) => ({ ...doc, selectedObjectId: null }), false)}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0 ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="photobooth-page flex min-h-screen flex-col">
      <AppHeader />

      {notice && (
        <div
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 px-4"
          role={noticeIsError ? "alert" : "status"}
          aria-live="polite"
        >
          <div className={`rounded-full border bg-white px-5 py-2 text-center text-xs font-bold shadow-lg ${noticeIsError ? "border-red-200 text-red-700" : "border-[var(--booth-border)] text-[var(--booth-accent)]"}`}>
            {notice}
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[1480px] flex-1 flex-col px-3 pb-6 pt-3 sm:px-5 sm:pt-4 lg:pb-6 xl:px-7">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              aria-label="Kembali ke beranda"
              className="booth-back-button"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>
            <div className="min-w-0">
              <p className="booth-eyebrow">MAKEITYOURS · KEYCHAIN STUDIO</p>
              <h1 className="truncate font-display text-xl font-extrabold tracking-tight text-[var(--booth-ink)] sm:text-2xl">
                Studio Photobooth
              </h1>
            </div>
          </div>
          <div className="booth-progress" role="status">
            <Sparkles className="booth-progress-icon h-4 w-4" aria-hidden="true" />
            <span><strong>{frontPhotoCount + backPhotoCount}/{template.photoSlots.length + template.backPhotoSlots.length}</strong><span className="hidden sm:inline"> foto terisi</span></span>
          </div>
        </header>

        <div className="booth-workspace grid flex-1 gap-3 lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
          <section className="booth-panel relative flex min-h-[460px] flex-col overflow-hidden p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-[var(--booth-ink)] sm:text-lg">Pratinjau</h2>
                <p className="booth-muted text-xs">
                  {sideTemplate.canvasSize.width} × {sideTemplate.canvasSize.height} px · {activeSide === "front" ? "sisi depan" : "sisi belakang"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="booth-filter-label">{activeFilter.label}</span>
                <button
                  ref={filterSettingsButtonRef}
                  type="button"
                  aria-label="Pengaturan filter foto"
                  aria-haspopup="dialog"
                  aria-expanded={filterSettingsOpen}
                  onClick={() => setFilterSettingsOpen(true)}
                  className="booth-icon-button"
                  title="Pengaturan filter"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="booth-side-switch mb-3" role="group" aria-label="Pilih sisi keychain">
              <button type="button" aria-pressed={activeSide === "front"} onClick={() => changeActiveSide("front")}>
                Depan
                <span>{frontPhotoCount}/{template.photoSlots.length}</span>
              </button>
              <button type="button" aria-pressed={activeSide === "back"} onClick={() => changeActiveSide("back")}>
                Belakang
                <span>{backPhotoCount}/{template.backPhotoSlots.length}</span>
              </button>
            </div>

            <div className="booth-canvas-workspace">
              <div className="booth-tool-dock">
                <div className="booth-editor-rail" role="toolbar" aria-label="Alat edit foto">
                  {([
                    ["hand", "Hand", Hand],
                    ["move", "Move", Move],
                    ["brush", "Brush", Brush],
                    ["eraser", "Penghapus", Eraser],
                    ["text", "Teks", Type],
                    ["sticker", "Stiker", Sticker],
                  ] as const).map(([tool, label, Icon]) => (
                    <button
                      key={tool}
                      type="button"
                      aria-label={label}
                      aria-pressed={activeTool === tool}
                      onClick={() => selectEditorTool(tool)}
                      className="booth-editor-tool"
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                  <span className="booth-rail-divider" aria-hidden="true" />
                  <button
                    type="button"
                    title="Urungkan perubahan"
                    aria-label="Urungkan perubahan"
                    disabled={!history[activeSide].past.length}
                    onClick={() => undo(activeSide)}
                    className="booth-editor-tool disabled:opacity-40"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Ulangi perubahan"
                    aria-label="Ulangi perubahan"
                    disabled={!history[activeSide].future.length}
                    onClick={() => redo(activeSide)}
                    className="booth-editor-tool disabled:opacity-40"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                className="booth-stage flex flex-1 flex-col overflow-hidden rounded-2xl p-3 sm:p-4"
              >
                {toolTopBar}
              <div ref={canvasStageRef} className="booth-stage-canvas">
              <div
                ref={canvasWrapRef}
                className={`booth-canvas-wrap booth-canvas-tool-${activeTool}${isCanvasPanning ? " is-panning" : ""}`}
                style={{
                  aspectRatio: `${sideTemplate.canvasSize.width} / ${sideTemplate.canvasSize.height}`,
                  width: `min(100%, ${46 * sideTemplate.canvasSize.width / sideTemplate.canvasSize.height}svh)`,
                  transform: `translate3d(${canvasPan.x}px, ${canvasPan.y}px, 0) scale(${canvasZoom})`,
                }}
              >
                <canvas
                  ref={frontRender.canvasRef}
                  aria-label={`Pratinjau sisi depan ${template.name}`}
                  className={`booth-canvas shadow-[0_12px_30px_rgba(54,35,42,0.16)] ${activeSide === "front" ? "" : "is-inactive"}`}
                  onPointerDown={activeSide === "front" ? handleCanvasPointerDown : undefined}
                  onPointerMove={activeSide === "front" ? handleCanvasPointerMove : undefined}
                  onPointerUp={activeSide === "front" ? handleCanvasPointerUp : undefined}
                  onPointerCancel={activeSide === "front" ? handleCanvasPointerUp : undefined}
                  onPointerLeave={activeSide === "front" ? handleCanvasPointerLeave : undefined}
                  onDoubleClick={activeSide === "front" ? handleCanvasDoubleClick : undefined}
                />
                <canvas
                  ref={backRender.canvasRef}
                  aria-label={`Pratinjau sisi belakang ${template.name}`}
                  className={`booth-canvas shadow-[0_12px_30px_rgba(54,35,42,0.16)] ${activeSide === "back" ? "" : "is-inactive"}`}
                  onPointerDown={activeSide === "back" ? handleCanvasPointerDown : undefined}
                  onPointerMove={activeSide === "back" ? handleCanvasPointerMove : undefined}
                  onPointerUp={activeSide === "back" ? handleCanvasPointerUp : undefined}
                  onPointerCancel={activeSide === "back" ? handleCanvasPointerUp : undefined}
                  onPointerLeave={activeSide === "back" ? handleCanvasPointerLeave : undefined}
                  onDoubleClick={activeSide === "back" ? handleCanvasDoubleClick : undefined}
                />
                <canvas ref={liveDrawingRef} className="booth-live-drawing" aria-hidden="true" />
                {currentSlots.map((slot, index) => {
                  const position: React.CSSProperties = {
                    left: `${(slot.x / sideTemplate.canvasSize.width) * 100}%`,
                    top: `${(slot.y / sideTemplate.canvasSize.height) * 100}%`,
                    width: `${(slot.width / sideTemplate.canvasSize.width) * 100}%`,
                    height: `${(slot.height / sideTemplate.canvasSize.height) * 100}%`,
                    transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                    transformOrigin: "center center",
                  };

                  if (sidePhotos[index]) {
                    return (
                      <div key={slot.id} className="booth-canvas-photo-overlay" style={position}>
                        <button
                          type="button"
                          aria-label={`Hapus foto ${index + 1}`}
                          className="booth-canvas-photo-remove"
                          onClick={() => clearPhoto(index, activeSide)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  }
                  if (activeTool !== "move") return null;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      aria-label={`Tambahkan foto ${index + 1} pada sisi ${activeSide === "front" ? "depan" : "belakang"}`}
                      className="booth-canvas-slot-add"
                      style={position}
                      disabled={isCapturing}
                      onClick={() => openPhotoPicker(index, activeSide)}
                    >
                      <span><Plus className="h-4 w-4" /></span>
                    </button>
                  );
                })}
              </div>
              {isRendering && (
                <span className="booth-render-status" role="status">Memperbarui desain…</span>
              )}
              </div>
              {activeTool === "move" && selectedPhotoIndex !== null && sidePhotos[selectedPhotoIndex] && (
                <div
                  ref={photoSettingsRef}
                  className="booth-photo-adjustment-bar"
                  role="toolbar"
                  aria-label={`Pengaturan foto ${selectedPhotoIndex + 1}`}
                >
                  <label className="booth-photo-adjustment-slider" title="Zoom dan crop">
                    <ZoomIn className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={selectedPhotoAdjustment.zoom}
                      aria-label="Zoom foto"
                      onChange={(event) => updatePhotoAdjustment(selectedPhotoIndex, { zoom: Number(event.target.value) })}
                    />
                    <output>{selectedPhotoAdjustment.zoom.toFixed(1)}×</output>
                  </label>
                  <label className="booth-photo-adjustment-slider" title="Putar">
                    <RotateCw className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedPhotoAdjustment.rotation}
                      aria-label="Putar foto"
                      onChange={(event) => updatePhotoAdjustment(selectedPhotoIndex, { rotation: Number(event.target.value) })}
                    />
                    <output>{selectedPhotoAdjustment.rotation}°</output>
                  </label>
                  <button
                    type="button"
                    className="booth-photo-adjustment-action"
                    aria-label="Balik horizontal"
                    aria-pressed={selectedPhotoAdjustment.flipX}
                    title="Balik horizontal"
                    onClick={() => updatePhotoAdjustment(selectedPhotoIndex, { flipX: !selectedPhotoAdjustment.flipX })}
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="booth-photo-adjustment-action"
                    aria-label="Balik vertikal"
                    aria-pressed={selectedPhotoAdjustment.flipY}
                    title="Balik vertikal"
                    onClick={() => updatePhotoAdjustment(selectedPhotoIndex, { flipY: !selectedPhotoAdjustment.flipY })}
                  >
                    <FlipVertical className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="booth-photo-adjustment-action"
                    aria-label="Atur ulang foto"
                    title="Atur ulang crop"
                    onClick={() => updatePhotoAdjustment(selectedPhotoIndex, DEFAULT_PHOTO_ADJUSTMENT)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="booth-photo-adjustment-action"
                    aria-label="Tutup pengaturan foto"
                    title="Tutup pengaturan foto"
                    onClick={() => clearPhotoSelection()}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="booth-canvas-zoom-controls" role="group" aria-label="Zoom kanvas">
                <button
                  type="button"
                  aria-label="Perkecil kanvas"
                  title="Perkecil kanvas"
                  disabled={canvasZoom <= 0.5}
                  onClick={() => applyCanvasZoom(canvasZoomRef.current - 0.1)}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Pusatkan kanvas dan atur zoom ke 100 persen"
                  title="Pusatkan kanvas · zoom 100%"
                  className="booth-canvas-zoom-value"
                  onClick={resetCanvasView}
                >
                  {Math.round(canvasZoom * 100)}%
                </button>
                <button
                  type="button"
                  aria-label="Perbesar kanvas"
                  title="Perbesar kanvas"
                  disabled={canvasZoom >= 3}
                  onClick={() => applyCanvasZoom(canvasZoomRef.current + 0.1)}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <span className="sr-only" role="status" aria-live="polite">
                  Zoom kanvas {Math.round(canvasZoom * 100)} persen
                </span>
              </div>
            </div>
            </div>
            {renderError && (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">
                {renderError}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="booth-muted truncate text-xs">{template.name}</span>
              <span className="booth-muted shrink-0 text-xs">
                Filter foto: {activeFilter.label}
              </span>
            </div>
          </section>

          <section className="booth-panel flex min-h-[480px] flex-col gap-4 overflow-hidden p-4 sm:p-5 lg:overflow-y-auto">
            <KeychainTemplateRail
              selected={template}
              disabled={isCapturing}
              onSelect={chooseTemplate}
            />

            <section className="booth-control-section">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-bold text-[var(--booth-ink)]">Tambahkan foto</h2>
                  <p className="booth-muted text-xs">Tersisa {emptySlotIndices.length} slot kosong.</p>
                </div>
                <div className="booth-mode-switch" role="group" aria-label="Mode foto">
                  <button
                    type="button"
                    disabled={isCapturing}
                    aria-pressed={inputMode === "upload"}
                    onClick={() => setInputMode("upload")}
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                  <button
                    type="button"
                    disabled={isCapturing}
                    aria-pressed={inputMode === "camera"}
                    onClick={() => setInputMode("camera")}
                  >
                    <Camera className="h-4 w-4" />
                    Kamera
                  </button>
                </div>
              </div>

              <input
                ref={singleInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void onPickPhoto(
                    slotRef.current,
                    event.target.files?.[0],
                    photoInputSideRef.current,
                  );
                  event.currentTarget.value = "";
                }}
              />
              <input
                ref={multipleInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void onPickMultiplePhotos(
                    event.target.files,
                    batchInputSideRef.current,
                    batchInputSlotCountRef.current,
                  );
                  event.currentTarget.value = "";
                }}
              />
              {inputMode === "upload" ? (
                <>
                  <div className={`grid gap-2 ${activeSlotCount === 1 ? "grid-cols-1" : activeSlotCount === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {currentSlots.map((slot, index) => {
                      const photo = sidePhotos[index];
                      return (
                        <div key={slot.id} className="relative">
                          <button
                            type="button"
                            onClick={() => openPhotoPicker(index)}
                            aria-label={photo ? `Pilih foto ${index + 1} untuk diedit` : `Unggah foto ${index + 1}`}
                            className="booth-photo-slot"
                          >
                            {photo ? (
                              <img src={photo} alt={`Foto ${index + 1}`} />
                            ) : (
                              <>
                                <ImagePlus className="mb-1 h-5 w-5" />
                                <span>Foto {index + 1}</span>
                              </>
                            )}
                          </button>
                          {photo && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDocument(activeSide, (document) => ({
                                    ...document,
                                    selectedPhotoIndex: index,
                                    selectedObjectId: null,
                                  }), false)
                                }
                                aria-label={`Atur foto ${index + 1}`}
                                aria-pressed={selectedPhotoIndex === index}
                                className="booth-edit-photo"
                              >
                                <SlidersHorizontal className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => clearPhoto(index)}
                                aria-label={`Hapus foto ${index + 1}`}
                                className="booth-remove-photo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      batchInputSideRef.current = activeSide;
                      batchInputSlotCountRef.current = activeSlotCount;
                      multipleInputRef.current?.click();
                    }}
                    className="booth-batch-upload mt-2"
                    disabled={emptySlotIndices.length === 0}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Unggah beberapa foto
                  </button>
                </>
              ) : (
                <div className="booth-camera-panel">
                  {cameraStream ? (
                    <>
                      <div className="relative overflow-hidden rounded-xl">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          aria-label="Pratinjau kamera, dicerminkan"
                          className="aspect-video w-full -scale-x-100 object-cover"
                        />
                        {countdown !== null && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white" aria-live="assertive" role="status">
                            <span className="text-6xl font-black">{countdown}</span>
                            <span className="mt-2 text-sm font-bold">Foto {captureSlot}/{captureTotal}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void captureSequence()}
                          disabled={isCapturing || emptySlotIndices.length === 0}
                          className="booth-primary-action flex-1 disabled:opacity-50"
                        >
                          <Camera className="h-4 w-4" />
                          {isCapturing
                            ? "Mengambil foto…"
                            : emptySlotIndices.length
                              ? `Ambil ${emptySlotIndices.length} foto`
                              : "Slot sudah penuh"}
                        </button>
                        {isCapturing ? (
                          <button
                            type="button"
                            onClick={() => {
                              cancelledCaptureRef.current = true;
                              setCountdown(null);
                            }}
                            className="booth-secondary-action"
                          >
                            <X className="h-4 w-4" />
                            Batal
                          </button>
                        ) : (
                          <button type="button" onClick={stopCamera} className="booth-secondary-action">
                            Tutup
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-32 flex-col items-center justify-center px-4 py-5 text-center">
                      <Video className="mb-2 h-7 w-7 text-[var(--booth-accent)]" />
                      <p className="text-sm font-bold text-[var(--booth-ink)]">Kamera siap digunakan</p>
                      <p className="booth-muted mt-1 text-xs">Pratinjau dicerminkan; foto tersimpan normal.</p>
                      <button type="button" onClick={() => void startCamera()} className="booth-primary-action mt-3">
                        <Camera className="h-4 w-4" />
                        Aktifkan kamera
                      </button>
                    </div>
                  )}
                  {cameraStream && (
                    <div className={`mt-2 grid gap-2 ${activeSlotCount === 1 ? "grid-cols-1" : activeSlotCount === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {currentSlots.map((slot, index) => (
                        <div key={slot.id} className="booth-camera-thumbnail">
                          {sidePhotos[index] ? (
                            <img src={sidePhotos[index] ?? undefined} alt={`Foto ${index + 1}`} />
                          ) : `Foto ${index + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            <KeychainColorSelector
              order={order}
              settings={settings}
              isRendering={isRendering}
              renderError={renderError}
              isCheckoutBusy={isCheckoutBusy}
              isPreparingCheckout={isPreparingCheckout}
              allKeychainOutOfStock={allKeychainOutOfStock}
              selectedColorLabel={selectedColor.label}
              onSelectColor={(id) => setOrder((current) => ({ ...current, frameModel: id }))}
              onDownload={(format) => void downloadBothSides(format)}
              onCheckout={() => {
                if (allKeychainOutOfStock) {
                  notify("Semua varian keychain sedang habis.", true);
                  return;
                }
                void openCheckout();
              }}
            />
          </section>
        </div>
      </main>

      <KeychainFilterDialog
        dialogRef={filterDialogRef}
        filter={filter}
        onFilterChange={setFilter}
        onClose={() => setFilterSettingsOpen(false)}
      />

      <CheckoutModal
        open={checkoutOpen}
        title="Preview pesanan"
        preview={checkoutPreviews && (
          <CheckoutProductPreview
            color={order.frameModel}
            frontDesign={checkoutPreviews.front}
            backDesign={checkoutPreviews.back}
            compact
          />
        )}
        summary={
          <>
            <p>Template photobooth: {template.name}</p>
            <p>
              Warna set aksesori: {selectedColor.label}
              {allKeychainOutOfStock
                ? " · stok habis"
                : ` · sisa ${keychainStock[order.frameModel]}`}
            </p>
            <p>Sisi depan · {frontPhotoCount}/{template.photoSlots.length} foto</p>
            <p>Sisi belakang · {backPhotoCount}/{template.backPhotoSlots.length} foto</p>
          </>
        }
        showCustomerFields={false}
        submitLabel="Pesan & lanjut WhatsApp"
        compactPreviewOnly
        buildMessage={(_customerName, _note) => {
          const code = checkoutCodeRef.current;
          return [
            "⋆ 。⋆୨୧˚ *KONFIRMASI PEMESANAN* ˚୨୧⋆。 ⋆",
            "",
            "Halo MakeitYours! ♡",
            "",
            "Mau konfirmasi pesanan dengan kode desain berikut:",
            "",
            `*Kode Desain:* ${code || "(sedang diproses)"}`,
            "",
            "Mohon info untuk langkah selanjutnya yaa. Terima kasih! ♡",
          ].join("\n");
        }}
        onBeforeSend={onBeforeCheckoutSend}
        onClose={closeCheckout}
      />
    </div>
  );
}

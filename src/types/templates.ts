export type PhotoFilter = "none" | "grayscale" | "vintage" | "soft-pink";
export type PhotoBoothSide = "front" | "back";

export interface PhotoSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextSlot {
  id: string;
  label: string;
  defaultText: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: CanvasTextAlign;
  maxWidth: number;
}

export interface PhotoBoothTemplate {
  id: string;
  name: string;
  frameUrl: string;
  backFrameUrl: string;
  canvasSize: { width: number; height: number };
  backCanvasSize: { width: number; height: number };
  photoSlots: PhotoSlot[];
  backPhotoSlots: PhotoSlot[];
  textSlots: TextSlot[];
  defaultFilter: PhotoFilter;
}

const canvasSize = { width: 690, height: 1620 };
const backCanvasSize = { width: 1620, height: 690 };

function photoSlots(
  bounds: Array<{ x: number; y: number; width: number; height: number }>,
): PhotoSlot[] {
  return bounds.map((slot, index) => ({ id: `photo-${index + 1}`, ...slot }));
}

export const PHOTOBOOTH_TEMPLATES: PhotoBoothTemplate[] = [
  {
    id: "8",
    name: "Memory",
    frameUrl: "/Template/8.png",
    backFrameUrl: "/Template/Back-8.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 129, y: 178, width: 432, height: 521 },
      { x: 129, y: 713, width: 432, height: 521 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1120, y: 149, width: 354, height: 332 }]),
    textSlots: [],
    defaultFilter: "vintage",
  },
  {
    id: "2",
    name: "Have a Good Day",
    frameUrl: "/Template/2.png",
    backFrameUrl: "/Template/Back-2.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 98, y: 122, width: 494, height: 388 },
      { x: 98, y: 545, width: 494, height: 388 },
      { x: 98, y: 969, width: 494, height: 388 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1103, y: 135, width: 337, height: 338 }]),
    textSlots: [],
    defaultFilter: "none",
  },
  {
    id: "4",
    name: "Let's Go",
    frameUrl: "/Template/4.png",
    backFrameUrl: "/Template/Back-4.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 130, y: 165, width: 430, height: 336 },
      { x: 130, y: 544, width: 430, height: 335 },
      { x: 130, y: 922, width: 430, height: 335 },
    ]),
    backPhotoSlots: photoSlots([{ x: 998, y: 175, width: 506, height: 340 }]),
    textSlots: [],
    defaultFilter: "none",
  },
  {
    id: "6",
    name: "Hello Summer",
    frameUrl: "/Template/6.png",
    backFrameUrl: "/Template/Back-6.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 146, y: 149, width: 395, height: 514 },
      { x: 146, y: 763, width: 395, height: 514 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1165, y: 146, width: 241, height: 313 }]),
    textSlots: [],
    defaultFilter: "soft-pink",
  },
  {
    id: "10",
    name: "Sweet Dreams",
    frameUrl: "/Template/10.png",
    backFrameUrl: "/Template/Back-10.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 159, y: 214, width: 372, height: 345 },
      { x: 159, y: 560, width: 372, height: 345 },
      { x: 159, y: 906, width: 372, height: 346 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1142, y: 153, width: 283, height: 343 }]),
    textSlots: [],
    defaultFilter: "grayscale",
  },
  {
    id: "12",
    name: "Beautiful Memories",
    frameUrl: "/Template/12.png",
    backFrameUrl: "/Template/Back-12.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 125, y: 109, width: 451, height: 416 },
      { x: 125, y: 531, width: 451, height: 415 },
      { x: 125, y: 953, width: 451, height: 415 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1108, y: 155, width: 332, height: 305 }]),
    textSlots: [],
    defaultFilter: "soft-pink",
  },
  {
    id: "14",
    name: "Monochrome",
    frameUrl: "/Template/14.png",
    backFrameUrl: "/Template/Back-14.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 125, y: 131, width: 451, height: 630 },
      { x: 125, y: 788, width: 451, height: 629 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1127, y: 117, width: 369, height: 364 }]),
    textSlots: [],
    defaultFilter: "none",
  },
  {
    id: "16",
    name: "Hearts2Hearts",
    frameUrl: "/Template/16.png",
    backFrameUrl: "/Template/Back-16.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 88, y: 107, width: 514, height: 431 },
      { x: 88, y: 550, width: 514, height: 432 },
      { x: 88, y: 994, width: 514, height: 431 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1113, y: 135, width: 338, height: 343 }]),
    textSlots: [],
    defaultFilter: "soft-pink",
  },
  {
    id: "18",
    name: "Happy Cloud",
    frameUrl: "/Template/18.png",
    backFrameUrl: "/Template/Back-18.png",
    canvasSize,
    backCanvasSize,
    photoSlots: photoSlots([
      { x: 121, y: 134, width: 462, height: 374 },
      { x: 121, y: 562, width: 462, height: 375 },
      { x: 121, y: 991, width: 462, height: 376 },
    ]),
    backPhotoSlots: photoSlots([{ x: 1110, y: 133, width: 362, height: 345 }]),
    textSlots: [],
    defaultFilter: "soft-pink",
  },
];

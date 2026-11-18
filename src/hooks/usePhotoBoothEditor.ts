import { useCallback, useRef, useState } from "react";
import {
  createPhotoBoothDocument,
  type PhotoBoothDocument,
  type PhotoBoothDocuments,
  type SideHistory,
} from "../types/photoBoothEditor";
import type { PhotoBoothSide } from "../types/templates";

const HISTORY_LIMIT = 30;

function createSideHistory(): Record<PhotoBoothSide, SideHistory> {
  return {
    front: { past: [], future: [] },
    back: { past: [], future: [] },
  };
}

function createDocuments(): PhotoBoothDocuments {
  return {
    front: createPhotoBoothDocument(),
    back: createPhotoBoothDocument(),
  };
}

export function usePhotoBoothEditor() {
  const [documents, setDocuments] = useState(createDocuments);
  const [history, setHistory] = useState(createSideHistory);
  const documentsRef = useRef(documents);
  const historyRef = useRef(history);

  const replaceSideDocument = useCallback(
    (side: PhotoBoothSide, next: PhotoBoothDocument) => {
      documentsRef.current = { ...documentsRef.current, [side]: next };
      setDocuments(documentsRef.current);
    },
    [],
  );

  const updateDocument = useCallback(
    (
      side: PhotoBoothSide,
      update: (document: PhotoBoothDocument) => PhotoBoothDocument,
      recordHistory = true,
    ) => {
      const current = documentsRef.current[side];
      const next = update(current);
      if (recordHistory) {
        const sideHistory = historyRef.current[side];
        const nextHistory = {
          ...sideHistory,
          past: [...sideHistory.past.slice(-(HISTORY_LIMIT - 1)), current],
          future: [],
        };
        historyRef.current = { ...historyRef.current, [side]: nextHistory };
        setHistory(historyRef.current);
      }
      replaceSideDocument(side, next);
    },
    [replaceSideDocument],
  );

  const recordDocumentSnapshot = useCallback((side: PhotoBoothSide, snapshot: PhotoBoothDocument) => {
    const sideHistory = historyRef.current[side];
    const nextHistory = {
      ...sideHistory,
      past: [...sideHistory.past.slice(-(HISTORY_LIMIT - 1)), snapshot],
      future: [],
    };
    historyRef.current = { ...historyRef.current, [side]: nextHistory };
    setHistory(historyRef.current);
  }, []);

  const undo = useCallback(
    (side: PhotoBoothSide) => {
      const sideHistory = historyRef.current[side];
      if (!sideHistory.past.length) return;
      const previous = sideHistory.past[sideHistory.past.length - 1];
      historyRef.current = {
        ...historyRef.current,
        [side]: {
          past: sideHistory.past.slice(0, -1),
          future: [...sideHistory.future, documentsRef.current[side]],
        },
      };
      setHistory(historyRef.current);
      replaceSideDocument(side, previous);
    },
    [replaceSideDocument],
  );

  const redo = useCallback(
    (side: PhotoBoothSide) => {
      const sideHistory = historyRef.current[side];
      if (!sideHistory.future.length) return;
      const next = sideHistory.future[sideHistory.future.length - 1];
      historyRef.current = {
        ...historyRef.current,
        [side]: {
          past: [...sideHistory.past, documentsRef.current[side]],
          future: sideHistory.future.slice(0, -1),
        },
      };
      setHistory(historyRef.current);
      replaceSideDocument(side, next);
    },
    [replaceSideDocument],
  );

  return {
    documents,
    history,
    updateDocument,
    recordDocumentSnapshot,
    undo,
    redo,
  };
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Id } from '../types';

export interface CanvasFocus {
  canvasId: Id;
  nodeId: Id | null;
}

export interface FocusRequest {
  canvasId: Id;
  nodeId: Id;
  nonce: number;
}

interface SelectionValue {
  canvasFocus: CanvasFocus | null;
  setCanvasFocus: (focus: CanvasFocus | null) => void;
  focusRequest: FocusRequest | null;
  requestFocus: (canvasId: Id, nodeId: Id) => void;
}

const SelectionContext = createContext<SelectionValue>({
  canvasFocus: null,
  setCanvasFocus: () => undefined,
  focusRequest: null,
  requestFocus: () => undefined,
});

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [canvasFocus, setFocus] = useState<CanvasFocus | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  const setCanvasFocus = useCallback((focus: CanvasFocus | null) => setFocus(focus), []);
  const requestFocus = useCallback((canvasId: Id, nodeId: Id) => {
    setFocusRequest({ canvasId, nodeId, nonce: Date.now() });
  }, []);

  const value = useMemo(
    () => ({ canvasFocus, setCanvasFocus, focusRequest, requestFocus }),
    [canvasFocus, setCanvasFocus, focusRequest, requestFocus],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionValue {
  return useContext(SelectionContext);
}

import { useState, useCallback, useEffect } from 'react';

export interface UndoEntry {
  label: string;
  restore: () => void;
}

const MAX_UNDO = 20;

let globalStack: UndoEntry[] = [];
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach(l => l());
}

export function pushUndo(entry: UndoEntry) {
  globalStack = [entry, ...globalStack].slice(0, MAX_UNDO);
  notify();
}

export function useUndoStack() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const handler = () => rerender(n => n + 1);
    listeners.push(handler);
    return () => { listeners = listeners.filter(l => l !== handler); };
  }, []);

  const canUndo = globalStack.length > 0;
  const topLabel = globalStack[0]?.label ?? '';

  const undo = useCallback(() => {
    if (globalStack.length === 0) return null;
    const [top, ...rest] = globalStack;
    globalStack = rest;
    notify();
    top.restore();
    return top.label;
  }, []);

  return { canUndo, topLabel, undo };
}

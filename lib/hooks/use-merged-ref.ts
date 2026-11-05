import * as React from "react";

function setRef<T>(
  target: React.Ref<T> | React.RefObject<T | null> | undefined,
  value: T | null,
): (() => void) | void {
  if (!target) return;
  if (typeof target === "function") {
    const cleanup = target(value);
    if (typeof cleanup === "function") {
      return cleanup;
    }
    return () => target(null);
  }
  try {
    (target as React.MutableRefObject<T | null>).current = value;
    return () => {
      (target as React.MutableRefObject<T | null>).current = null;
    };
  } catch {
    // ignore read-only ref object assignments
  }
}

/**
 * One callback ref that points both `local` and the caller's `ref` (callback
 * or object) at the same node. React 19: a callback ref may return its own
 * cleanup, which React then calls instead of `ref(null)`; it's passed through,
 * so a caller's cleanup runs on unmount and their ref is never called with null.
 */
export function useMergedRef<T>(local: React.RefObject<T | null>, ref: React.Ref<T> | undefined) {
  return React.useCallback(
    (node: T | null) => {
      const cleanupLocal = setRef(local, node);
      const cleanupRef = setRef(ref, node);
      return () => {
        cleanupLocal?.();
        cleanupRef?.();
      };
    },
    [local, ref],
  );
}

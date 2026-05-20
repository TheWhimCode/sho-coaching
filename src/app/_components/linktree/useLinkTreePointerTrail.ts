"use client";

import { useCallback, useRef } from "react";
import type { ParticleTrailControl } from "./ButtonParticleTrail";

export function useLinkTreePointerTrail() {
  const trailRef = useRef<ParticleTrailControl | null>(null);

  const updatePointer = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    trailRef.current?.movePointer(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  }, []);

  const pointerHandlers = {
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      trailRef.current?.setActive(true);
      updatePointer(e);
    },
    onPointerMove: updatePointer,
    onPointerLeave: () => trailRef.current?.clear(),
    onPointerCancel: () => trailRef.current?.clear(),
  };

  return { trailRef, pointerHandlers };
}

"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import {
  registerParticleTrail,
  unregisterParticleTrail,
  type ParticleTrailControl,
} from "./particleTrailEngine";

export type { ParticleTrailControl };

type Props = {
  color: string;
};

const ButtonParticleTrail = forwardRef<ParticleTrailControl | null, Props>(
  function ButtonParticleTrail({ color }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const controlRef = useRef<ParticleTrailControl | null>(null);
    const trailIdRef = useRef<number | null>(null);
    const colorRef = useRef(color);
    colorRef.current = color;

    useImperativeHandle(
      ref,
      () => ({
        setColor: (c: string) => controlRef.current?.setColor(c),
        setActive: (active: boolean) => controlRef.current?.setActive(active),
        movePointer: (x: number, y: number) =>
          controlRef.current?.movePointer(x, y),
        clear: () => controlRef.current?.clear(),
        resize: () => controlRef.current?.resize(),
      }),
      []
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const { id, control } = registerParticleTrail(canvas, colorRef.current);
      trailIdRef.current = id;
      controlRef.current = control;

      const resize = () => control.resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);

      return () => {
        ro.disconnect();
        if (trailIdRef.current !== null) {
          unregisterParticleTrail(trailIdRef.current);
          trailIdRef.current = null;
        }
        controlRef.current = null;
      };
    }, []);

    useEffect(() => {
      controlRef.current?.setColor(color);
    }, [color]);

    return (
      <div
        ref={wrapRef}
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl hidden md:block"
        aria-hidden
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    );
  }
);

export default ButtonParticleTrail;

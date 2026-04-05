"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";

export type GamepadButton =
  | "UP" | "DOWN" | "LEFT" | "RIGHT"
  | "A" | "B" | "X" | "Y"
  | "L" | "R" | "L2" | "R2"
  | "START" | "SELECT";

interface VirtualGamepadProps {
  onButtonChange: (button: GamepadButton, pressed: boolean) => void;
  playerIndex?: 1 | 2 | 3 | 4;
  /** Variant: 'overlay' (transparent, over emulator) or 'standalone' (opaque, full controller page) */
  variant?: "overlay" | "standalone";
}

export function VirtualGamepad({
  onButtonChange,
  playerIndex = 1,
  variant = "overlay",
}: VirtualGamepadProps) {
  // Track active pointers to support multi-touch (4+ simultaneous touches)
  const activePointers = useRef<Map<number, GamepadButton>>(new Map());

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, btn: GamepadButton) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointers.current.set(e.pointerId, btn);
      onButtonChange(btn, true);
    },
    [onButtonChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent, btn: GamepadButton) => {
      e.preventDefault();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      activePointers.current.delete(e.pointerId);
      onButtonChange(btn, false);
    },
    [onButtonChange]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent, btn: GamepadButton) => {
      activePointers.current.delete(e.pointerId);
      onButtonChange(btn, false);
    },
    [onButtonChange]
  );

  const playerColors: Record<number, string> = {
    1: "rose",
    2: "blue",
    3: "green",
    4: "yellow",
  };
  const color = playerColors[playerIndex] || "rose";

  const baseAlpha = variant === "standalone" ? "bg-white/15" : "bg-white/10";

  const Button = ({
    btn,
    label,
    className = "",
    btnColor = "",
  }: {
    btn: GamepadButton;
    label: string;
    className?: string;
    btnColor?: string;
  }) => (
    <motion.div
      whileTap={{ scale: 0.82 }}
      onPointerDown={(e) => handlePointerDown(e, btn)}
      onPointerUp={(e) => handlePointerUp(e, btn)}
      onPointerCancel={(e) => handlePointerCancel(e, btn)}
      style={{ touchAction: "none", userSelect: "none" }}
      className={`
        flex items-center justify-center rounded-full font-black select-none
        text-white/80 transition-colors duration-75
        backdrop-blur-md shadow-lg border border-white/10
        active:border-white/30
        ${btnColor || baseAlpha}
        ${className}
      `}
    >
      {label}
    </motion.div>
  );

  return (
    <div
      className={`absolute inset-0 z-50 pointer-events-none select-none ${
        variant === "standalone" ? "bg-black/40" : ""
      }`}
      style={{ touchAction: "none" }}
    >
      {/* Player badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`}>
          P{playerIndex}
        </div>
      </div>

      {/* LEFT SIDE — D-Pad + L Triggers */}
      <div className="absolute left-6 bottom-8 sm:left-10 sm:bottom-12 pointer-events-auto flex flex-col items-center gap-3">
        {/* L + L2 triggers */}
        <div className="flex gap-2 mb-1">
          <Button btn="L" label="L" className="w-16 h-9 rounded-xl text-sm" />
          <Button btn="L2" label="L2" className="w-16 h-9 rounded-xl text-sm" />
        </div>

        {/* D-Pad Cross */}
        <div
          className="relative grid grid-cols-3 grid-rows-3 gap-0.5"
          style={{ width: 120, height: 120 }}
        >
          <div />
          <Button btn="UP" label="▲" className="w-full h-full rounded-none rounded-t-lg" />
          <div />
          <Button btn="LEFT" label="◀" className="w-full h-full rounded-none rounded-l-lg" />
          <div className={`${baseAlpha} rounded-sm flex items-center justify-center`}>
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
          <Button btn="RIGHT" label="▶" className="w-full h-full rounded-none rounded-r-lg" />
          <div />
          <Button btn="DOWN" label="▼" className="w-full h-full rounded-none rounded-b-lg" />
          <div />
        </div>
      </div>

      {/* CENTER — Start / Select */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-3">
        <Button
          btn="SELECT"
          label="SELECT"
          className="w-20 h-7 rounded-full text-[10px] tracking-widest"
        />
        <Button
          btn="START"
          label="START"
          className="w-20 h-7 rounded-full text-[10px] tracking-widest"
        />
      </div>

      {/* RIGHT SIDE — ABXY + R Triggers */}
      <div className="absolute right-6 bottom-8 sm:right-10 sm:bottom-12 pointer-events-auto flex flex-col items-center gap-3">
        {/* R + R2 triggers */}
        <div className="flex gap-2 mb-1">
          <Button btn="R" label="R" className="w-16 h-9 rounded-xl text-sm" />
          <Button btn="R2" label="R2" className="w-16 h-9 rounded-xl text-sm" />
        </div>

        {/* Diamond ABXY */}
        <div className="relative" style={{ width: 120, height: 120 }}>
          {/* X — top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <Button
              btn="X"
              label="X"
              btnColor="bg-blue-500/30 hover:bg-blue-500/50"
              className="w-10 h-10 sm:w-12 sm:h-12 text-blue-300 font-black text-lg"
            />
          </div>
          {/* A — right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Button
              btn="A"
              label="A"
              btnColor="bg-rose-500/30 hover:bg-rose-500/50"
              className="w-10 h-10 sm:w-12 sm:h-12 text-rose-300 font-black text-lg"
            />
          </div>
          {/* B — bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <Button
              btn="B"
              label="B"
              btnColor="bg-yellow-500/30 hover:bg-yellow-500/50"
              className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-300 font-black text-lg"
            />
          </div>
          {/* Y — left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <Button
              btn="Y"
              label="Y"
              btnColor="bg-green-500/30 hover:bg-green-500/50"
              className="w-10 h-10 sm:w-12 sm:h-12 text-green-300 font-black text-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

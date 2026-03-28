"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";

export type GamepadButton = "UP" | "DOWN" | "LEFT" | "RIGHT" | "A" | "B" | "X" | "Y" | "L" | "R" | "START" | "SELECT";

interface VirtualGamepadProps {
  onButtonChange: (button: GamepadButton, pressed: boolean) => void;
}

export function VirtualGamepad({ onButtonChange }: VirtualGamepadProps) {
  
  const handlePointerDown = useCallback((e: React.PointerEvent, btn: GamepadButton) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onButtonChange(btn, true);
  }, [onButtonChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent, btn: GamepadButton) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    onButtonChange(btn, false);
  }, [onButtonChange]);

  const ActionButton = ({ btn, label, color = "bg-white/20" }: { btn: GamepadButton; label: string; color?: string }) => (
    <motion.div
      whileTap={{ scale: 0.85, backgroundColor: "rgba(255,255,255,0.4)" }}
      onPointerDown={(e) => handlePointerDown(e, btn)}
      onPointerUp={(e) => handlePointerUp(e, btn)}
      onPointerCancel={(e) => handlePointerUp(e, btn)}
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white/80 font-bold select-none touch-none ${color} backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10`}
    >
      {label}
    </motion.div>
  );

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex justify-between items-end pb-8 px-8 sm:pb-12 sm:px-16" style={{ touchAction: "none" }}>
      
      {/* LEFT SIDE: D-PAD and L Trigger */}
      <div className="flex flex-col justify-end pointer-events-auto gap-8">
        <motion.div
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => handlePointerDown(e, "L")}
          onPointerUp={(e) => handlePointerUp(e, "L")}
          onPointerCancel={(e) => handlePointerUp(e, "L")}
          className="w-24 h-10 bg-white/20 backdrop-blur-md rounded-t-full rounded-b-lg flex items-center justify-center border border-white/10 mb-4 select-none touch-none"
        >
          <span className="font-black text-white/50">L</span>
        </motion.div>

        {/* Cross D-Pad */}
        <div className="relative w-32 h-32 select-none touch-none grid grid-cols-3 grid-rows-3 gap-1">
          <div /> 
          <ActionButton btn="UP" label="▲" />
          <div />
          <ActionButton btn="LEFT" label="◀" />
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-full" />
          <ActionButton btn="RIGHT" label="▶" />
          <div />
         <ActionButton btn="DOWN" label="▼" />
          <div />
        </div>
      </div>

      {/* CENTER START/SELECT */}
      <div className="flex gap-4 mb-4 pointer-events-auto">
        <motion.div
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => handlePointerDown(e, "SELECT")}
          onPointerUp={(e) => handlePointerUp(e, "SELECT")}
          onPointerCancel={(e) => handlePointerUp(e, "SELECT")}
          className="w-16 h-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 select-none touch-none"
        >
          <span className="text-[10px] font-bold text-white/50 tracking-widest">SELECT</span>
        </motion.div>
        
        <motion.div
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => handlePointerDown(e, "START")}
          onPointerUp={(e) => handlePointerUp(e, "START")}
          onPointerCancel={(e) => handlePointerUp(e, "START")}
          className="w-16 h-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 select-none touch-none"
        >
          <span className="text-[10px] font-bold text-white/50 tracking-widest">START</span>
        </motion.div>
      </div>

      {/* RIGHT SIDE: ABXY and R Trigger */}
      <div className="flex flex-col justify-end items-end pointer-events-auto gap-8">
        <motion.div
          whileTap={{ scale: 0.9 }}
          onPointerDown={(e) => handlePointerDown(e, "R")}
          onPointerUp={(e) => handlePointerUp(e, "R")}
          onPointerCancel={(e) => handlePointerUp(e, "R")}
          className="w-24 h-10 bg-white/20 backdrop-blur-md rounded-t-full rounded-b-lg flex items-center justify-center border border-white/10 mb-4 select-none touch-none"
        >
          <span className="font-black text-white/50">R</span>
        </motion.div>

        {/* Diamond ABXY Map */}
        <div className="relative w-32 h-32 select-none touch-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4">
            <ActionButton btn="X" label="X" color="bg-blue-500/30" />
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 -mr-4">
            <ActionButton btn="A" label="A" color="bg-red-500/30" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2">   
            <ActionButton btn="B" label="B" color="bg-yellow-500/30" />
          </div>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-4">
            <ActionButton btn="Y" label="Y" color="bg-green-500/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Monitor, Gamepad2 } from "lucide-react";

export default function JoinPage({ params }: { params: { sessionCode: string } }) {
  const router = useRouter();

  const handleSelectRole = (role: "screen" | "controller") => {
    router.push(`/${role}/${params.sessionCode.toUpperCase()}`);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-blue-900/30 blur-[150px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center mb-12"
      >
        <div className="text-sm font-bold text-white/50 tracking-widest uppercase mb-2">
          Joining Session
        </div>
        <h1 className="text-6xl font-black mb-2 tracking-widest text-shadow-sm">
          {params.sessionCode.toUpperCase()}
        </h1>
        <p className="text-white/70 max-w-sm mx-auto">
          Choose how you want to interact with this {process.env.NAME} session on your current device.
        </p>
      </motion.div>

      <div className="flex gap-8 z-10 w-full max-w-4xl px-8 justify-center items-stretch">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelectRole("screen")}
          className="flex-1 max-w-sm bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center gap-6 transition-colors shadow-2xl group"
        >
          <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
            <Monitor className="w-12 h-12 text-blue-400 group-hover:text-blue-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Display (Screen)</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Use this device as the main TV. The emulator will run here. Recommended for desktops, tablets, and smart TVs.
            </p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelectRole("controller")}
          className="flex-1 max-w-sm bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col items-center justify-center gap-6 transition-colors shadow-2xl group"
        >
          <div className="w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/40 transition-colors">
            <Gamepad2 className="w-12 h-12 text-rose-400 group-hover:text-rose-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Virtual Controller</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Use this device purely for input. No video will be displayed. Recommended for smartphones.
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

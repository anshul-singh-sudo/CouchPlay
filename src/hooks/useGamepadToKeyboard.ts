"use client";

import { useCallback } from "react";
import { GamepadButton } from "@/components/gamepad/VirtualGamepad";

// Default Keyboard Mapping for EmulatorJS Player 1
const BUTTON_KEY_MAP: Record<GamepadButton, string> = {
  UP: "ArrowUp",
  DOWN: "ArrowDown",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  A: "x",
  B: "z",
  X: "s",
  Y: "a",
  L: "q",
  R: "w",
  L2: "1",
  R2: "2",
  START: "Enter",
  SELECT: "Shift",
};

export function useGamepadToKeyboard() {
  const dispatchKey = useCallback((button: GamepadButton, pressed: boolean) => {
    const key = BUTTON_KEY_MAP[button];
    if (!key) return;

    const eventName = pressed ? "keydown" : "keyup";
    const keyCode = key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0; // Simple fallback

    const event = new KeyboardEvent(eventName, {
      key,
      code: key, // "ArrowUp", "KeyX", etc
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    });

    // Dispatch to the active element or document body
    // EmulatorJS listens on the document for core events
    document.dispatchEvent(event);
  }, []);

  return { dispatchKey };
}

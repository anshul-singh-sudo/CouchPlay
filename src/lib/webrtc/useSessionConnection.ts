"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionRole = "host" | "client";
export type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

export function useSessionConnection(
  sessionCode: string,
  role: ConnectionRole,
  onData: (data: Record<string, unknown>) => void
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  // Single shared channel ref — fixes the channel duplication bug
  const channelRef = useRef<RealtimeChannel | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const supabase = createClient();

  const flushIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift()!;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore stale candidates
      }
    }
  }, []);

  const handleIceCandidate = useCallback((event: RTCPeerConnectionIceEvent) => {
    if (event.candidate && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "ice-candidate",
        payload: { candidate: event.candidate.toJSON(), from: role },
      });
    }
  }, [role]);

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dataChannel.current = dc;
    dc.binaryType = "arraybuffer";
    dc.onmessage = (e) => {
      try {
        onData(JSON.parse(e.data));
      } catch {
        // Malformed message — ignore
      }
    };
    dc.onopen = () => setConnectionState("connected");
    dc.onclose = () => setConnectionState("disconnected");
    dc.onerror = () => setConnectionState("failed");
  }, [onData]);

  const createPeerConnection = useCallback(() => {
    // Close any existing connection cleanly
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = handleIceCandidate;
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") setConnectionState("connected");
      else if (state === "failed" || state === "disconnected") setConnectionState("failed");
    };

    if (role === "host") {
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };
    } else {
      // Client creates the data channel — unreliable, unordered for minimum latency
      const dc = pc.createDataChannel("gamepad-input", {
        ordered: false,
        maxRetransmits: 0,
      });
      setupDataChannel(dc);
    }

    peerConnection.current = pc;
    return pc;
  }, [role, handleIceCandidate, setupDataChannel]);

  useEffect(() => {
    if (!sessionCode) return;

    setConnectionState("connecting");
    iceCandidateQueue.current = [];

    // Single channel instance shared across all signaling and fallback events
    const channel = supabase.channel(`session-sig-${sessionCode}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      // HOST receives the offer from client
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (role !== "host") return;
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        await flushIceCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({
          type: "broadcast",
          event: "answer",
          payload: { answer },
        });
      })
      // CLIENT receives the answer from host
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (role !== "client" || !peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(payload.answer)
        );
        await flushIceCandidates(peerConnection.current);
      })
      // Both sides exchange ICE candidates
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (payload.from === role) return;
        const pc = peerConnection.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch {
            // Ignore duplicate/stale
          }
        } else {
          // Queue until remote description is set
          iceCandidateQueue.current.push(payload.candidate);
        }
      })
      // WS relay fallback — host receives inputs when P2P is not connected
      .on("broadcast", { event: "fallback-input" }, ({ payload }) => {
        if (role === "host") {
          onData(payload);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && role === "client") {
          // Client initiates the offer
          const pc = createPeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { offer },
          });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      dataChannel.current = null;
      iceCandidateQueue.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode, role]);

  const sendData = useCallback((data: Record<string, unknown>) => {
    // Prefer P2P DataChannel for lowest latency
    if (dataChannel.current?.readyState === "open") {
      dataChannel.current.send(JSON.stringify(data));
      return true;
    }
    // Fallback to WebSocket relay via Supabase Broadcast
    channelRef.current?.send({
      type: "broadcast",
      event: "fallback-input",
      payload: data,
    });
    return false;
  }, []);

  return { connectionState, sendData };
}

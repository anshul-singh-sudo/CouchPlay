"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type ConnectionRole = "host" | "client";
export type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

export function useSessionConnection(sessionCode: string, role: ConnectionRole, onData: (data: any) => void) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const supabase = createClient();

  const handleIceCandidate = useCallback((event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      supabase.channel(`session-${sessionCode}`).send({
        type: "broadcast",
        event: "ice-candidate",
        payload: { candidate: event.candidate, from: role },
      });
    }
  }, [sessionCode, role, supabase]);

  const initWebRTC = useCallback(async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = handleIceCandidate;

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnectionState("connected");
      else if (pc.connectionState === "failed") setConnectionState("failed");
    };

    if (role === "host") {
      pc.ondatachannel = (event) => {
        dataChannel.current = event.channel;
        event.channel.onmessage = (e) => onData(JSON.parse(e.data));
        event.channel.onopen = () => setConnectionState("connected");
      };
    } else {
      const dc = pc.createDataChannel("gamepad-input", { ordered: false, maxRetransmits: 0 });
      dataChannel.current = dc;
      dc.onmessage = (e) => onData(JSON.parse(e.data));
      dc.onopen = () => setConnectionState("connected");
    }

    peerConnection.current = pc;
    return pc;
  }, [role, handleIceCandidate, onData]);

  useEffect(() => {
    if (!sessionCode) return;

    setConnectionState("connecting");
    const channel = supabase.channel(`session-${sessionCode}`);

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (role !== "host") return;
        const pc = await initWebRTC();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { answer } });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (role !== "client" || !peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (payload.from === role || !peerConnection.current) return;
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && role === "client") {
          const pc = await initWebRTC();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: "broadcast", event: "offer", payload: { offer } });
        }
      });

    return () => {
      channel.unsubscribe();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [sessionCode, role, supabase, initWebRTC]);

  const sendData = useCallback((data: any) => {
    if (dataChannel.current?.readyState === "open") {
      dataChannel.current.send(JSON.stringify(data));
      return true;
    }
    // Fallback WS via Supabase if direct P2P fails
    if (connectionState !== "connected") {
        supabase.channel(`session-${sessionCode}`).send({
            type: "broadcast",
            event: "fallback-input",
            payload: data,
        });
    }
    return false;
  }, [connectionState, sessionCode, supabase]);

  // Hook up WS fallback listener for host
  useEffect(() => {
    if (role !== "host") return;
    const channel = supabase.channel(`session-${sessionCode}`);
    channel.on("broadcast", { event: "fallback-input" }, ({ payload }) => {
        onData(payload);
    }).subscribe();

    return () => { channel.unsubscribe(); }
  }, [role, sessionCode, supabase, onData]);


  return { connectionState, sendData };
}

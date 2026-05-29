import { useEffect, useRef, useState, useCallback } from "react";
import Peer, { Instance as PeerInstance } from "simple-peer";
import { getSocket } from "@/lib/socket";

export type ScreenShareMode = "gaming" | "movie" | "default";

type ScreenSharePreset = {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
  contentHint: "motion" | "detail" | "";
  maxBitrateKbps: number;
  label: string;
  description: string;
};

const SCREEN_SHARE_PRESETS: Record<ScreenShareMode, ScreenSharePreset> = {
  gaming: {
    video: true,
    audio: false,
    contentHint: "motion",
    maxBitrateKbps: 8000,
    label: "Gaming",
    description: "60fps, optimised for fast motion",
  },
  movie: {
    video: true,
    audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 48000 },
    contentHint: "detail",
    maxBitrateKbps: 6000,
    label: "Movie / Content",
    description: "High quality, captures system audio",
  },
  default: {
    video: true,
    audio: false,
    contentHint: "",
    maxBitrateKbps: 2500,
    label: "Standard",
    description: "720p 30fps, balanced quality",
  },
};

async function applyBitrate(peer: PeerInstance, maxKbps: number) {
  try {
    const pc = (peer as unknown as { _pc: RTCPeerConnection })._pc;
    if (!pc) return;
    const senders = pc.getSenders();
    for (const sender of senders) {
      if (sender.track?.kind !== "video") continue;
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }
      params.encodings[0].maxBitrate = maxKbps * 1000;
      params.encodings[0].networkPriority = "high";
      await sender.setParameters(params);
    }
  } catch {
    // Not all browsers support setParameters — fail silently
  }
}

export function useWebRTC(roomId: string, userId?: number) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareMode, setScreenShareMode] = useState<ScreenShareMode>("default");

  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<PeerInstance | null>(null);
  const socket = getSocket();

  const setStreamSafe = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const createPeer = useCallback((stream: MediaStream, initiator: boolean) => {
    const peer = new Peer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (data) => {
      if (data.type === "offer") {
        socket.emit("offer", { roomId, offer: data });
      } else if (data.type === "answer") {
        socket.emit("answer", { roomId, answer: data });
      } else {
        socket.emit("ice-candidate", { roomId, candidate: data });
      }
    });

    peer.on("stream", (remote) => {
      setRemoteStream(remote);
    });

    peer.on("connect", () => {
      setIsConnected(true);
    });

    peer.on("close", () => {
      setIsConnected(false);
      setRemoteStream(null);
    });

    return peer;
  }, [roomId, socket]);

  useEffect(() => {
    if (!userId || !roomId) return;

    socket.emit("join-room", { roomId, userId });

    socket.on("user-joined", () => {
      if (localStreamRef.current) {
        peerRef.current = createPeer(localStreamRef.current, true);
      }
    });

    socket.on("offer", (data) => {
      if (!peerRef.current && localStreamRef.current) {
        peerRef.current = createPeer(localStreamRef.current, false);
      }
      peerRef.current?.signal(data.offer);
    });

    socket.on("answer", (data) => {
      peerRef.current?.signal(data.answer);
    });

    socket.on("ice-candidate", (data) => {
      peerRef.current?.signal(data.candidate);
    });

    socket.on("user-left", () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setIsConnected(false);
      setRemoteStream(null);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      socket.emit("leave-room", { roomId });
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
    };
  }, [roomId, userId, createPeer, socket]);

  const startLocalStream = useCallback(async (quality: { width?: number; height?: number; frameRate?: number } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: Object.keys(quality).length > 0 ? { ...quality } : true,
        audio: true,
      });

      stream.getVideoTracks().forEach((t) => { t.enabled = false; });
      stream.getAudioTracks().forEach((t) => { t.enabled = false; });
      setIsCameraEnabled(false);
      setIsMicEnabled(false);

      cameraStreamRef.current = stream;
      setStreamSafe(stream);

      if (!peerRef.current) {
        peerRef.current = createPeer(stream, true);
      }
    } catch {
      // Camera might be unavailable on some devices
    }
  }, [createPeer, setStreamSafe]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsCameraEnabled(track.enabled);
      }
    }
  }, []);

  const toggleMicrophone = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicEnabled(track.enabled);
      }
    }
  }, []);

  const startScreenShare = useCallback(async (mode: ScreenShareMode = "default") => {
    const preset = SCREEN_SHARE_PRESETS[mode];
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: preset.video,
        audio: preset.audio,
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack && preset.contentHint !== "") {
        videoTrack.contentHint = preset.contentHint;
      }

      if (peerRef.current && localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          peerRef.current.replaceTrack(oldVideoTrack, videoTrack, localStreamRef.current);
        }
        await applyBitrate(peerRef.current, preset.maxBitrateKbps);
      }

      const compositeStream = new MediaStream();
      compositeStream.addTrack(videoTrack);

      const micStream = cameraStreamRef.current;
      if (micStream) {
        micStream.getAudioTracks().forEach((t) => compositeStream.addTrack(t));
      }

      if (preset.audio !== false) {
        screenStream.getAudioTracks().forEach((t) => compositeStream.addTrack(t));
      }

      videoTrack.onended = () => {
        stopScreenShare();
      };

      setStreamSafe(compositeStream);
      setScreenShareMode(mode);
      setIsScreenSharing(true);
    } catch {
      // User cancelled or permission denied
    }
  }, [setStreamSafe]);

  const stopScreenShare = useCallback(async () => {
    if (!cameraStreamRef.current) return;
    const cameraStream = cameraStreamRef.current;

    if (peerRef.current && localStreamRef.current) {
      const screenVideoTrack = localStreamRef.current.getVideoTracks()[0];
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      if (screenVideoTrack && cameraVideoTrack) {
        peerRef.current.replaceTrack(screenVideoTrack, cameraVideoTrack, localStreamRef.current);
      }
      await applyBitrate(peerRef.current, 2500);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
    }

    cameraStream.getVideoTracks().forEach((t) => { t.enabled = isCameraEnabled; });
    cameraStream.getAudioTracks().forEach((t) => { t.enabled = isMicEnabled; });

    setStreamSafe(cameraStream);
    setIsScreenSharing(false);
    setScreenShareMode("default");
  }, [isCameraEnabled, isMicEnabled, setStreamSafe]);

  const toggleScreenShare = useCallback(async (mode: ScreenShareMode = "default") => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare(mode);
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isCameraEnabled,
    isMicEnabled,
    isScreenSharing,
    screenShareMode,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    startLocalStream,
    SCREEN_SHARE_PRESETS,
  };
}

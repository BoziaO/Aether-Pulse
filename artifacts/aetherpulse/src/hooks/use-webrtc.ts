import { useEffect, useRef, useState, useCallback } from "react";
import Peer, { Instance as PeerInstance } from "simple-peer";
import { getSocket } from "@/lib/socket";

export function useWebRTC(roomId: string, userId?: number) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
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

    peer.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
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
        localStreamRef.current.getTracks().forEach((track) => track.stop());
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

  const startLocalStream = useCallback(async (quality: { width?: number, height?: number, frameRate?: number } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: Object.keys(quality).length > 0 ? { ...quality } : true,
        audio: true
      });
      
      stream.getVideoTracks().forEach(track => { track.enabled = false; });
      stream.getAudioTracks().forEach(track => { track.enabled = false; });
      setIsCameraEnabled(false);
      setIsMicEnabled(false);

      setStreamSafe(stream);
      
      if (!peerRef.current) {
        peerRef.current = createPeer(stream, true);
      }
    } catch (err) {
      console.error("Failed to start local stream", err);
    }
  }, [createPeer, setStreamSafe]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleMicrophone = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getVideoTracks().forEach(track => { track.enabled = isCameraEnabled; });
        stream.getAudioTracks().forEach(track => { track.enabled = isMicEnabled; });
        
        setStreamSafe(stream);
        if (peerRef.current) {
          const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
          const newVideoTrack = stream.getVideoTracks()[0];
          if (oldVideoTrack && newVideoTrack) {
            peerRef.current.replaceTrack(oldVideoTrack, newVideoTrack, stream);
          }
        }
        setIsScreenSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => stream.addTrack(track));
        }
        
        setStreamSafe(stream);
        if (peerRef.current) {
          const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
          const newVideoTrack = stream.getVideoTracks()[0];
          if (oldVideoTrack && newVideoTrack) {
            peerRef.current.replaceTrack(oldVideoTrack, newVideoTrack, stream);
          }
        }

        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("Error toggling screen share", err);
    }
  }, [isScreenSharing, isCameraEnabled, isMicEnabled, setStreamSafe]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isCameraEnabled,
    isMicEnabled,
    isScreenSharing,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    startLocalStream,
  };
}
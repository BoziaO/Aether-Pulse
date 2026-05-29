import { useEffect, useRef, useState, useCallback } from "react";
import Peer, { Instance as PeerInstance } from "simple-peer";
import { getSocket } from "@/lib/socket";

export function useWebRTC(roomId: string, userId?: number) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peerRef = useRef<PeerInstance | null>(null);
  const socket = getSocket();

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

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        socket.emit("join-room", { roomId, userId });

        socket.on("user-joined", () => {
          peerRef.current = createPeer(stream, true);
        });

        socket.on("offer", (data) => {
          if (!peerRef.current) {
            peerRef.current = createPeer(stream, false);
          }
          peerRef.current.signal(data.offer);
        });

        socket.on("answer", (data) => {
          if (peerRef.current) {
            peerRef.current.signal(data.answer);
          }
        });

        socket.on("ice-candidate", (data) => {
          if (peerRef.current) {
            peerRef.current.signal(data.candidate);
          }
        });

        socket.on("user-left", () => {
          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
          setIsConnected(false);
          setRemoteStream(null);
        });
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
    };

    init();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
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

  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  const toggleMicrophone = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (peerRef.current) {
          const oldVideoTrack = localStream?.getVideoTracks()[0];
          const newVideoTrack = stream.getVideoTracks()[0];
          if (oldVideoTrack && newVideoTrack) {
            peerRef.current.replaceTrack(oldVideoTrack, newVideoTrack, stream);
          }
        }
        setIsScreenSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setLocalStream((prev) => {
          if (prev) {
            stream.getAudioTracks().forEach(track => stream.addTrack(track));
          }
          return stream;
        });
        
        if (peerRef.current && localStream) {
          const oldVideoTrack = localStream.getVideoTracks()[0];
          const newVideoTrack = stream.getVideoTracks()[0];
          if (oldVideoTrack && newVideoTrack) {
            peerRef.current.replaceTrack(oldVideoTrack, newVideoTrack, stream);
          }
        }

        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare(); // Revert back to camera if screen share stopped via browser UI
        };
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("Error toggling screen share", err);
    }
  }, [isScreenSharing, localStream]);

  return {
    localStream,
    remoteStream,
    isConnected,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    isScreenSharing,
  };
}

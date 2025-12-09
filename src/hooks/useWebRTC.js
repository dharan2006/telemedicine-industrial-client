import { useState, useEffect, useRef } from 'react';
import WebRTCService from '../services/webrtc';
import socketService from '../services/socket';
import { turnAPI } from '../services/api';

export const useWebRTC = (roomCode) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState('new');
  const [mediaError, setMediaError] = useState(null);
  
  const webrtcRef = useRef(null);
  const isInitiatorRef = useRef(false);

  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        console.log('🚀 Starting WebRTC initialization for room:', roomCode);

        // Get TURN credentials
        const turnResponse = await turnAPI.getCredentials();
        const iceServers = turnResponse.data.iceServers;
        console.log('✅ TURN servers loaded:', iceServers.length);

        // Create WebRTC service
        webrtcRef.current = new WebRTCService();
        
        // Get local stream
        const stream = await webrtcRef.current.getLocalStream();
        setLocalStream(stream);
        console.log('✅ Local stream obtained');

        // Check for errors
        const errorDetails = webrtcRef.current.getCameraErrorDetails();
        if (errorDetails) {
          setMediaError(errorDetails);
          console.warn('⚠️ Media error:', errorDetails.message);
        }

        // Initialize peer connection
        const pc = await webrtcRef.current.initialize(iceServers);
        console.log('✅ Peer connection initialized');

        // Add local stream tracks
        webrtcRef.current.addLocalStream();
        console.log('✅ Local stream tracks added');

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log('📹 Remote track received:', event.track.kind);
          setRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('🧊 ICE candidate generated');
            socketService.sendIceCandidate({
              roomCode,
              candidate: event.candidate,
            });
          }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log('🔗 Connection state:', pc.connectionState);
          setConnectionState(pc.connectionState);
        };

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
          console.log('❄️ ICE connection state:', pc.iceConnectionState);
        };

        // Setup signaling listeners
        setupSignaling();

        console.log('✅ WebRTC initialization complete');

      } catch (error) {
        console.error('❌ WebRTC initialization error:', error);
        setMediaError({
          type: 'initialization-failed',
          message: 'Failed to initialize video call',
          suggestion: 'Please refresh the page and try again'
        });
      }
    };

    const setupSignaling = () => {
      // Handle incoming offer
      socketService.onOffer(async ({ offer, senderId }) => {
        try {
          console.log('📨 Received offer from:', senderId);
          await webrtcRef.current.setRemoteDescription(offer);
          const answer = await webrtcRef.current.createAnswer();
          socketService.sendAnswer({ roomCode, answer });
          console.log('📤 Sent answer');
        } catch (error) {
          console.error('❌ Error handling offer:', error);
        }
      });

      // Handle incoming answer
      socketService.onAnswer(async ({ answer, senderId }) => {
        try {
          console.log('📨 Received answer from:', senderId);
          await webrtcRef.current.setRemoteDescription(answer);
          console.log('✅ Remote description set');
        } catch (error) {
          console.error('❌ Error handling answer:', error);
        }
      });

      // Handle ICE candidates
      socketService.onIceCandidate(async ({ candidate, senderId }) => {
        try {
          await webrtcRef.current.addIceCandidate(candidate);
          console.log('❄️ ICE candidate added');
        } catch (error) {
          console.error('❌ Error adding ICE candidate:', error);
        }
      });

      // Handle participant joined
      socketService.onParticipantJoined(async ({ peerId }) => {
        try {
          console.log('👥 Participant joined:', peerId);
          isInitiatorRef.current = true;
          const offer = await webrtcRef.current.createOffer();
          socketService.sendOffer({ roomCode, offer });
          console.log('📤 Sent offer to participant');
        } catch (error) {
          console.error('❌ Error creating offer:', error);
        }
      });

      // Handle call ended
      socketService.onCallEnded(() => {
        console.log('📞 Call ended by other participant');
        cleanup();
      });
    };

    initializeWebRTC();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const toggleAudio = () => {
    if (!webrtcRef.current?.hasAudio()) {
      console.warn('⚠️ No audio track available');
      return;
    }
    const newState = !isAudioEnabled;
    webrtcRef.current?.toggleAudio(newState);
    setIsAudioEnabled(newState);
    console.log(newState ? '🔊 Audio enabled' : '🔇 Audio muted');
  };

  const toggleVideo = () => {
    if (!webrtcRef.current?.hasVideo()) {
      console.warn('⚠️ No video track available');
      return;
    }
    const newState = !isVideoEnabled;
    webrtcRef.current?.toggleVideo(newState);
    setIsVideoEnabled(newState);
    console.log(newState ? '📷 Video enabled' : '📷 Video disabled');
  };

  const startScreenShare = async () => {
    try {
      console.log('🖥️ Starting screen share...');
      await webrtcRef.current?.startScreenShare();
      console.log('✅ Screen share started');
    } catch (error) {
      console.error('❌ Screen share error:', error);
    }
  };

  const endCall = () => {
    console.log('📞 Ending call...');
    socketService.endCall();
    cleanup();
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up WebRTC resources');
    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setMediaError(null);
  };

  return {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    connectionState,
    mediaError,
    hasVideo: webrtcRef.current?.hasVideo() || false,
    hasAudio: webrtcRef.current?.hasAudio() || false,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    endCall,
  };
};

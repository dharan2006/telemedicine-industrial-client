class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.cameraError = null;
  }

  async initialize(iceServers) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    return this.peerConnection;
  }

  async getLocalStream() {
    try {
      // Try full video + audio
      console.log('🎥 Attempting to access camera and microphone...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('✅ Camera and microphone access granted!');
      this.cameraError = null;
      return this.localStream;

    } catch (error) {
      console.warn('⚠️ Camera access failed:', error.name, error.message);
      this.cameraError = this.getCameraErrorMessage(error);

      // Try audio-only fallback
      return await this.tryAudioOnlyFallback(error);
    }
  }

  async tryAudioOnlyFallback(originalError) {
    try {
      console.log('🎤 Trying audio-only mode...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      console.log('✅ Audio-only mode successful!');
      this.cameraError = {
        type: 'camera-unavailable',
        message: 'Camera unavailable - Audio only mode',
        suggestion: this.getCameraErrorMessage(originalError).suggestion,
      };
      return this.localStream;

    } catch (audioError) {
      console.warn('⚠️ Audio access also failed:', audioError.name);
      
      // Last resort: empty stream (data channel only)
      return this.createEmptyStream(originalError, audioError);
    }
  }

  createEmptyStream(cameraError, audioError) {
    console.log('📡 Creating empty stream - Data channel only mode');
    this.localStream = new MediaStream();
    
    this.cameraError = {
      type: 'no-media',
      message: 'No camera or microphone access',
      cameraIssue: this.getCameraErrorMessage(cameraError),
      audioIssue: this.getCameraErrorMessage(audioError),
    };

    return this.localStream;
  }

  getCameraErrorMessage(error) {
    const errorName = error?.name || 'UnknownError';

    const errorMessages = {
      'NotAllowedError': {
        type: 'permission-denied',
        message: '🚫 Camera/Microphone Permission Denied',
        suggestion: 'Click the camera icon in your browser\'s address bar and allow access',
        instructions: [
          'Chrome: Click 🔒 in address bar → Site settings → Allow Camera & Microphone',
          'Firefox: Click 🔒 → Clear permissions → Reload and allow',
          'Safari: Preferences → Websites → Camera → Allow'
        ]
      },
      'NotFoundError': {
        type: 'device-not-found',
        message: '📷 No Camera or Microphone Found',
        suggestion: 'Please connect a webcam or use a device with a built-in camera',
        instructions: [
          'Check if your camera is properly connected',
          'Try a different USB port',
          'Restart your browser',
          'Use your mobile phone instead'
        ]
      },
      'NotReadableError': {
        type: 'device-in-use',
        message: '🔴 Camera is Being Used by Another Application',
        suggestion: 'Close other apps using the camera (Zoom, Teams, Skype, etc.)',
        instructions: [
          'Windows: Close Zoom, Teams, Skype, OBS',
          'Mac: Quit all apps using camera',
          'Check Task Manager for camera processes',
          'Restart your computer if issue persists'
        ]
      },
      'OverconstrainedError': {
        type: 'constraints-failed',
        message: '⚙️ Camera Settings Not Supported',
        suggestion: 'Your camera doesn\'t support the requested settings',
        instructions: [
          'Try with a different camera',
          'Update camera drivers',
          'Use default camera settings'
        ]
      },
      'SecurityError': {
        type: 'security-error',
        message: '🔒 Security Restriction',
        suggestion: 'Camera access blocked by browser security policy',
        instructions: [
          'Make sure you\'re using HTTPS (not HTTP)',
          'Check if site is blocked in browser settings',
          'Try in a different browser'
        ]
      },
      'SystemPermissionDenied': {
        type: 'system-blocked',
        message: '🛡️ System-Level Camera Block',
        suggestion: 'Camera is disabled in your operating system settings',
        instructions: [
          'Windows: Settings → Privacy → Camera → Allow apps',
          'Mac: System Preferences → Security & Privacy → Camera',
          'Enable camera access for your browser'
        ]
      }
    };

    return errorMessages[errorName] || {
      type: 'unknown',
      message: `❓ Unknown Error: ${errorName}`,
      suggestion: 'Please try refreshing the page or using a different browser',
      instructions: [
        'Refresh the page',
        'Try a different browser (Chrome, Firefox, Safari)',
        'Restart your device',
        'Contact support if issue persists'
      ]
    };
  }

  addLocalStream() {
    if (this.localStream && this.peerConnection) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
  }

  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer() {
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description) {
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  }

  async addIceCandidate(candidate) {
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = this.peerConnection
        .getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      screenTrack.onended = () => {
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      };

      return screenStream;
    } catch (error) {
      console.error('Screen share error:', error);
      throw error;
    }
  }

  getCameraErrorDetails() {
    return this.cameraError;
  }

  hasVideo() {
    return this.localStream?.getVideoTracks().length > 0;
  }

  hasAudio() {
    return this.localStream?.getAudioTracks().length > 0;
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.cameraError = null;
  }
}

export default WebRTCService;

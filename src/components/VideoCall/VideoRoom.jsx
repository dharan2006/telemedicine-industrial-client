import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWebRTC } from '../../hooks/useWebRTC';
import { roomAPI } from '../../services/api';
import socketService from '../../services/socket';
import { 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVideo, 
  FaVideoSlash,
  FaDesktop,
  FaPhoneSlash,
  FaShieldAlt,
  FaStopCircle
} from 'react-icons/fa';
import './VideoRoom.css';

const VideoRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    connectionState,
    mediaError,
    hasVideo,
    hasAudio,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    endCall,
  } = useWebRTC(roomCode);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showEndRoomModal, setShowEndRoomModal] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState([]);

  // Set video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('✅ Local video stream set');
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('✅ Remote video stream set');
      addLog('📹 Remote stream received and set');
    }
  }, [remoteStream]);

  // Add log entry
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Call duration timer
  useEffect(() => {
    if (remoteStream || connectionState === 'connected') {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [connectionState, remoteStream]);

  // Listen for room timeout
  useEffect(() => {
    socketService.socket?.on('room-timeout', () => {
      addLog('⏰ Room ended due to inactivity');
      alert('Room ended due to inactivity');
      handleLeaveRoom();
    });

    return () => {
      socketService.socket?.off('room-timeout');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join room on mount - UPDATED WITH DETAILED LOGGING
  useEffect(() => {
    if (user?.role === 'patient') {
      addLog(`👤 Patient initializing room join for: ${roomCode}`);
      
      const timer = setTimeout(() => {
        addLog('👤 Patient attempting to join room: ' + roomCode);
        addLog('🔌 Socket connected: ' + (socketService.socket?.connected ? 'YES' : 'NO'));
        console.log('👤 Patient attempting to join room:', roomCode);
        console.log('🔌 Socket connected:', socketService.socket?.connected);
        
        socketService.joinRoom(
          { roomCode, password: 'already-verified' }, 
          (response) => {
            if (!response.success) {
              addLog('❌ Socket join failed: ' + response.error);
              console.error('❌ Failed to join room via socket:', response.error);
              addLog('⚠️ Continuing with video setup despite socket join failure...');
              console.warn('⚠️ Socket join failed but continuing with video setup...');
            } else {
              addLog('✅ Successfully joined room via socket');
              addLog('🎤 Audio track available: ' + (hasAudio ? 'YES' : 'NO'));
              addLog('📹 Video track available: ' + (hasVideo ? 'YES' : 'NO'));
              console.log('✅ Successfully joined room via socket');
              console.log('🎤 Audio should now transmit');
              console.log('📹 Waiting for remote stream...');
            }
          }
        );
      }, 1500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, user, hasAudio, hasVideo]);

  const handleScreenShare = async () => {
    try {
      addLog('🖥️ Starting screen share...');
      await startScreenShare();
      setIsScreenSharing(true);
      addLog('✅ Screen share started');
    } catch (error) {
      addLog('❌ Screen share failed: ' + error.message);
      console.error('Screen share failed:', error);
    }
  };

  const handleEndCall = () => {
    addLog('📞 Ending call...');
    endCall();
    handleLeaveRoom();
  };

  const handleLeaveRoom = () => {
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/patient/lobby');
    }
  };

  const handleEndRoomClick = () => {
    setShowEndRoomModal(true);
  };

  const confirmEndRoom = async () => {
    try {
      addLog('🛑 Ending room for everyone...');
      await roomAPI.endRoom(roomCode);
      addLog('✅ Room ended');
      endCall();
      navigate('/doctor/dashboard');
    } catch (error) {
      addLog('❌ End room error: ' + error.message);
      console.error('End room error:', error);
      alert('Failed to end room');
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-room">
      {/* Header */}
      <div className="video-header">
        <div className="header-left">
          <h3>🏥 Consultation Room</h3>
          <span className="room-code">Room: {roomCode}</span>
        </div>
        <div className="header-right">
          <div className="encryption-badge">
            <FaShieldAlt />
            <span>Encrypted</span>
          </div>
          <div className={`connection-status ${connectionState}`}>
            <span className="status-dot"></span>
            {connectionState === 'connected' ? '✅ Connected' : '⏳ Connecting...'}
          </div>
          <div className="call-duration">
            ⏱️ {formatDuration(callDuration)}
          </div>
        </div>
      </div>

      {/* Media Error Banner */}
      {mediaError && (
        <div className="media-error-banner">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>{mediaError.message}</h4>
            <p>{mediaError.suggestion}</p>
            {mediaError.instructions && (
              <details className="error-details">
                <summary>Click for detailed fix instructions</summary>
                <ul>
                  {mediaError.instructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ul>
              </details>
            )}
            {mediaError.type === 'device-in-use' && (
              <button 
                className="btn-retry"
                onClick={() => window.location.reload()}
              >
                🔄 Retry Connection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connection Logs (Debug Info) */}
      <div className="connection-logs">
        <div className="logs-header">
          <h4>📊 Connection Status</h4>
          <small>Audio: {hasAudio ? '✅' : '❌'} | Video: {hasVideo ? '✅' : '❌'} | State: {connectionState}</small>
        </div>
        <div className="logs-content">
          {connectionLogs.slice(-8).map((log, idx) => (
            <div key={idx} className="log-entry">{log}</div>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {/* Remote Video */}
        <div className="video-container video-main">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video-element"
            />
          ) : (
            <div className="video-placeholder">
              <div className="avatar-large">
                {user?.role === 'doctor' ? '👤' : '👨‍⚕️'}
              </div>
              <p>Waiting for {user?.role === 'doctor' ? 'patient' : 'doctor'}...</p>
              <small>Share the room code with your {user?.role === 'doctor' ? 'patient' : 'doctor'}</small>
            </div>
          )}
          <div className="video-label">
            {user?.role === 'doctor' ? 'Patient' : 'Doctor'}
          </div>
        </div>

        {/* Local Video */}
        <div className="video-container video-local">
          {hasVideo ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="video-element video-mirrored"
            />
          ) : (
            <div className="video-placeholder">
              <div className="avatar-small">
                {user?.role === 'doctor' ? '👨‍⚕️' : '👤'}
              </div>
              <small>No Camera</small>
            </div>
          )}
          <div className="video-label">You</div>
          {!isVideoEnabled && hasVideo && (
            <div className="video-off-overlay">
              <FaVideoSlash size={24} />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="video-controls">
        <button
          className={`control-btn ${!isAudioEnabled ? 'danger' : ''} ${!hasAudio ? 'disabled' : ''}`}
          onClick={toggleAudio}
          title={hasAudio ? (isAudioEnabled ? 'Mute' : 'Unmute') : 'No microphone available'}
          disabled={!hasAudio}
        >
          {isAudioEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
        </button>

        <button
          className={`control-btn ${!isVideoEnabled ? 'danger' : ''} ${!hasVideo ? 'disabled' : ''}`}
          onClick={toggleVideo}
          title={hasVideo ? (isVideoEnabled ? 'Stop Video' : 'Start Video') : 'No camera available'}
          disabled={!hasVideo}
        >
          {isVideoEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
        </button>

        {hasVideo && (
          <button
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={handleScreenShare}
            title="Share Screen"
          >
            <FaDesktop size={20} />
          </button>
        )}

        {user?.role === 'doctor' && (
          <button
            className="control-btn end-room-btn"
            onClick={handleEndRoomClick}
            title="End Room for Everyone"
          >
            <FaStopCircle size={20} />
          </button>
        )}

        <button
          className="control-btn end-call"
          onClick={handleEndCall}
          title="Leave Call"
        >
          <FaPhoneSlash size={20} />
        </button>
      </div>

      {/* End Room Confirmation Modal */}
      {showEndRoomModal && (
        <div className="modal-overlay" onClick={() => setShowEndRoomModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>End Room?</h2>
            <p>This will end the consultation for everyone and close the room.</p>
            <div className="modal-buttons">
              <button
                onClick={() => setShowEndRoomModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndRoom}
                className="btn-danger"
              >
                End Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRoom;

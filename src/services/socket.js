import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting socket to:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected');
    }
  }

  // Room events
  createRoom(data, callback) {
    console.log('📝 Creating room...');
    this.socket.emit('create-room', data, callback);
  }

  getRooms(callback) {
    this.socket.emit('get-rooms', callback);
  }

  joinRoom(data, callback) {
    console.log('👤 Joining room:', data.roomCode);
    this.socket.emit('join-room', data, callback);
  }

  // WebRTC signaling
  sendOffer(data) {
    console.log('📤 Sending offer to room:', data.roomCode);
    this.socket.emit('offer', data);
  }

  sendAnswer(data) {
    console.log('📥 Sending answer to room:', data.roomCode);
    this.socket.emit('answer', data);
  }

  sendIceCandidate(data) {
    this.socket.emit('ice-candidate', data);
  }

  endCall() {
    console.log('📞 Ending call via socket');
    this.socket.emit('end-call');
  }

  // Event listeners
  onOffer(callback) {
    this.socket.on('offer', callback);
  }

  onAnswer(callback) {
    this.socket.on('answer', callback);
  }

  onIceCandidate(callback) {
    this.socket.on('ice-candidate', callback);
  }

  onParticipantJoined(callback) {
    this.socket.on('participant-joined', callback);
  }

  onParticipantLeft(callback) {
    this.socket.on('participant-left', callback);
  }

  onCallEnded(callback) {
    this.socket.on('call-ended', callback);
  }

  onRoomsUpdated(callback) {
    this.socket.on('rooms-updated', callback);
  }
}

const socketService = new SocketService();
export default socketService;

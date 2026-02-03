import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://toki-backend-78ds.onrender.com';

class SocketService {
    socket = null;

    connect(token) {
        if (this.socket) return this.socket;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'], // Allow fallback to polling
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export default new SocketService();

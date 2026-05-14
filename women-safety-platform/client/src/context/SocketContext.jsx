import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Global SOS alert listener
    newSocket.on('sos:alert', (data) => {
      if (user?.role === 'volunteer') {
        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdnmOlZeRiX13cXZ9h5GVk4yDenNwdnyHk5mXkYiAd3JxeIKPlpmWj4V9dnJ0e4aTmpiSioJ7c3J0eoKQl5mUjoeDenRxdXuDjpeamJKMhHx1c3N2fIeSmZqWkIuDenRxdHl/iZSZmpiSjYV9eHNzeX2Fj5eZmJOOiIJ8dnN1eX+GkJeZmJKNh4F7dnR2en+GkJeZmJKOiIJ8dnR2eX+Fj5aYl5KNh4F7dnR2eX6Ej5aYl5OOiIJ8dnR1eH6Ej5aYl5OOiIJ9dnR1eH2Dj5WXl5KNh4F8d3R2eH2DjpWXl5OOiIJ9d3V1d3yDjpSWl5OOiIN9eHV2d3yBjJOVlpOOiYN+eHZ2eHuAi5KUlZOPioR/eXd3eXuAi5GUlZOPi4V/end3eXp/ipCTlJOPi4aAgHh4eXl+iY+Sk5OPi4aAgXl4eXl9iI6Rk5OQjIeAgnl5eXh8h42QkpKQjIiBg3p5enl7hoyPkZGQjYqDhHt6enp7hYuOkJGQjouFhHx7e3t7hIqNj5CQj4yGhX18fHx8g4mMjY+Pj4yIhn59fX19goiLjI6Oj42JiIB+fn5+gYeKi42OjY2KiYF/f39/gIaJio2NjI2LiYKAf4CAgYWIiYuMjIyLiYOBgIGBgYSHiIqLi4uLioSDgYGCg4OGh4mKioqKi4qGhIKCg4OFhoeIiYmJiomIhYSDg4SEhYaHiIiIiIiIh4aEhISFhYWGh4eHh4eHh4eGhYSFhYWFhoaGhoaGhoaGhoaFhYWFhQA=');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}
        
        toast((t) => (
          `🚨 SOS Alert from ${data.userName}! Check your dashboard.`
        ), {
          duration: 8000,
          icon: '🚨',
          style: {
            background: '#7F1D1D',
            color: '#FEE2E2',
            border: '1px solid rgba(244, 63, 94, 0.5)'
          }
        });
      }
    });

    // SOS accepted notification
    newSocket.on('sos:accepted', (data) => {
      if (user?.role === 'user') {
        toast.success(`${data.volunteer.name} is on their way to help you!`, {
          duration: 6000,
          icon: '🙏'
        });
      }
    });

    // Emergency resolved
    newSocket.on('emergency:resolved', () => {
      toast.success('Emergency has been resolved. Stay safe!', {
        duration: 5000,
        icon: '✅'
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.role]);

  const joinEmergencyRoom = useCallback((emergencyId) => {
    if (socket) {
      socket.emit('emergency:join', emergencyId);
    }
  }, [socket]);

  const leaveEmergencyRoom = useCallback((emergencyId) => {
    if (socket) {
      socket.emit('emergency:leave', emergencyId);
    }
  }, [socket]);

  const sendLocationUpdate = useCallback((emergencyId, coordinates) => {
    if (socket) {
      socket.emit('location:update', { emergencyId, coordinates });
    }
  }, [socket]);

  const sendChatMessage = useCallback((emergencyId, message) => {
    if (socket) {
      socket.emit('chat:message', { emergencyId, message });
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      joinEmergencyRoom,
      leaveEmergencyRoom,
      sendLocationUpdate,
      sendChatMessage
    }}>
      {children}
    </SocketContext.Provider>
  );
};

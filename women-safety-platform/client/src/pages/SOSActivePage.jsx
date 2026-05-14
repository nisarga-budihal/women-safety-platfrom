import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { emergencyAPI } from '../services/api';
import MapView from '../components/common/MapView';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, User, Phone, MessageCircle,
  Send, X, Check, Loader, Shield
} from 'lucide-react';
import { STATUS_CONFIG } from '../utils/constants';
import { haversineDistance, formatDistance, calculateETA } from '../utils/distance';
import toast from 'react-hot-toast';

const SOSActivePage = () => {
  const { user } = useAuth();
  const { socket, joinEmergencyRoom, leaveEmergencyRoom } = useSocket();
  const navigate = useNavigate();
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const chatEndRef = useRef(null);
  const locationWatchRef = useRef(null);

  // Calculate distance
  useEffect(() => {
    if (userLocation && volunteerLocation) {
      const dist = haversineDistance(
        userLocation[1], userLocation[0],
        volunteerLocation[1], volunteerLocation[0]
      );
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, [userLocation, volunteerLocation]);

  // Load active emergency
  useEffect(() => {
    const loadEmergency = async () => {
      try {
        const { data } = await emergencyAPI.getActive();
        if (data.emergency) {
          setEmergency(data.emergency);
          setChatMessages(data.emergency.chatMessages || []);
          if (data.emergency.location?.coordinates) {
            setUserLocation(data.emergency.location.coordinates);
          }
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadEmergency();
  }, [navigate]);

  // Join emergency room and strict user room, handle socket events
  useEffect(() => {
    if (!emergency || !socket || !user) return;

    joinEmergencyRoom(emergency._id);
    
    // Strict requirement: User joins their own direct room
    socket.emit('joinRoom', user._id);

    socket.on('sos:accepted', (data) => {
      setEmergency(prev => ({
        ...prev,
        status: 'accepted',
        assignedVolunteer: data.volunteer
      }));
      toast.success(`${data.volunteer.name} is coming to help!`, { icon: '🙏' });
    });

    // Old location:update intercept fallback
    socket.on('location:update', (data) => {
      if (data.userId !== user._id && data.coordinates) {
        setVolunteerLocation(data.coordinates);
      }
    });

    // Strict tracking implementation handler
    socket.on('volunteerLocationUpdate', (data) => {
      if (data.lat && data.lng) {
        setVolunteerLocation([data.lng, data.lat]); // Transform back to GeoJSON style
      }
    });

    socket.on('chat:message', (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    socket.on('emergency:resolved', () => {
      toast.success('Emergency has been resolved!');
      navigate('/dashboard');
    });

    return () => {
      leaveEmergencyRoom(emergency._id);
      socket.emit('leaveRoom', user._id);
      socket.off('sos:accepted');
      socket.off('location:update');
      socket.off('volunteerLocationUpdate');
      socket.off('chat:message');
      socket.off('emergency:resolved');
    };
  }, [emergency?._id, socket]);

  // Watch user's real-time location
  useEffect(() => {
    if (!emergency) return;

    if (navigator.geolocation) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(coords);
          // Send location update
          emergencyAPI.updateLocation(emergency._id, { coordinates: coords }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    return () => {
      if (locationWatchRef.current) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, [emergency?._id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this emergency?')) return;
    try {
      await emergencyAPI.cancel(emergency._id, 'Cancelled by user');
      toast.success('Emergency cancelled');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const handleResolve = async () => {
    try {
      await emergencyAPI.resolve(emergency._id);
      toast.success('Emergency resolved! Stay safe.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to resolve');
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      await emergencyAPI.sendChat(emergency._id, chatInput);
      setChatInput('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const getElapsedTime = () => {
    if (!emergency?.createdAt) return '00:00';
    const diff = Math.floor((Date.now() - new Date(emergency.createdAt)) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[emergency?.status] || {};

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-3 h-3 rounded-full animate-pulse ${statusConfig.dotColor}`} />
                <h1 className="text-xl sm:text-2xl font-bold text-dark-50">Emergency Active</h1>
              </div>
              <p className="text-dark-400 text-sm">
                Status: <span className={statusConfig.color}>{statusConfig.label}</span>
                {' '} • Elapsed: {getElapsedTime()}
              </p>
            </div>
            <div className="flex gap-2">
              {emergency?.status === 'pending' && (
                <button onClick={handleCancel} className="btn-ghost text-accent-400 text-sm flex items-center gap-1">
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
              {['accepted', 'in_progress'].includes(emergency?.status) && (
                <button onClick={handleResolve} className="btn-primary text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" /> Mark Resolved
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card !p-0 overflow-hidden"
            >
              <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
                <h3 className="font-semibold text-dark-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-400" />
                  Live Tracking
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Sharing Location
                </div>
              </div>
              <MapView
                userLocation={userLocation}
                volunteerLocation={volunteerLocation}
                showRadius={emergency?.status === 'pending'}
                radiusMeters={10000}
                pathCoordinates={emergency?.locationHistory?.map(h => h.coordinates) || []}
                style={{ height: '450px', borderRadius: 0 }}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Volunteer Info */}
            {emergency?.assignedVolunteer ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card border-emerald-500/20"
              >
                <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Help is on the way
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                    {emergency.assignedVolunteer.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-100">{emergency.assignedVolunteer.name}</p>
                    <p className="text-sm text-dark-400">{emergency.assignedVolunteer.phone}</p>
                  </div>
                </div>

                {distance !== null && (
                  <div className="flex gap-4 mt-2 mb-4 bg-dark-800 p-3 rounded-lg border border-dark-700">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-dark-500 mb-1">Distance</p>
                      <p className="font-bold text-accent-400">{formatDistance(distance)}</p>
                    </div>
                    <div className="flex-1 text-center border-l border-dark-700">
                      <p className="text-xs text-dark-500 mb-1">ETA</p>
                      <p className="font-bold text-emerald-400">{eta}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowChat(true)}
                    className="flex-1 btn-outline text-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </button>
                  <a
                    href={`tel:${emergency.assignedVolunteer.phone}`}
                    className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 border-none text-sm flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Volunteer
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card text-center py-8"
              >
                <Loader className="w-8 h-8 text-primary-400 mx-auto mb-3 animate-spin" />
                <p className="font-semibold text-dark-200">Searching for nearby volunteers...</p>
                <p className="text-sm text-dark-500 mt-1">Stay calm, help is on the way</p>
              </motion.div>
            )}

            {/* Emergency Details */}
            <div className="card">
              <h3 className="text-sm font-semibold text-dark-300 mb-3">Emergency Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-500">Type</span>
                  <span className="text-dark-200 capitalize">{emergency?.emergencyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Created</span>
                  <span className="text-dark-200">{new Date(emergency?.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Description</span>
                  <span className="text-dark-200 text-right max-w-[200px] truncate">{emergency?.description}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-sm font-semibold text-dark-300 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="tel:112"
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-medium hover:bg-accent-500/15 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Call Police (112)
                </a>
                <a
                  href="tel:181"
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium hover:bg-primary-500/15 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Women Helpline (181)
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-dark-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary-400" />
                Live Chat
              </h3>
              <button onClick={() => setShowChat(false)} className="text-dark-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {chatMessages.length === 0 && (
                <p className="text-center text-dark-500 text-sm py-8">No messages yet. Start a conversation.</p>
              )}
              {chatMessages.map((msg, i) => {
                const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-dark-700 text-dark-200 rounded-bl-md'
                    }`}>
                      {!isMe && (
                        <p className="text-xs font-medium text-primary-400 mb-1">{msg.sender?.name || 'Volunteer'}</p>
                      )}
                      <p>{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-dark-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-dark-700/50">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="input-field flex-1 !py-2.5"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="btn-primary !px-4 !py-2.5"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SOSActivePage;

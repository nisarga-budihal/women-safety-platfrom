import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { volunteerAPI, emergencyAPI } from '../services/api';
import MapView from '../components/common/MapView';
import Navbar from '../components/common/Navbar';
import StatCard from '../components/common/StatCard';
import { motion } from 'framer-motion';
import {
  Shield, Bell, MapPin, Clock, User, Phone,
  CheckCircle, XCircle, ToggleLeft, ToggleRight,
  Navigation, AlertTriangle, Award, TrendingUp
} from 'lucide-react';
import { STATUS_CONFIG } from '../utils/constants';
import { haversineDistance, formatDistance, calculateETA } from '../utils/distance';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [volunteer, setVolunteer] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [location, setLocation] = useState(null);
  const [activeMission, setActiveMission] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const { joinEmergencyRoom, leaveEmergencyRoom } = useSocket();

  useEffect(() => {
    const active = myResponses.find(r => ['accepted', 'in_progress'].includes(r.status));
    setActiveMission(active || null);
  }, [myResponses]);

  useEffect(() => {
    if (!activeMission || !socket) return;
    joinEmergencyRoom(activeMission._id);

    const handleLocationUpdate = (data) => {
      if (data.userId === activeMission.userId?._id) {
        setActiveMission(prev => prev ? {
          ...prev,
          location: { ...prev.location, coordinates: data.coordinates }
        } : null);
      }
    };
    socket.on('location:update', handleLocationUpdate);
    return () => {
      leaveEmergencyRoom(activeMission._id);
      socket.off('location:update', handleLocationUpdate);
    }
  }, [activeMission?._id, socket]);

  useEffect(() => {
    if (activeMission && location && activeMission.location?.coordinates) {
      const dist = haversineDistance(
        location[1], location[0],
        activeMission.location.coordinates[1], activeMission.location.coordinates[0]
      );
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, [location, activeMission?.location?.coordinates]);

  // Load volunteer data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, alertsRes, responsesRes] = await Promise.all([
          volunteerAPI.getProfile().catch(() => null),
          volunteerAPI.getAlerts().catch(() => ({ data: { emergencies: [] } })),
          volunteerAPI.getMyResponses().catch(() => ({ data: { emergencies: [] } }))
        ]);
        if (profileRes?.data?.volunteer) setVolunteer(profileRes.data.volunteer);
        setAlerts(alertsRes?.data?.emergencies || []);
        setMyResponses(responsesRes?.data?.emergencies || []);
      } catch (err) {}
      setLoading(false);
    };
    loadData();
  }, []);

  // ----------------------------------------------------
  // 📍 GEOLOCATION TRACKING FIX
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error('[Geolocation] Failed: Geolocation is not supported by your browser.');
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    // 2. Simple test function for initial ping check (getCurrentPosition)
    navigator.geolocation.getCurrentPosition(
      (pos) => console.log('✅ [Geolocation Initial Test] Success:', pos.coords.latitude, pos.coords.longitude),
      (err) => console.log('❌ [Geolocation Initial Test] Failed:', err.message)
    );

    console.log('📡 Starting continuous location tracking...');
    
    // 3. Proper config for real-time tracking
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const handleSuccess = (pos) => {
      console.log('📍 [Geolocation Update]', pos.coords.latitude, pos.coords.longitude);
      const coords = [pos.coords.longitude, pos.coords.latitude];
      setLocation(coords);
      volunteerAPI.updateLocation({ coordinates: coords }).catch(() => {});
      
      // 4. Strict Socket.IO Integration
      if (socket && activeMission && activeMission.userId?._id) {
        socket.emit('updateLocation', {
          userId: activeMission.userId._id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      }
    };

    const handleError = (error) => {
      console.error('❌ [Geolocation Error]:', error);
      let errorMsg = 'Failed to get location.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'Location permission denied. Please allow location access in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'Location information is unavailable (GPS failure).';
          break;
        case error.TIMEOUT:
          errorMsg = 'Location request timed out. Trying again...';
          break;
      }
      
      toast.error(errorMsg);
      // Provided fallback as required
      if (!location) {
        setLocation([77.5946, 12.9716]); // Default fallback location
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    
    return () => {
      console.log('🛑 Clearing location tracking watch');
      navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, activeMission?.userId?._id]);

  // Listen for new SOS alerts
  useEffect(() => {
    if (!socket) return;
    const handleNewAlert = (data) => {
      setAlerts(prev => {
        const exists = prev.find(a => a._id === data.emergencyId);
        if (exists) return prev;
        return [{
          _id: data.emergencyId,
          userId: { name: data.userName, phone: data.userPhone },
          location: data.location,
          description: data.description,
          emergencyType: data.emergencyType,
          status: 'pending',
          createdAt: data.createdAt
        }, ...prev];
      });
    };

    const handleTaken = (data) => {
      setAlerts(prev => prev.filter(a => a._id !== data.emergencyId));
    };

    socket.on('sos:alert', handleNewAlert);
    socket.on('emergency:taken', handleTaken);
    socket.on('emergency:cancelled', handleTaken);

    return () => {
      socket.off('sos:alert', handleNewAlert);
      socket.off('emergency:taken', handleTaken);
      socket.off('emergency:cancelled', handleTaken);
    };
  }, [socket]);

  const toggleAvailability = async () => {
    try {
      const { data } = await volunteerAPI.toggleAvailability();
      setVolunteer(prev => ({ ...prev, availability: data.availability }));
      toast.success(data.availability ? '✅ You are now online!' : '🔴 You are now offline');
    } catch (err) {
      toast.error('Failed to toggle availability');
    }
  };

  const acceptAlert = async (emergencyId) => {
    setAccepting(emergencyId);
    try {
      await volunteerAPI.acceptEmergency(emergencyId, { coordinates: location });
      toast.success('Emergency accepted! Navigate to the user.');
      setAlerts(prev => prev.filter(a => a._id !== emergencyId));
      // Refresh responses
      const { data } = await volunteerAPI.getMyResponses();
      setMyResponses(data.emergencies);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    } finally {
      setAccepting(null);
    }
  };

  const declineAlert = async (emergencyId) => {
    try {
      await volunteerAPI.declineEmergency(emergencyId);
      setAlerts(prev => prev.filter(a => a._id !== emergencyId));
      toast('Alert declined', { icon: '👋' });
    } catch (err) {
      toast.error('Failed to decline');
    }
  };

  const isPending = volunteer?.idVerification?.status === 'pending';
  const isRejected = volunteer?.idVerification?.status === 'rejected';
  const isVerified = volunteer?.idVerification?.status === 'verified';

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-50">Volunteer Dashboard</h1>
            <p className="text-dark-400 mt-1">Help women in your area during emergencies</p>
          </div>
          {isVerified && (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAvailability}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  volunteer?.availability
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-dark-700/50 text-dark-400 border border-dark-600/50 hover:bg-dark-700'
                }`}
              >
                {volunteer?.availability ? (
                  <><ToggleRight className="w-5 h-5" /> Online</>
                ) : (
                  <><ToggleLeft className="w-5 h-5" /> Offline</>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Verification Banner */}
        {isPending && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-400">Verification Pending</p>
                <p className="text-sm text-dark-300">Your ID verification is being reviewed by admin. You'll be able to respond to alerts once verified.</p>
              </div>
            </div>
          </div>
        )}
        {isRejected && (
          <div className="mb-6 p-4 rounded-2xl bg-accent-500/10 border border-accent-500/30">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-accent-400" />
              <div>
                <p className="font-semibold text-accent-400">Verification Rejected</p>
                <p className="text-sm text-dark-300">
                  Reason: {volunteer?.idVerification?.rejectionReason || 'Contact admin for details'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {isVerified && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Award} label="Total Responses" value={volunteer?.responseCount || 0} color="primary" delay={0} />
            <StatCard icon={Clock} label="Avg Response Time" value={`${volunteer?.avgResponseTime || 0}s`} color="blue" delay={1} />
            <StatCard icon={AlertTriangle} label="Active Alerts" value={alerts.length} color="accent" delay={2} />
            <StatCard icon={TrendingUp} label="Rating" value={volunteer?.rating?.toFixed(1) || 'N/A'} color="amber" delay={3} />
          </div>
        )}

        {isVerified && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              
              {/* Active Mission */}
              {activeMission && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card border-emerald-500/50 relative overflow-hidden mb-6"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Navigation className="w-5 h-5" />
                      Active Mission
                    </h2>
                    {distance !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-dark-50 leading-none">{formatDistance(distance)}</p>
                        <p className="text-emerald-400 text-sm font-medium mt-1">ETA: {eta}</p>
                      </div>
                    )}
                  </div>
                  
                  <MapView
                    userLocation={activeMission.location?.coordinates}
                    volunteerLocation={location}
                    compact={false}
                    style={{ height: '300px' }}
                    className="mb-4"
                  />

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-dark-200 font-bold">
                        {activeMission.userId?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-dark-100">{activeMission.userId?.name || 'User in distress'}</p>
                        <a href={`tel:${activeMission.userId?.phone}`} className="text-sm text-primary-400 flex items-center gap-1 hover:underline">
                          <Phone className="w-3.5 h-3.5" />
                          {activeMission.userId?.phone || 'Unknown phone'}
                        </a>
                      </div>
                    </div>

                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.location?.coordinates?.[1]},${activeMission.location?.coordinates?.[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border-none"
                    >
                      <MapPin className="w-4 h-4" />
                      Start Navigation
                    </a>
                  </div>
                </motion.div>
              )}

            {/* Incoming Alerts */}
              <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent-400" />
                Incoming SOS Alerts
                {alerts.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold">
                    {alerts.length}
                  </span>
                )}
              </h2>

              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="card border-accent-500/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-accent-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-dark-100">{alert.userId?.name || 'User'}</p>
                            <p className="text-xs text-dark-400">{alert.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-dark-500">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {alert.location?.coordinates && (
                        <MapView
                          userLocation={alert.location.coordinates}
                          compact={true}
                          style={{ height: '150px' }}
                          className="mb-3"
                        />
                      )}

                      <div className="flex items-center gap-3 text-sm text-dark-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {alert.userId?.phone || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {alert.location?.coordinates?.[1]?.toFixed(3)}, {alert.location?.coordinates?.[0]?.toFixed(3)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptAlert(alert._id)}
                          disabled={accepting === alert._id}
                          className="flex-1 btn-accent text-sm flex items-center justify-center gap-2"
                        >
                          {accepting === alert._id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><CheckCircle className="w-4 h-4" /> Accept</>
                          )}
                        </button>
                        <button
                          onClick={() => declineAlert(alert._id)}
                          className="px-4 py-2 rounded-xl border border-dark-600/50 text-dark-400 text-sm hover:bg-dark-700/50 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Shield className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="font-medium text-dark-300">No active SOS alerts</p>
                  <p className="text-sm text-dark-500 mt-1">
                    {volunteer?.availability
                      ? 'You will be notified when someone nearby needs help'
                      : 'Go online to receive alerts'}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar - My Responses */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                My Responses
              </h2>
              {myResponses.length > 0 ? (
                <div className="space-y-3">
                  {myResponses.slice(0, 10).map((resp) => (
                    <div key={resp._id} className="card-hover !p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[resp.status]?.dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-200 truncate">
                            {resp.userId?.name || 'User'}
                          </p>
                          <p className="text-xs text-dark-500">
                            {new Date(resp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs ${STATUS_CONFIG[resp.status]?.color}`}>
                          {STATUS_CONFIG[resp.status]?.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <p className="text-sm text-dark-500">No response history yet</p>
                </div>
              )}

              {/* Your Location */}
              <div className="card !p-0 overflow-hidden">
                <div className="p-3 border-b border-dark-700/50">
                  <h3 className="text-sm font-semibold text-dark-300 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary-400" />
                    Your Location
                  </h3>
                </div>
                <MapView
                  userLocation={location}
                  compact={true}
                  style={{ height: '200px', borderRadius: 0 }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VolunteerDashboard;

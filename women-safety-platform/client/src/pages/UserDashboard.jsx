import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { emergencyAPI } from '../services/api';
import SOSButton from '../components/common/SOSButton';
import MapView from '../components/common/MapView';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import {
  Phone, Users, MapPin, Clock, AlertTriangle, Shield,
  ChevronRight, UserPlus, History, Vibrate
} from 'lucide-react';
import { EMERGENCY_TYPES, STATUS_CONFIG } from '../utils/constants';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedType, setSelectedType] = useState('other');
  const [description, setDescription] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        () => {
          // Default to Bangalore if location unavailable
          setUserLocation([77.5946, 12.9716]);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Check for active emergency
  useEffect(() => {
    const checkActive = async () => {
      try {
        const { data } = await emergencyAPI.getActive();
        if (data.emergency) {
          setActiveEmergency(data.emergency);
        }
      } catch (err) {}
    };
    checkActive();
  }, []);

  // Load recent alerts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await emergencyAPI.getHistory(1);
        setRecentAlerts(data.emergencies.slice(0, 5));
      } catch (err) {}
    };
    loadHistory();
  }, []);

  const handleSOSTrigger = () => {
    if (activeEmergency) {
      navigate('/sos-active');
      return;
    }
    setShowSOSModal(true);
  };

  const confirmSOS = async () => {
    setTriggering(true);
    try {
      const coords = userLocation || [77.5946, 12.9716];
      const { data } = await emergencyAPI.triggerSOS({
        coordinates: coords,
        description: description || 'Emergency SOS Alert',
        emergencyType: selectedType
      });
      toast.success('SOS Alert sent! Help is on the way.');
      setShowSOSModal(false);
      navigate('/sos-active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger SOS');
    } finally {
      setTriggering(false);
    }
  };

  // Panic button (simulated shake detection)
  const handlePanic = async () => {
    if (activeEmergency) {
      navigate('/sos-active');
      return;
    }
    const coords = userLocation || [77.5946, 12.9716];
    try {
      await emergencyAPI.triggerSOS({
        coordinates: coords,
        description: 'PANIC ALERT - Immediate Help Needed',
        emergencyType: 'other'
      });
      toast.success('🚨 PANIC Alert sent!');
      navigate('/sos-active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send panic alert');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-50">
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-dark-400 mt-1">Your safety dashboard — help is always one tap away.</p>
        </motion.div>

        {/* Active Emergency Banner */}
        {activeEmergency && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-accent-500/10 border border-accent-500/30 cursor-pointer hover:bg-accent-500/15 transition-all"
            onClick={() => navigate('/sos-active')}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-accent-500 animate-pulse" />
              <div className="flex-1">
                <p className="font-semibold text-accent-400">Active Emergency</p>
                <p className="text-sm text-dark-300">Status: {STATUS_CONFIG[activeEmergency.status]?.label}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-accent-400" />
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main — SOS Button */}
          <div className="lg:col-span-2 space-y-6">
            {/* SOS Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card flex flex-col items-center py-12"
            >
              <h2 className="text-lg font-semibold text-dark-200 mb-2">Emergency SOS</h2>
              <p className="text-sm text-dark-500 mb-8 text-center max-w-xs">
                Press the SOS button to instantly alert nearby volunteers and your emergency contacts
              </p>
              <SOSButton onTrigger={handleSOSTrigger} size="large" />
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={handlePanic}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all"
                >
                  <Vibrate className="w-4 h-4" />
                  Panic Button
                </button>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card !p-0 overflow-hidden"
            >
              <div className="p-4 border-b border-dark-700/50">
                <h3 className="font-semibold text-dark-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  Your Location
                </h3>
              </div>
              <MapView
                userLocation={userLocation}
                showRadius={true}
                radiusMeters={5000}
                compact={false}
                style={{ height: '300px', borderRadius: 0 }}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Emergency Contacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-dark-100 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Emergency Contacts
                </h3>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Edit
                </button>
              </div>
              {user?.emergencyContacts?.length > 0 ? (
                <div className="space-y-3">
                  {user.emergencyContacts.map((contact, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-800/50">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100 truncate">{contact.name}</p>
                        <p className="text-xs text-dark-400">{contact.phone}</p>
                      </div>
                      <span className="text-xs text-dark-500">{contact.relationship}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <UserPlus className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                  <p className="text-sm text-dark-500">No contacts added</p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-sm text-primary-400 mt-2 hover:text-primary-300"
                  >
                    Add contacts →
                  </button>
                </div>
              )}
            </motion.div>

            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-dark-100 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  Recent Alerts
                </h3>
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  View All
                </button>
              </div>
              {recentAlerts.length > 0 ? (
                <div className="space-y-2">
                  {recentAlerts.map((alert) => (
                    <div key={alert._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-800/50">
                      <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[alert.status]?.dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dark-200 truncate">{alert.description}</p>
                        <p className="text-xs text-dark-500">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={STATUS_CONFIG[alert.status]?.color}>
                        {STATUS_CONFIG[alert.status]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Shield className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                  <p className="text-sm text-dark-500">No alerts yet</p>
                  <p className="text-xs text-dark-600">Your safety history will appear here</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* SOS Confirmation Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-2xl p-6 w-full max-w-md"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-accent-400" />
              </div>
              <h3 className="text-xl font-bold text-dark-50">Confirm SOS Alert</h3>
              <p className="text-sm text-dark-400 mt-1">This will alert nearby volunteers and your emergency contacts</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-dark-300 mb-2 block">Emergency Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {EMERGENCY_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`text-xs p-2 rounded-lg border transition-all text-center ${
                        selectedType === type.value
                          ? 'border-accent-500/40 bg-accent-500/10 text-accent-300'
                          : 'border-dark-600/50 text-dark-400 hover:border-dark-500'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-dark-300 mb-1.5 block">
                  Details (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Describe your emergency..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSOSModal(false)}
                className="flex-1 py-3 rounded-xl border border-dark-600/50 text-dark-300 font-medium hover:bg-dark-700/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmSOS}
                disabled={triggering}
                className="flex-1 btn-accent !rounded-xl flex items-center justify-center gap-2"
              >
                {triggering ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Send SOS
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Plus, Trash2, Save,
  UserCircle, Shield, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [contacts, setContacts] = useState(user?.emergencyContacts || []);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const { data } = await authAPI.updateProfile(profileData);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      return toast.error('All contact fields are required');
    }
    setContacts(prev => [...prev, { ...newContact }]);
    setNewContact({ name: '', phone: '', relationship: '' });
    setShowAddContact(false);
  };

  const removeContact = (index) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const saveContacts = async () => {
    setSavingContacts(true);
    try {
      const { data } = await authAPI.updateEmergencyContacts({ emergencyContacts: contacts });
      updateUser({ emergencyContacts: data.emergencyContacts });
      toast.success('Emergency contacts saved');
    } catch (err) {
      toast.error('Failed to save contacts');
    } finally {
      setSavingContacts(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-50">My Profile</h1>
          <p className="text-dark-400 mt-1">Manage your profile and emergency contacts</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dark-700/50">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-50">{user?.name}</h2>
              <p className="text-sm text-dark-400">{user?.email}</p>
              <span className="badge-info mt-1 capitalize">{user?.role}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-dark-300 mb-1.5 block flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                value={profileData.name}
                onChange={(e) => setProfileData(p => ({ ...p, name: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-dark-300 mb-1.5 block flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input value={user?.email || ''} className="input-field opacity-50" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-dark-300 mb-1.5 block flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Phone
              </label>
              <input
                value={profileData.phone}
                onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))}
                className="input-field"
              />
            </div>
            <button
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="btn-primary flex items-center gap-2"
            >
              {savingProfile ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile
            </button>
          </div>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-dark-50 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              Emergency Contacts
            </h3>
            <button
              onClick={() => setShowAddContact(true)}
              className="btn-outline !py-2 !px-3 text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {contacts.length > 0 ? (
            <div className="space-y-3 mb-4">
              {contacts.map((contact, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 group">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-100">{contact.name}</p>
                    <p className="text-sm text-dark-400">{contact.phone} • {contact.relationship}</p>
                  </div>
                  <button
                    onClick={() => removeContact(i)}
                    className="p-2 text-dark-600 hover:text-accent-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-4">
              <Shield className="w-10 h-10 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No emergency contacts added yet</p>
              <p className="text-sm text-dark-500 mt-1">
                These contacts will be notified during an SOS alert
              </p>
            </div>
          )}

          {/* Add Contact Form */}
          {showAddContact && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-dark-700/50 pt-4 mt-4"
            >
              <p className="text-sm font-semibold text-primary-400 mb-3">Add New Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={newContact.name}
                  onChange={(e) => setNewContact(p => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="Name"
                />
                <input
                  value={newContact.phone}
                  onChange={(e) => setNewContact(p => ({ ...p, phone: e.target.value }))}
                  className="input-field"
                  placeholder="Phone"
                />
                <input
                  value={newContact.relationship}
                  onChange={(e) => setNewContact(p => ({ ...p, relationship: e.target.value }))}
                  className="input-field"
                  placeholder="Relationship"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowAddContact(false)} className="btn-ghost text-sm">Cancel</button>
                <button onClick={addContact} className="btn-primary text-sm !py-2">Add Contact</button>
              </div>
            </motion.div>
          )}

          <button
            onClick={saveContacts}
            disabled={savingContacts}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {savingContacts ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Contacts
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;

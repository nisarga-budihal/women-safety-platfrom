import { useState, useEffect } from 'react';
import { adminAPI, emergencyAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import MapView from '../components/common/MapView';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, Eye } from 'lucide-react';
import { STATUS_CONFIG, EMERGENCY_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';

const AdminEmergenciesPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  const loadEmergencies = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getEmergencies({ status: statusFilter, page, limit: 15 });
      setEmergencies(data.emergencies);
      setTotalPages(data.pages);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { loadEmergencies(); }, [page, statusFilter]);

  const resolveEmergency = async (id) => {
    try {
      await emergencyAPI.resolve(id);
      toast.success('Emergency resolved');
      loadEmergencies();
      setSelectedEmergency(null);
    } catch (err) {
      toast.error('Failed to resolve');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-accent-400" />
            Emergency Monitor
          </h1>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['', 'pending', 'accepted', 'in_progress', 'resolved', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-400 border border-dark-700/50 hover:border-dark-600'
              }`}
            >
              {s ? STATUS_CONFIG[s]?.label : 'All'}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700/50">
                      <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">User</th>
                      <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Type</th>
                      <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Status</th>
                      <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Time</th>
                      <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1,2,3].map(i => (
                        <tr key={i}><td colSpan={5} className="p-4"><div className="h-4 bg-dark-700 rounded animate-pulse" /></td></tr>
                      ))
                    ) : emergencies.map(em => {
                      const type = EMERGENCY_TYPES.find(t => t.value === em.emergencyType);
                      return (
                        <tr
                          key={em._id}
                          className={`border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors cursor-pointer ${
                            selectedEmergency?._id === em._id ? 'bg-dark-800/50' : ''
                          }`}
                          onClick={() => setSelectedEmergency(em)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{type?.icon || '📍'}</span>
                              <div>
                                <p className="text-sm font-medium text-dark-200">{em.userId?.name}</p>
                                <p className="text-xs text-dark-500">{em.userId?.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-dark-300 capitalize">{em.emergencyType}</td>
                          <td className="p-4"><span className={STATUS_CONFIG[em.status]?.color}>{STATUS_CONFIG[em.status]?.label}</span></td>
                          <td className="p-4 text-sm text-dark-500">{new Date(em.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {['pending', 'accepted', 'in_progress'].includes(em.status) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); resolveEmergency(em._id); }}
                                  className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  title="Resolve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost disabled:opacity-30">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-dark-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost disabled:opacity-30">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div>
            {selectedEmergency ? (
              <motion.div
                key={selectedEmergency._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card space-y-4"
              >
                <h3 className="font-semibold text-dark-100">Emergency Details</h3>
                
                {selectedEmergency.location?.coordinates && (
                  <MapView
                    userLocation={selectedEmergency.location.coordinates}
                    compact={true}
                    style={{ height: '200px' }}
                  />
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-500">User</span>
                    <span className="text-dark-200">{selectedEmergency.userId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Phone</span>
                    <span className="text-dark-200">{selectedEmergency.userId?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Type</span>
                    <span className="text-dark-200 capitalize">{selectedEmergency.emergencyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Status</span>
                    <span className={STATUS_CONFIG[selectedEmergency.status]?.color}>
                      {STATUS_CONFIG[selectedEmergency.status]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Created</span>
                    <span className="text-dark-200">{new Date(selectedEmergency.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Volunteer</span>
                    <span className="text-dark-200">{selectedEmergency.assignedVolunteer?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">Description</span>
                    <span className="text-dark-200 text-right max-w-[180px]">{selectedEmergency.description}</span>
                  </div>
                  {selectedEmergency.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Response Time</span>
                      <span className="text-emerald-400">{Math.floor(selectedEmergency.responseTime / 60)}m {selectedEmergency.responseTime % 60}s</span>
                    </div>
                  )}
                </div>

                {['pending', 'accepted', 'in_progress'].includes(selectedEmergency.status) && (
                  <button
                    onClick={() => resolveEmergency(selectedEmergency._id)}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Force Resolve
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="card text-center py-12">
                <Eye className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-500">Select an emergency to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEmergenciesPage;

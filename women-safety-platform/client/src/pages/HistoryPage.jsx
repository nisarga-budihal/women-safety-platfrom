import { useState, useEffect } from 'react';
import { emergencyAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import { History as HistoryIcon, MapPin, Clock, User, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { STATUS_CONFIG, EMERGENCY_TYPES } from '../utils/constants';

const HistoryPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const { data } = await emergencyAPI.getHistory(page);
        setEmergencies(data.emergencies);
        setTotalPages(data.pages);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [page]);

  const filtered = filter === 'all'
    ? emergencies
    : emergencies.filter(e => e.status === filter);

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-50 flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-primary-400" />
            Emergency History
          </h1>
          <p className="text-dark-400 mt-1">Your past emergency alerts and their outcomes</p>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'accepted', 'resolved', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-400 border border-dark-700/50 hover:border-dark-600'
              }`}
            >
              {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Emergency List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-dark-700 rounded w-1/3 mb-3" />
                <div className="h-3 bg-dark-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-dark-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((emergency, i) => {
              const type = EMERGENCY_TYPES.find(t => t.value === emergency.emergencyType);
              const status = STATUS_CONFIG[emergency.status];
              return (
                <motion.div
                  key={emergency._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type?.icon || '📍'}</span>
                      <div>
                        <h3 className="font-semibold text-dark-100">{emergency.description}</h3>
                        <p className="text-xs text-dark-500">
                          {type?.label || emergency.emergencyType}
                        </p>
                      </div>
                    </div>
                    <span className={status?.color}>{status?.label}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-dark-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(emergency.createdAt).toLocaleString()}
                    </span>
                    {emergency.assignedVolunteer && (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {emergency.assignedVolunteer.name || 'Volunteer'}
                      </span>
                    )}
                    {emergency.responseTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {Math.floor(emergency.responseTime / 60)}m {emergency.responseTime % 60}s response
                      </span>
                    )}
                    {emergency.location?.coordinates && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {emergency.location.coordinates[1].toFixed(4)}, {emergency.location.coordinates[0].toFixed(4)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-16">
            <HistoryIcon className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 font-medium">No emergency records found</p>
            <p className="text-sm text-dark-500 mt-1">Your emergency history will be shown here</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-dark-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-ghost disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;

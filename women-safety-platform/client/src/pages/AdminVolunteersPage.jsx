import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import { Heart, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { VERIFICATION_STATUS } from '../utils/constants';
import toast from 'react-hot-toast';

const AdminVolunteersPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getVolunteers(statusFilter);
      setVolunteers(data.volunteers);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { loadVolunteers(); }, [statusFilter]);

  const verifyVolunteer = async (id, status, reason) => {
    try {
      await adminAPI.verifyVolunteer(id, { status, rejectionReason: reason });
      toast.success(`Volunteer ${status}`);
      setRejectingId(null);
      setRejectReason('');
      loadVolunteers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-3">
            <Heart className="w-7 h-7 text-accent-400" />
            Volunteer Verification
          </h1>
        </motion.div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {['', 'pending', 'verified', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-400 border border-dark-700/50 hover:border-dark-600'
              }`}
            >
              {s ? VERIFICATION_STATUS[s]?.label : 'All'}
            </button>
          ))}
        </div>

        {/* Volunteer Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="card animate-pulse h-32" />)}
          </div>
        ) : volunteers.length > 0 ? (
          <div className="space-y-4">
            {volunteers.map((vol) => (
              <motion.div
                key={vol._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-lg font-bold text-primary-400">
                      {vol.userId?.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-100">{vol.userId?.name}</h3>
                      <p className="text-sm text-dark-400">{vol.userId?.email} • {vol.userId?.phone}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {vol.idVerification?.documentType}: {vol.idVerification?.documentNumber}
                        </span>
                        <span>Responses: {vol.responseCount}</span>
                        {vol.specializations?.length > 0 && (
                          <span>{vol.specializations.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={VERIFICATION_STATUS[vol.idVerification?.status]?.color}>
                      {VERIFICATION_STATUS[vol.idVerification?.status]?.label}
                    </span>
                    
                    {vol.idVerification?.status === 'pending' && (
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => verifyVolunteer(vol._id, 'verified')}
                          className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setRejectingId(vol._id)}
                          className="p-2 rounded-lg bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-all"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection form */}
                {rejectingId === vol._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-dark-700/50"
                  >
                    <input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="input-field mb-2"
                      placeholder="Reason for rejection..."
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setRejectingId(null)} className="btn-ghost text-sm">Cancel</button>
                      <button
                        onClick={() => verifyVolunteer(vol._id, 'rejected', rejectReason)}
                        className="btn-accent text-sm !py-2"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </motion.div>
                )}

                {vol.idVerification?.rejectionReason && vol.idVerification?.status === 'rejected' && (
                  <div className="mt-3 p-2 rounded-lg bg-accent-500/5 border border-accent-500/10 text-xs text-accent-400">
                    Rejection reason: {vol.idVerification.rejectionReason}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Heart className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No volunteers found for this filter</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminVolunteersPage;

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import { Users, Search, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ search, role: roleFilter, page, limit: 15 });
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, [page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const toggleUser = async (userId) => {
    try {
      const { data } = await adminAPI.toggleUserStatus(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: data.user.isActive } : u));
      toast.success(`User ${data.user.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-400" />
            User Management
          </h1>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-11"
              placeholder="Search by name, email, or phone..."
            />
          </form>
          <div className="flex gap-2">
            {['', 'user', 'volunteer', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => { setRoleFilter(role); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  roleFilter === role
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-400 border border-dark-700/50 hover:border-dark-600'
                }`}
              >
                {role || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Name</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Email</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Phone</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Role</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i}><td colSpan={6} className="p-4"><div className="h-4 bg-dark-700 rounded animate-pulse" /></td></tr>
                  ))
                ) : users.map(u => (
                  <tr key={u._id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500/15 flex items-center justify-center text-primary-400 text-xs font-bold">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-dark-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-dark-400">{u.email}</td>
                    <td className="p-4 text-sm text-dark-400">{u.phone}</td>
                    <td className="p-4"><span className="badge-info capitalize">{u.role}</span></td>
                    <td className="p-4">
                      <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleUser(u._id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            u.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-dark-500 hover:bg-dark-700'
                          }`}
                        >
                          {u.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost disabled:opacity-30">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-dark-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost disabled:opacity-30">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsersPage;

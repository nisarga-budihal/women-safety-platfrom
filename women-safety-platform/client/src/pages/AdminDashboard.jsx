import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import StatCard from '../components/common/StatCard';
import { motion } from 'framer-motion';
import {
  Users, Shield, AlertTriangle, Clock, Activity,
  TrendingUp, CheckCircle, XCircle, Wifi
} from 'lucide-react';
import { STATUS_CONFIG } from '../utils/constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#7C3AED', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6'];

const AdminDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data } = await adminAPI.getDashboard();
        setDashData(data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
      setLoading(false);
    };
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card animate-pulse h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = dashData?.stats || {};
  const pieData = dashData?.typeDistribution?.map(d => ({
    name: d._id || 'other',
    value: d.count
  })) || [];

  const trendData = dashData?.dailyTrend?.map(d => ({
    date: d._id.slice(5),
    alerts: d.count
  })) || [];

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-50">Admin Dashboard</h1>
          <p className="text-dark-400 mt-1">System overview and emergency monitoring</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers || 0} color="primary" delay={0} />
          <StatCard icon={Shield} label="Verified Volunteers" value={stats.verifiedVolunteers || 0} color="emerald" delay={1} />
          <StatCard icon={AlertTriangle} label="Active Emergencies" value={stats.activeEmergencies || 0} color="accent" delay={2} />
          <StatCard icon={Clock} label="Avg Response" value={`${stats.avgResponseTime || 0}s`} color="amber" delay={3} />
          <StatCard icon={Wifi} label="Online Volunteers" value={stats.onlineVolunteers || 0} color="blue" delay={4} />
        </div>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-black text-emerald-400">{stats.resolvedEmergencies || 0}</p>
            <p className="text-sm text-dark-400 mt-1">Resolved</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-black text-amber-400">{stats.pendingVerifications || 0}</p>
            <p className="text-sm text-dark-400 mt-1">Pending Verifications</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-black text-dark-200">{stats.totalEmergencies || 0}</p>
            <p className="text-sm text-dark-400 mt-1">Total Emergencies</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-black text-accent-400">{stats.cancelledEmergencies || 0}</p>
            <p className="text-sm text-dark-400 mt-1">Cancelled</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-400" />
              Emergency Trend (7 Days)
            </h3>
            <div className="h-64">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#E2E8F0'
                      }}
                    />
                    <Area type="monotone" dataKey="alerts" stroke="#7C3AED" fillOpacity={1} fill="url(#colorAlerts)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-500">No trend data yet</div>
              )}
            </div>
          </motion.div>

          {/* Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-400" />
              Emergency Types
            </h3>
            <div className="h-64">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#E2E8F0'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-500">No data yet</div>
              )}
            </div>
            {pieData.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-dark-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Emergencies Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card overflow-hidden !p-0"
        >
          <div className="p-5 border-b border-dark-700/50">
            <h3 className="font-semibold text-dark-100">Recent Emergencies</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">User</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Volunteer</th>
                  <th className="text-left p-4 text-xs font-semibold text-dark-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {dashData?.recentEmergencies?.map((em) => (
                  <tr key={em._id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-500/15 flex items-center justify-center text-primary-400 text-xs font-bold">
                          {em.userId?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-dark-200">{em.userId?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-dark-300 capitalize">{em.emergencyType}</td>
                    <td className="p-4">
                      <span className={STATUS_CONFIG[em.status]?.color}>
                        {STATUS_CONFIG[em.status]?.label}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-dark-400">{em.assignedVolunteer?.name || '—'}</td>
                    <td className="p-4 text-sm text-dark-500">
                      {new Date(em.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {(!dashData?.recentEmergencies || dashData.recentEmergencies.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-dark-500">No emergencies recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;

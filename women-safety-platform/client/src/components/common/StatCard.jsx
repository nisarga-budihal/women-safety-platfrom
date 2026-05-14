import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, change, trend, color = 'primary', delay = 0 }) => {
  const colorMap = {
    primary: {
      bg: 'from-primary-500/20 to-primary-600/10',
      icon: 'text-primary-400',
      border: 'border-primary-500/20',
      shadow: 'shadow-primary-500/5'
    },
    accent: {
      bg: 'from-accent-500/20 to-accent-600/10',
      icon: 'text-accent-400',
      border: 'border-accent-500/20',
      shadow: 'shadow-accent-500/5'
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-600/10',
      icon: 'text-emerald-400',
      border: 'border-emerald-500/20',
      shadow: 'shadow-emerald-500/5'
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-600/10',
      icon: 'text-amber-400',
      border: 'border-amber-500/20',
      shadow: 'shadow-amber-500/5'
    },
    blue: {
      bg: 'from-blue-500/20 to-blue-600/10',
      icon: 'text-blue-400',
      border: 'border-blue-500/20',
      shadow: 'shadow-blue-500/5'
    }
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={`glass rounded-2xl p-5 border ${c.border} hover:${c.shadow} hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend === 'up'
              ? 'bg-emerald-500/15 text-emerald-400'
              : trend === 'down'
              ? 'bg-accent-500/15 text-accent-400'
              : 'bg-dark-600/50 text-dark-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-dark-50">{value}</p>
        <p className="text-sm text-dark-400 mt-1">{label}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;

import { motion } from 'framer-motion';

const SOSButton = ({ onTrigger, disabled = false, size = 'large' }) => {
  const sizeClasses = {
    small: 'w-20 h-20 text-lg',
    medium: 'w-32 h-32 text-2xl',
    large: 'w-44 h-44 text-3xl'
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <div className={`absolute rounded-full bg-accent-500/10 animate-sos-ring ${
        size === 'large' ? 'w-44 h-44' : size === 'medium' ? 'w-32 h-32' : 'w-20 h-20'
      }`} />
      <div className={`absolute rounded-full bg-accent-500/10 animate-sos-ring-delay ${
        size === 'large' ? 'w-44 h-44' : size === 'medium' ? 'w-32 h-32' : 'w-20 h-20'
      }`} />

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onTrigger}
        disabled={disabled}
        className={`
          sos-button relative z-10 rounded-full
          bg-gradient-to-br from-accent-500 via-accent-600 to-red-700
          text-white font-black tracking-wider
          shadow-2xl shadow-accent-500/40
          hover:shadow-accent-500/60
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          flex flex-col items-center justify-center gap-1
          ${sizeClasses[size]}
        `}
        style={{
          animation: disabled ? 'none' : 'sos-glow 2s ease-in-out infinite'
        }}
      >
        <span className="text-inherit font-black">SOS</span>
        {size !== 'small' && (
          <span className="text-xs font-medium opacity-80 tracking-normal">
            TAP FOR HELP
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default SOSButton;

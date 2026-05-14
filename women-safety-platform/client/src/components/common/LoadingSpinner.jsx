import { Shield } from 'lucide-react';

const LoadingSpinner = ({ fullScreen = false, text = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="w-16 h-16 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
            <Shield className="absolute inset-0 m-auto w-6 h-6 text-primary-400" />
          </div>
          <p className="mt-4 text-dark-300 text-sm font-medium">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="w-10 h-10 rounded-full border-3 border-primary-500/20 border-t-primary-500 animate-spin" />
        </div>
        <p className="mt-3 text-dark-400 text-sm">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

import { AlertTriangle, X } from 'lucide-react';

interface Props {
  title?: string;
  message: string;
  onClose: () => void;
}

export default function ValidationModal({ title = 'Invalid Input', message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <button
            onClick={onClose}
            className="text-dark/30 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pt-3 pb-2">
          <h3 className="font-display text-lg font-bold text-navy mb-1.5">{title}</h3>
          <p className="text-sm text-dark/65 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-6 pt-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  title,
  description,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={!loading ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-dark">{title}</h2>
              <p className="text-sm text-dark/55 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-dark/30 hover:text-dark/60 transition-colors flex-shrink-0 ml-2 mt-0.5 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-6 mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Trash2 size={15} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle, Loader2, X } from "lucide-react";
import type { JSX } from "react";

interface ReasonConfirmNotificationProps {
  isOpen: boolean;
  title: string;
  message: string;
  reason: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const ReasonConfirmNotification = ({
  isOpen,
  title,
  message,
  reason,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason...",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isProcessing = false,
  onReasonChange,
  onConfirm,
  onClose,
}: ReasonConfirmNotificationProps): JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[500px] max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="relative p-6">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div className="p-3 rounded-full flex-shrink-0 bg-red-100 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {reasonLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={reasonPlaceholder}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing || !reason.trim()}
              className="flex items-center gap-2 px-6 py-2 text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm bg-red-600 hover:bg-red-700"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

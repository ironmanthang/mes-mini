import { AlertTriangle, X } from "lucide-react";
import type { JSX } from "react";

interface WarningNotificationProps {
  isVisible: boolean;
  message?: string;
  onClose: () => void;
}

export const WarningNotification = ({
  isVisible,
  message = "Lưu ý: Có vấn đề cần kiểm tra lại!",
  onClose,
}: WarningNotificationProps): JSX.Element | null => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-4 pl-4 pr-12 flex items-center gap-4 min-w-[320px] max-w-md relative">
        
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="bg-[#FF9800] rounded flex items-center justify-center w-6 h-6 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-white stroke-[3]" />
          </div>
        </div>
        
        <span className="text-gray-800 font-medium text-base leading-snug">
          {message}
        </span>

        <button 
          onClick={onClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          title="Đóng thông báo"
        >
          <X className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
};
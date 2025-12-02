import { Check } from "lucide-react";
import type { JSX } from "react";

interface SuccessNotificationProps {
  isVisible: boolean;
  message?: string;
}

export const SuccessNotification = ({
  isVisible,
  message = "Changes applied successfully!",
}: SuccessNotificationProps): JSX.Element | null => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-4 min-w-[300px]">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="bg-[#00C853] rounded flex items-center justify-center w-6 h-6 shadow-sm">
            <Check className="w-4 h-4 text-white stroke-[3]" />
          </div>
        </div>
        
        <span className="text-gray-800 font-medium text-base">
          {message}
        </span>
      </div>
    </div>
  );
};
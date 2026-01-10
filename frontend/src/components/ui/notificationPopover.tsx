import { 
  Check, 
  Clock, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  BellRing 
} from "lucide-react";
import type { JSX } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  read: boolean;
}

interface NotificationsPopoverProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

export const NotificationsPopover = ({ 
  notifications, 
  onMarkAllRead, 
  onDismiss,
  onClose
}: NotificationsPopoverProps): JSX.Element => {
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'alert': return "bg-red-50";
      case 'success': return "bg-green-50";
      default: return "bg-blue-50";
    }
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-[380px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 origin-top-right overflow-hidden">
      
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={onMarkAllRead}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map((item) => (
              <div 
                key={item.id} 
                className={`relative group p-4 hover:bg-gray-50 transition-colors ${!item.read ? 'bg-blue-50/30' : 'bg-white'}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getBgColor(item.type)}`}>
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!item.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
                    className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {!item.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <BellRing className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
        <button 
          onClick={onClose}
          className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors w-full py-1"
        >
          View all history
        </button>
      </div>
    </div>
  );
};
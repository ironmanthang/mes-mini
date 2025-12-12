import { BellIcon } from "lucide-react";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { authService } from "../../services/authServices";

import { NotificationsPopover, type NotificationItem } from "./notificationPopover";

interface Props {
  onNavigate: (pageName: string) => void;
}

interface UserProfile {
  employeeId: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  status: string;
  roles: { roleId: number; roleName: string }[];
}

const initialNotifications: NotificationItem[] = [
  { 
    id: "1", 
    title: "Low Stock Alert", 
    message: "CPU Chipset A1 is below minimum stock level (150 units).", 
    time: "2 min ago", 
    type: "alert", 
    read: false 
  },
  { 
    id: "2", 
    title: "Production Completed", 
    message: "Batch PB-2024-001 has been successfully moved to Finished Goods.", 
    time: "1 hour ago", 
    type: "success", 
    read: false 
  },
  { 
    id: "3", 
    title: "System Update", 
    message: "Scheduled maintenance will occur tonight at 02:00 AM.", 
    time: "5 hours ago", 
    type: "info", 
    read: true 
  },
];

export const Header = ({onNavigate}: Props): JSX.Element => {
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [userData, setUserData] = useState<UserProfile | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const data = await authService.getMe();
        if (isMounted && data) {
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile: ", error);
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    }
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getUserRole = () => {
    if (userData?.roles && userData.roles.length > 0) {
      return userData.roles[0].roleName;
    }
    return "";
  }

  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-end px-6 gap-4 bg-white relative z-20">
      
      <div className="relative">
        <button 
          onClick={() => setIsNotiOpen(!isNotiOpen)}
          className={`relative p-2 rounded-full transition-colors ${isNotiOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {isNotiOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 cursor-default" 
              onClick={() => setIsNotiOpen(false)}
            ></div>
            
            <NotificationsPopover 
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onDismiss={handleDismiss}
              onClose={() => setIsNotiOpen(false)}
            />
          </>
        )}
      </div>

      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
        onClick={() => onNavigate && onNavigate("User & System")}
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
          <span className="text-blue-600 text-xs font-bold">L</span>
        </div>
        <div className="hidden md:block text-left">
           <p className="text-sm font-bold text-gray-800 leading-none">{userData?.fullName || "Unknown"}</p>
           <p className="text-[10px] text-gray-500 font-medium">{getUserRole()}</p>
        </div>
      </div>
    </header>
  );
};
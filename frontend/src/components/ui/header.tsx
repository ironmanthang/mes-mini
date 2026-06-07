import type { JSX } from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authServices";

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

export const Header = (): JSX.Element => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserProfile | null>(null);

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
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const getUserRole = () => {
    if (userData?.roles && userData.roles.length > 0) {
      return userData.roles[0].roleName;
    }
    return "";
  };

  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-end px-6 gap-4 bg-white relative z-20">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
        onClick={() => navigate("/settings")}
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

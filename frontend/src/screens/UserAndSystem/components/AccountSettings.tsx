import { User, Mail, Phone, MapPin, Calendar, Shield, Upload, Camera, LogOut, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../services/authServices";
import { useState, useEffect, useCallback } from "react";
import { UpdateProfileModal } from "./UpdateProfileModel";
import { ChangePasswordModal } from "./ChangePasswordModel";

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

export const AccountSettings = (): JSX.Element => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateSuccess = () => {
    setIsLoading(true);
    fetchProfile();
  };

  if (isLoading && !userData) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) return <div>No user data found.</div>;

  const roleName = userData.roles && userData.roles.length > 0 ? userData.roles[0].roleName : "N/A";
  const avatarUrl = `https://i.pravatar.cc/150?u=${userData.employeeId}`;
  const formattedDate = userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('vi-VN') : "N/A";

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
            <img 
              src={avatarUrl} 
              alt={userData.fullName} 
              className="w-full h-full object-cover"
            />
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">{userData.fullName}</h2>
          <p className="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2">
            <Shield className="w-4 h-4" />
            {roleName}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
              ID: {userData.employeeId}
            </span>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200 uppercase">
              {userData.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Personal Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Username
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userData.username}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> Email Address
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userData.email}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> Phone Number
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userData.phoneNumber || "Not provided"}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" /> Role
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {roleName}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" /> Date of Birth
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {formattedDate}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Address
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userData.address || "Not provided"}
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
          
          <button 
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-50 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
             <LogOut className="w-4 h-4" /> Log Out
          </button>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              Change Password
            </button>
            <button 
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4" /> Update Profile
            </button>
          </div>
        </div>
      </div>
      <UpdateProfileModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        currentUser={userData}
        onSuccess={handleUpdateSuccess}
      />
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
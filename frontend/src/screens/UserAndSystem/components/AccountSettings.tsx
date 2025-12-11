import { User, Mail, Phone, MapPin, Calendar, Shield, Upload, Camera } from "lucide-react";
import type { JSX } from "react";

export const AccountSettings = (): JSX.Element => {
  const userProfile = {
    id: "EMP0010",
    fullName: "Phan Phuc Lam",
    email: "tranvana@prodopsx.com",
    phone: "0123456789",
    role: "Component Manager",
    date: "01/01/2000",
    address: "Thu Duc, TP. Ho Chi Minh",
    avatarUrl: "https://i.pravatar.cc/150?u=EMP0010"
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img 
              src={userProfile.avatarUrl} 
              alt={userProfile.fullName} 
              className="w-full h-full object-cover"
            />
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">{userProfile.fullName}</h2>
          <p className="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2">
            <Shield className="w-4 h-4" />
            {userProfile.role}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
              ID: {userProfile.id}
            </span>
            <span className="px-3 py-1 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-200 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Joined {userProfile.date}
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
                <User className="w-4 h-4 text-gray-400" /> Full Name
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userProfile.fullName}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> Email Address
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userProfile.email}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> Phone Number
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userProfile.phone}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" /> Role & Permissions
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userProfile.role}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" /> Date of Birth / Joined
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userProfile.date}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Address
              </label>
              <div className="w-full bg-gray-50 rounded-lg p-3.5 text-sm text-gray-800 border border-gray-200">
                {userProfile.address}
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
          <button className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
             Change Password
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
            <Upload className="w-4 h-4" /> Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};
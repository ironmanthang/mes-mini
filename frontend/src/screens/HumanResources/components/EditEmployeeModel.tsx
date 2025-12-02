import { X } from "lucide-react";
import type { JSX } from "react";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: any;
  onConfirm: () => void;
}

export const EditEmployeeModal = ({ isOpen, onClose, userData, onConfirm }: EditEmployeeModalProps): JSX.Element | null => {
  if (!isOpen || !userData) return null;

  const handleEdit = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[600px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">EDIT EMPLOYEE INFORMATION</h2>
          <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">ID<span className="text-red-500">*</span></label>
              <input type="text" defaultValue={userData.employeeId} disabled className="w-full bg-gray-50 border-none rounded p-3 text-sm text-gray-500 cursor-not-allowed outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">Full Name</label>
              <input type="text" defaultValue={userData.name} className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">Username</label>
              <input type="text" defaultValue={userData.username} className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">Role<span className="text-red-500">*</span></label>
              <input type="text" defaultValue={userData.role} className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">Date</label>
              <input type="date" defaultValue={userData.date} className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none text-gray-600" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">Phone Number</label>
              <input type="text" defaultValue={userData.phone} className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-800">Address</label>
              <textarea rows={4} defaultValue={userData.address} className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none resize-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pb-8">
          <button onClick={onClose} className="px-8 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors cursor-pointer">CANCEL</button>
          <button onClick={handleEdit} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-500 transition-colors flex items-center gap-1 cursor-pointer">EDIT</button>
        </div>
      </div>
    </div>
  );
};
import { X } from "lucide-react";
import type { JSX } from "react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AddUserModal = ({ isOpen, onClose, onConfirm }: AddUserModalProps): JSX.Element | null => {
  if (!isOpen) return null;

  const handleAdd = () => {
    onConfirm(); 
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[500px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">ADD USER INFORMATION</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">
              ID<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập ID..."
              className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">Full Name</label>
            <input
              type="text"
              disabled
              placeholder="Tự hiển thị theo ID"
              className="w-full bg-gray-50 border-none rounded p-3 text-sm text-gray-500 cursor-not-allowed outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">Username</label>
            <input
              type="text"
              disabled
              placeholder="Tự hiển thị theo ID"
              className="w-full bg-gray-50 border-none rounded p-3 text-sm text-gray-500 cursor-not-allowed outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">
              Role<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập role ..."
              className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button 
            onClick={handleAdd}
            className="px-8 py-2.5 bg-[#2EE59D] text-white text-sm font-semibold rounded hover:bg-[#25D390] transition-colors flex items-center gap-1 cursor-pointer">
              ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
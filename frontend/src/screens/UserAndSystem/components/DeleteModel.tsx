// src/pages/UserAndSystem/components/DeleteConfirmModal.tsx

import { X } from "lucide-react";
import type { JSX } from "react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps): JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[450px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Do you want to delete?
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center text-sm text-gray-600">
          User account and all associated data will be permanently removed.
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 pb-6">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors cursor-pointer"
          >
            CANCEL
          </button>

          <button
            onClick={onConfirm}
            className="px-8 py-2.5 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-500 transition-colors cursor-pointer flex items-center gap-1"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
};

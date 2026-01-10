import { X, Loader2, AlertTriangle } from "lucide-react";
import type { JSX } from "react";
import { employeeService } from "../../../services/employeeServices";
import { useState } from "react";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeId: number | null;
}

export const DeleteEmployeeModal = ({
  isOpen,
  onClose,
  onConfirm,
  employeeId,
}: DeleteEmployeeModalProps): JSX.Element | null => {
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!employeeId) return;

    setIsLoading(true);
    setError(null);

    try {
      await employeeService.deleteEmployee(employeeId);
      
      onConfirm();
      onClose();

    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete employee. They may have related records.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[450px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="relative p-6 text-center border-b border-gray-100">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Confirm Deletion
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center text-sm text-gray-600">
          <p className="mb-2">
            Are you sure you want to delete employee ID: <span className="font-bold text-gray-900">{employeeId}</span>?
          </p>
          <p>
            User account and all associated data will be permanently removed. This action cannot be undone.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs text-left border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            CANCEL
          </button>

          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-8 py-2.5 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-500 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                DELETING...
              </>
            ) : (
              "DELETE"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

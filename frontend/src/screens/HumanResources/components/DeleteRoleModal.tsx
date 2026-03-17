import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState, type JSX } from "react";
import { roleService } from "../../../services/roleServices";

interface DeleteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: number | null;
  roleName: string;
  onSuccess: () => void;
}

export const DeleteRoleModal = ({ isOpen, onClose, roleId, roleName, onSuccess }: DeleteRoleModalProps): JSX.Element | null => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!roleId) return;

    setIsDeleting(true);
    try {
      await roleService.deleteRole(roleId);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      alert(error?.response?.data?.message || "Cannot delete this role. It might be assigned to users.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !roleId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="bg-white w-[450px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-5 flex justify-between items-start border-b border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-50 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Role</h2>
            </div>
            <button 
                onClick={onClose} 
                disabled={isDeleting}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this role? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="font-bold text-gray-900 text-base">{roleName}</span>
                <span className="block text-xs text-gray-500 mt-1 font-mono">ID: {roleId}</span>
            </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button 
                onClick={onClose} 
                disabled={isDeleting}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            >
                Cancel
            </button>
            <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Deleting..." : "Delete Role"}
            </button>
        </div>
      </div>
    </div>
  );
};
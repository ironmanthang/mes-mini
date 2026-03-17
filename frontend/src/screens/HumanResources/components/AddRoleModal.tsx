import { X, Save, Shield, Loader2 } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { roleService } from "../../../services/roleServices";

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRoleModal = ({ isOpen, onClose, onSuccess }: AddRoleModalProps): JSX.Element | null => {
  const [roleName, setRoleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRoleName("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      return alert("Role Name is required.");
    }

    setIsSubmitting(true);
    try {
      await roleService.createRole({ roleName: roleName.trim() });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to create role:", error);
      alert(error?.response?.data?.message || "Error creating role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="bg-white w-[450px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" /> Add New Role
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Role Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. Quality Inspector"
              value={roleName} 
              onChange={e => setRoleName(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
            {isSubmitting ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
};
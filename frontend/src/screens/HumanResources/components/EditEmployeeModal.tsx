import { X, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { employeeService, type UpdateEmployeeRequest } from "../../../services/employeeServices";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: any;
  onConfirm: () => void;
}

export const EditEmployeeModal = ({ isOpen, onClose, userData, onConfirm }: EditEmployeeModalProps): JSX.Element | null => {
  const [formData, setFormData] = useState<UpdateEmployeeRequest>({
    fullName: "",
    username: "",
    phoneNumber: "",
    address: "",
    hireDate: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        fullName: userData.name || "",
        username: userData.username || "",
        phoneNumber: userData.phone || "",
        address: userData.address || "",
        hireDate: userData.date ? new Date(userData.date).toISOString().split('T')[0] : "",
      });
      setError(null);
    }
  }, [isOpen, userData]);

  if (!isOpen || !userData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await employeeService.updateEmployee(userData.employeeId, formData);
      
      onConfirm();
      onClose();

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update employee.");
    } finally {
      setIsLoading(false);
    }
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

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">ID<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={userData.employeeId} 
                  disabled 
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm text-gray-500 cursor-not-allowed outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Full Name</label>
                <input 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Username</label>
                <input 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Role</label>
                <input 
                  type="text" 
                  defaultValue={userData.role || (userData.roles && userData.roles[0]?.roleName)} 
                  disabled
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm text-gray-500 cursor-not-allowed outline-none" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Hire Date</label>
                <input 
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  type="date" 
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none text-gray-600" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Phone Number</label>
                <input 
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Address</label>
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={4} 
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none resize-none" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pb-8">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="px-8 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            CANCEL
          </button>
          <button 
            onClick={handleEdit} 
            disabled={isLoading}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-500 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </div>
    </div>
  );
};
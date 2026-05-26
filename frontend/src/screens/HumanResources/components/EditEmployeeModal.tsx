import { X, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { employeeService, type Employee, type UpdateEmployeeRequest } from "../../../services/employeeServices";
import { roleService, type Role } from "../../../services/roleServices";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: Employee | null;
  onConfirm: () => void;
  currentAdminId?: number;
}

export const EditEmployeeModal = ({ isOpen, onClose, userData, onConfirm, currentAdminId }: EditEmployeeModalProps): JSX.Element | null => {
  const [formData, setFormData] = useState<UpdateEmployeeRequest>({
    fullName: "",
    phoneNumber: "",
    province: "",
    ward: "",
    street: "",
    dateOfBirth: "",
    hireDate: "",
    terminationDate: null,
    status: "ACTIVE",
    roleIds: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      roleService.getAllRoles().then(data => setRoles(data));
      fetch("https://provinces.open-api.vn/api/p/")
        .then(res => res.json())
        .then(data => setProvinces(data))
        .catch(() => console.error("Unable to load the province list."));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        fullName: userData.fullName || "",
        phoneNumber: userData.phoneNumber || "",
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : "",
        hireDate: userData.hireDate ? new Date(userData.hireDate).toISOString().split('T')[0] : "",
        terminationDate: userData.terminationDate ? new Date(userData.terminationDate).toISOString().split('T')[0] : null,
        status: userData.status,
        roleIds: userData.roles.map(r => r.roleId),
        province: "", 
        ward: "",
        street: ""
      });
      setError(null);
    }
  }, [isOpen, userData]);

  const handleProvinceChange = async (provinceCode: string) => {
    const province = provinces.find(p => p.code === parseInt(provinceCode));
    setFormData(prev => ({ ...prev, province: province?.name || "", ward: "" }));
    
    if (provinceCode) {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await res.json();
        setDistricts(data.districts || []);
      } catch (err) {
        console.error(err);
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  };

  const handleEdit = async () => {
    if (!userData) return;
    setIsLoading(true);
    setError(null);

    try {
      const finalPayload: UpdateEmployeeRequest = { ...formData };

      if (!finalPayload.province && userData.address) {
        const addressParts = userData.address.split(",").map(p => p.trim());
        if (addressParts.length >= 3) {
          finalPayload.street = addressParts.slice(0, addressParts.length - 2).join(", ");
          finalPayload.ward = addressParts[addressParts.length - 2];
          finalPayload.province = addressParts[addressParts.length - 1];
        } else {
          finalPayload.street = userData.address;
          finalPayload.ward = "";
          finalPayload.province = "";
        }
      }

      if (finalPayload.dateOfBirth) finalPayload.dateOfBirth = new Date(finalPayload.dateOfBirth).toISOString();
      if (finalPayload.hireDate) finalPayload.hireDate = new Date(finalPayload.hireDate).toISOString();
      if (finalPayload.terminationDate) finalPayload.terminationDate = new Date(finalPayload.terminationDate).toISOString();

      await employeeService.updateEmployee(userData.employeeId, finalPayload);
      
      onConfirm();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "An error occurred while updating the employee information.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditingSelf = userData?.employeeId === currentAdminId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Employee Profile</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {userData?.employeeId} / Username: {userData?.username}</p>
          </div>
          <button onClick={onClose} className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div className="space-y-2 text-gray-400">
              <label className="text-sm font-semibold">Email (Read-only)</label>
              <input
                type="text"
                value={userData?.email || ""}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                disabled={isEditingSelf}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              {isEditingSelf && (
                 <p className="text-[10px] text-red-500 font-bold tracking-tight">Security Guard: You cannot change your own status.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Hire Date</label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Structured address */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
               <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Update Address</h3>
               <p className="text-[11px] text-gray-400 mt-0.5">Current: {userData?.address || "Not updated"}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm font-medium bg-white"
              >
                <option value="">-- Change Province/City --</option>
                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>

              <select 
                onChange={(e) => setFormData({ ...formData, ward: districts.find(d => d.code === parseInt(e.target.value))?.name || "" })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm font-medium bg-white"
                disabled={districts.length === 0}
              >
                <option value="">-- Select District/Ward --</option>
                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
            </div>
            <input
              type="text"
              placeholder="Enter house number, street name, alley, or detailed address..."
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm font-medium"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-50">
            <label className="text-sm font-semibold text-gray-700 block">Assign Roles</label>
            <div className="flex flex-wrap gap-3">
              {roles.map((role) => (
                <label key={role.roleId} className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all active:scale-95 select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-0 cursor-pointer"
                    checked={formData.roleIds?.includes(role.roleId)}
                    onChange={(e) => {
                      const currentIds = formData.roleIds || [];
                      const newRoleIds = e.target.checked
                        ? [...currentIds, role.roleId]
                        : currentIds.filter(id => id !== role.roleId);
                      setFormData({ ...formData, roleIds: newRoleIds });
                    }}
                  />
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-gray-800">{role.roleName}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 cursor-pointer text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            CANCEL
          </button>
          <button 
            onClick={handleEdit}
            disabled={isLoading}
            className="px-8 py-2 cursor-pointer bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-md transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "SAVE CHANGES"}
          </button>
        </div>
      </div>
    </div>
  );
};

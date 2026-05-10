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
}

export const EditEmployeeModal = ({ isOpen, onClose, userData, onConfirm }: EditEmployeeModalProps): JSX.Element | null => {
  // CẬP NHẬT: State formData khớp với UpdateEmployeeRequest mới
  const [formData, setFormData] = useState<UpdateEmployeeRequest>({
    fullName: "",
    phoneNumber: "",
    province: "",
    ward: "",
    street: "",
    dateOfBirth: "",
    hireDate: "",
    status: "ACTIVE",
    roleIds: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  // Load danh sách roles và tỉnh thành khi mở modal
  useEffect(() => {
    if (isOpen) {
      roleService.getAllRoles().then(data => setRoles(data));
      fetch("https://provinces.open-api.vn/api/p/")
        .then(res => res.json())
        .then(data => setProvinces(data));
    }
  }, [isOpen]);

  // CẬP NHẬT: Map dữ liệu từ userData sang formData
  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        fullName: userData.fullName || "",
        phoneNumber: userData.phoneNumber || "",
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : "",
        hireDate: userData.hireDate ? new Date(userData.hireDate).toISOString().split('T')[0] : "",
        status: userData.status,
        roleIds: userData.roles.map(r => r.roleId),
        // Địa chỉ ban đầu từ backend là chuỗi gộp, người dùng sẽ chọn lại nếu cần update
        province: "", 
        ward: "",
        street: ""
      });
    }
  }, [isOpen, userData]);

  const handleProvinceChange = async (provinceCode: string) => {
    const province = provinces.find(p => p.code === parseInt(provinceCode));
    setFormData(prev => ({ ...prev, province: province?.name || "", ward: "" }));
    
    if (provinceCode) {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts || []);
    } else {
      setDistricts([]);
    }
  };

  const handleEdit = async () => {
    if (!userData) return;
    setIsLoading(true);
    setError(null);
    try {
      // Gọi API update với ID và dữ liệu đã thay đổi
      await employeeService.updateEmployee(userData.employeeId, formData);
      onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update employee");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Edit Employee Profile</h2>
          <button onClick={onClose} className="p-2 cursor-pointer
          hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 text-gray-400">
              <label className="text-sm font-semibold">Email (Read-only)</label>
              <input
                type="text"
                value={userData?.email || ""}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Update Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
              >
                <option value="">-- Select Province --</option>
                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>

              <select 
                onChange={(e) => setFormData({ ...formData, ward: districts.find(d => d.code === parseInt(e.target.value))?.name || "" })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
              >
                <option value="">-- Select District/Ward --</option>
                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
            </div>
            <input
              type="text"
              placeholder="Update street, building, house number..."
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
            />
          </div>

          {/* Roles Management */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Assign Roles</label>
            <div className="flex flex-wrap gap-3">
              {roles.map((role) => (
                <label key={role.roleId} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={formData.roleIds?.includes(role.roleId)}
                    onChange={(e) => {
                      const currentIds = formData.roleIds || [];
                      const newRoleIds = e.target.checked
                        ? [...currentIds, role.roleId]
                        : currentIds.filter(id => id !== role.roleId);
                      setFormData({ ...formData, roleIds: newRoleIds });
                    }}
                  />
                  <span className="text-sm text-gray-700">{role.roleName}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={onClose}
            className="px-6 py-2 cursor-pointer
            text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={handleEdit}
            disabled={isLoading}
            className="px-8 py-2 cursor-pointer
            bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "SAVE CHANGES"}
          </button>
        </div>
      </div>
    </div>
  );
};
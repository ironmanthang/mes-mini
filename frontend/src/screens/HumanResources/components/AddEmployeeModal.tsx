import { X, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { employeeService, type CreateEmployeeRequest } from "../../../services/employeeServices";
import { roleService, type Role } from "../../../services/roleServices";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AddEmployeeModal = ({ isOpen, onClose, onConfirm }: AddEmployeeModalProps): JSX.Element | null => {
  // CẬP NHẬT: Khởi tạo formData theo CreateEmployeeRequest mới
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    fullName: "",
    email: "",
    phoneNumber: "",
    province: "",
    ward: "",
    street: "",
    dateOfBirth: "",
    hireDate: new Date().toISOString().split('T')[0],
    roleIds: [],
    status: "ACTIVE"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  // Giữ lại logic fetch tỉnh thành nhưng cập nhật vào province/ward của formData
  useEffect(() => {
    if (isOpen) {
      // Giả sử có API fetch tỉnh thành
      fetch("https://provinces.open-api.vn/api/p/")
        .then(res => res.json())
        .then(data => setProvinces(data));
      
      roleService.getAllRoles().then(data => setRoles(data));
    }
  }, [isOpen]);

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

  const handleAdd = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Tạo bản sao của dữ liệu để format trước khi gửi đi
      const payload: any = { ...formData };

      // 2. Xử lý trường dateOfBirth: Nếu để trống thì xóa luôn để backend nhận undefined thay vì chuỗi rỗng ""
      if (!payload.dateOfBirth) {
          delete payload.dateOfBirth;
      } else {
          // Chuyển sang chuẩn ISO 8601 (VD: 2024-05-08T00:00:00.000Z)
          payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
      }

      if (payload.hireDate) {
          payload.hireDate = new Date(payload.hireDate).toISOString();
      }

      if (payload.roleIds.length === 0) {
          throw new Error("Please select at least one role.");
      }

      // 5. Gọi API với dữ liệu đã được làm sạch
      await employeeService.createEmployee(payload);
      
      onConfirm();
      onClose();
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        province: "",
        ward: "",
        street: "",
        dateOfBirth: "",
        hireDate: new Date().toISOString().split('T')[0],
        roleIds: [],
        status: "ACTIVE"
      });
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      setError(backendMessage || err.message || "Failed to create employee");
      console.error("Payload error details:", err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Add New Employee</h2>
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
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter full name"
              />
            </div>

            {/* Email - Backend dùng Email làm Username mặc định */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="employee@company.com"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Phone Number</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="090..."
              />
            </div>

            {/* Hire Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Hire Date</label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Address Section - Tách nhỏ theo yêu cầu Backend */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Address Details</h3>
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
                disabled={!districts.length}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm disabled:bg-gray-50"
              >
                <option value="">-- Select District/Ward --</option>
                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
            </div>
            <input
              type="text"
              placeholder="Street name, building, house number..."
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
            />
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Assign Roles</label>
            <div className="flex flex-wrap gap-3">
              {roles.map((role) => (
                <label key={role.roleId} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={formData.roleIds.includes(role.roleId)}
                    onChange={(e) => {
                      const newRoleIds = e.target.checked
                        ? [...formData.roleIds, role.roleId]
                        : formData.roleIds.filter(id => id !== role.roleId);
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
            onClick={handleAdd}
            disabled={isLoading}
            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg cursor-pointer
            hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "CREATE ACCOUNT"}
          </button>
        </div>
      </div>
    </div>
  );
};
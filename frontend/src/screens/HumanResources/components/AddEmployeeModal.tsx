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
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    fullName: "",
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    hireDate: new Date().toISOString().split('T')[0],
    roleIds: [],
    status: "ACTIVE"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await roleService.getAllRoles();
        setRoles(data);
        if (data.length > 0 && formData.roleIds.length === 0) {
            setFormData(prev => ({ ...prev, roleIds: [data[0].roleId] }));
        }
      } catch (error) {
        console.error("Failed to fetch roles", error);
      }
    };
    if (isOpen) {
        fetchRoles();
    }
  }, [isOpen]);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = Number(e.target.value);
    setFormData(prev => ({
        ...prev,
        roleIds: [selectedRoleId]
    }));
  };

  const handleAdd = async () => {
    // Validate cơ bản
    if (!formData.fullName || !formData.username || !formData.password || !formData.email) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    if (formData.roleIds.length === 0) {
        setError("Vui lòng chọn vai trò cho nhân viên.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await employeeService.createEmployee(formData);
      
      onConfirm(); 
      onClose();  
      
      setFormData({
        fullName: "", username: "", password: "", email: "", 
        phoneNumber: "", address: "", dateOfBirth: "", 
        hireDate: new Date().toISOString().split('T')[0], 
        roleIds: roles.length > 0 ? [roles[0].roleId] : [], 
        status: "ACTIVE"
      });

    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi tạo nhân viên.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[700px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">THÊM THÔNG TIN NHÂN VIÊN</h2>
          <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Họ và Tên<span className="text-red-500">*</span></label>
                <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" placeholder="Nguyễn Văn A" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Email<span className="text-red-500">*</span></label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="user@example.com" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Tên đăng nhập<span className="text-red-500">*</span></label>
                <input name="username" value={formData.username} onChange={handleChange} type="text" placeholder="user123" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Mật khẩu<span className="text-red-500">*</span></label>
                <input name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••••" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Vai trò<span className="text-red-500">*</span></label>
                <select 
                  name="roleIds"
                  value={formData.roleIds[0] || ""}
                  onChange={handleRoleChange}
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none cursor-pointer"
                >
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Ngày sinh</label>
                <input name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Ngày vào làm<span className="text-red-500">*</span></label>
                <input name="hireDate" value={formData.hireDate} onChange={handleChange} type="date" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Số điện thoại</label>
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} type="text" placeholder="0901234567" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <label className="text-sm font-bold text-gray-800">Địa chỉ</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows={3} placeholder="123 Đường, Quận..." className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pb-8 pt-2">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            HỦY
          </button>
          <button 
            onClick={handleAdd}
            disabled={isLoading}
            className="px-8 py-2.5 bg-[#2EE59D] text-white text-sm font-semibold rounded hover:bg-[#25D390] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "ĐANG THÊM..." : "THÊM"}
          </button>
        </div>
      </div>
    </div>
  );
};
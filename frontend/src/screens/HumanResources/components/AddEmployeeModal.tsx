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
    username: "thinh",
    password: "123987",
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

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<{code: number, name: string} | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{code: number, name: string} | null>(null);
  const [street, setStreet] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roleData = await roleService.getAllRoles();
        setRoles(roleData);
        if (roleData.length > 0 && formData.roleIds.length === 0) {
            setFormData(prev => ({ ...prev, roleIds: [roleData[0].roleId] }));
        }
      } catch (error) {
        console.error("Failed to fetch roles", error);
      }

      try {
        const res = await fetch("https://provinces.open-api.vn/api/v2/p/");
        const provData = await res.json();
        setProvinces(provData);
      } catch (error) {
        console.error("Failed to fetch provinces API", error);
      }
    };

    if (isOpen) {
        fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProvince) {
      const prov = provinces.find(p => p.code === selectedProvince.code);

      const fetchData = async () => {
        try {
          const res = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${prov.code}`);
          const ward = await res.json();
          setDistricts(ward);
          setSelectedDistrict(null);
        } catch (err) {
          console.error("Failed to fetch ward", err);
        }
      }

      if (prov) {
        fetchData();
      }
      
    } else {
      setDistricts([]);
    }
  }, [selectedProvince, provinces]);

  useEffect(() => {
    const parts = [
      street.trim(),
      selectedDistrict?.name,
      selectedProvince?.name
    ].filter(Boolean);

    setFormData(prev => ({ ...prev, address: parts.join(", ") }));
  }, [street, selectedDistrict, selectedProvince]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = Number(e.target.value);
    setFormData(prev => ({ ...prev, roleIds: [selectedRoleId] }));
  };

  const handleAdd = async () => {
    if (!formData.fullName ||  !formData.email) {
      setError("Please fill in all required fields (*)");
      return;
    }

    if (formData.roleIds.length === 0) {
        setError("Please select a role for the employee.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await employeeService.createEmployee(formData);
      
      onConfirm(); 
      onClose();  
      
      setFormData({
        fullName: "", username: "thinh", password: "123987", email: "", 
        phoneNumber: "", address: "", dateOfBirth: "", 
        hireDate: new Date().toISOString().split('T')[0], 
        roleIds: roles.length > 0 ? [roles[0].roleId] : [], 
        status: "ACTIVE"
      });
      setStreet("");
      setSelectedProvince(null);
      setSelectedDistrict(null);

    } catch (err: any) {
      setError(err.response?.data?.message || "Error creating employee.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[700px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">ADD EMPLOYEE</h2>
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
                <label className="text-sm font-bold text-gray-800">Full Name<span className="text-red-500">*</span></label>
                <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" placeholder="John Doe" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Email<span className="text-red-500">*</span></label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="user@example.com" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Hire Date<span className="text-red-500">*</span></label>
                <input name="hireDate" value={formData.hireDate} onChange={handleChange} type="date" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none text-gray-600" />
              </div>
              
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Role<span className="text-red-500">*</span></label>
                <select 
                  name="roleIds"
                  value={formData.roleIds[0] || ""}
                  onChange={handleRoleChange}
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none cursor-pointer"
                >
                  {roles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Date of Birth</label>
                <input name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none text-gray-600" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Phone Number</label>
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} type="text" placeholder="1234567890" className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" />
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <label className="text-sm font-bold text-gray-800">Address Details</label>
            <div className="grid grid-cols-2 gap-4">
              <select 
                value={selectedProvince?.code || ""}
                onChange={(e) => {
                  const code = Number(e.target.value);
                  const name = e.target.options[e.target.selectedIndex].text;
                  setSelectedProvince(code ? { code, name } : null);
                }}
                className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none cursor-pointer"
              >
                <option value="">-- Province / City --</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>

              <select 
                value={selectedDistrict?.code || ""}
                onChange={(e) => {
                  const code = Number(e.target.value);
                  const name = e.target.options[e.target.selectedIndex].text;
                  setSelectedDistrict(code ? { code, name } : null);
                }}
                disabled={!selectedProvince}
                className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">-- District --</option>
                {districts.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>

            <input 
              type="text" 
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Street name, building, house number..." 
              className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none" 
            />
          </div>

        </div>

        <div className="flex items-center justify-center gap-4 pb-8 pt-2">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            CANCEL
          </button>
          <button 
            onClick={handleAdd}
            disabled={isLoading}
            className="px-8 py-2.5 bg-[#2EE59D] text-white text-sm font-semibold rounded hover:bg-[#25D390] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "ADDING..." : "ADD"}
          </button>
        </div>
      </div>
    </div>
  );
};
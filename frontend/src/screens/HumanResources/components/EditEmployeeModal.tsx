import { X, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { employeeService, type Employee, type UpdateEmployeeRequest } from "../../../services/employeeServices";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: Employee | null;
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

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<{code: number, name: string} | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{code: number, name: string} | null>(null);
  const [selectedWard, setSelectedWard] = useState<{code: number, name: string} | null>(null);
  const [street, setStreet] = useState("");

  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        fullName: userData.fullName || "",
        username: userData.username || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        hireDate: userData.hireDate || new Date(userData.hireDate).toISOString().split('T')[0],
      });
      
      setStreet("");
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setError(null);
    }
  }, [isOpen, userData]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/?depth=3");
        const provData = await res.json();
        setProvinces(provData);
      } catch (error) {
        console.error("Failed to fetch provinces API", error);
      }
    };
    if (isOpen) {
        fetchProvinces();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProvince) {
      const prov = provinces.find(p => p.code === selectedProvince.code);
      setDistricts(prov?.districts || []);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
    } else {
      setDistricts([]);
    }
  }, [selectedProvince, provinces]);

  useEffect(() => {
    if (selectedDistrict) {
      const dist = districts.find(d => d.code === selectedDistrict.code);
      setWards(dist?.wards || []);
      setSelectedWard(null);
    } else {
      setWards([]);
    }
  }, [selectedDistrict, districts]);

  useEffect(() => {
    const parts = [
      street.trim(),
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvince?.name
    ].filter(Boolean);

    setFormData(prev => ({ ...prev, address: parts.join(", ") }));
  }, [street, selectedWard, selectedDistrict, selectedProvince]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = async () => {
    if (!userData) {
      setError("User data not found.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await employeeService.updateEmployee(
        userData.employeeId,
        formData
      );
      onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update employee.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !userData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[700px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">EDIT EMPLOYEE INFORMATION</h2>
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
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800">Role</label>
                <input 
                  type="text" 
                  defaultValue={(userData.roles && userData.roles[0]?.roleName)} 
                  disabled
                  className="w-full bg-gray-50 border-none rounded p-3 text-sm text-gray-500 cursor-not-allowed outline-none" 
                />
              </div>
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
            </div>
          </div>

          {/* --- Address Section --- */}
          <div className="mt-6 space-y-3">
            <label className="text-sm font-bold text-gray-800">Address Details</label>
            <div className="grid grid-cols-3 gap-4">
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

              <select 
                value={selectedWard?.code || ""}
                onChange={(e) => {
                  const code = Number(e.target.value);
                  const name = e.target.options[e.target.selectedIndex].text;
                  setSelectedWard(code ? { code, name } : null);
                }}
                disabled={!selectedDistrict}
                className="w-full bg-gray-50 border-none rounded p-3 text-sm focus:ring-1 focus:ring-gray-200 outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Ward / Commune --</option>
                {wards.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
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
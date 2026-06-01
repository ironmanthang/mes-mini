import { X, Save, Truck, Info, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { supplierService, type Supplier, type CreateSupplierRequest } from "../../../services/supplierServices";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  initialData?: Supplier | null;
}

export const AddSupplierModal = ({ isOpen, onClose, onConfirm, initialData }: AddSupplierModalProps): JSX.Element | null => {
  const isEditMode = !!initialData;
  const title = isEditMode ? "EDIT SUPPLIER DETAILS" : "ADD NEW SUPPLIER";
  const buttonLabel = isEditMode ? "Save Changes" : "Create Supplier";

  const [formData, setFormData] = useState<CreateSupplierRequest>({
    code: "",
    supplierName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [ward, setWard] = useState<string>("");
  const [street, setStreet] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetch("https://provinces.open-api.vn/api/v2/p/")
        .then(res => res.json())
        .then(data => setProvinces(data))
        .catch(() => console.error("Unable to load the province list."));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code || "",
          supplierName: initialData.supplierName || "",
          email: initialData.email || "",
          phoneNumber: initialData.phoneNumber || "",
          address: initialData.address || "",
        });

        if (initialData.address) {
          const addressParts = initialData.address.split(",").map(p => p.trim());
          let parsedStreet = "";
          let parsedWard = "";
          let parsedProvince = "";

          if (addressParts.length >= 3) {
            parsedStreet = addressParts.slice(0, addressParts.length - 2).join(", ");
            parsedWard = addressParts[addressParts.length - 2];
            parsedProvince = addressParts[addressParts.length - 1];
          } else {
            parsedStreet = initialData.address;
          }

          setStreet(parsedStreet);
          setWard(parsedWard);
          setProvince(parsedProvince);
        } else {
          setStreet("");
          setWard("");
          setProvince("");
        }
      } else {
        setFormData({
          code: "",
          supplierName: "",
          email: "",
          phoneNumber: "",
          address: "",
        });
        setStreet("");
        setWard("");
        setProvince("");
        setSelectedProvinceCode("");
        setDistricts([]);
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && provinces.length > 0 && province) {
      const matchedProvince = provinces.find(p => p.name.toLowerCase() === province.toLowerCase());
      if (matchedProvince) {
        setSelectedProvinceCode(matchedProvince.code.toString());
        fetch(`https://provinces.open-api.vn/api/v2/p/${matchedProvince.code}?depth=2`)
          .then(res => res.json())
          .then(data => {
            setDistricts(data.wards || []);
          })
          .catch(err => console.error(err));
      }
    }
  }, [isOpen, provinces, province]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProvinceChange = async (provinceCode: string) => {
    setSelectedProvinceCode(provinceCode);
    const selectedProv = provinces.find(p => p.code === parseInt(provinceCode));
    setProvince(selectedProv ? selectedProv.name : "");
    setWard("");
    
    if (provinceCode) {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`);
        const data = await res.json();
        setDistricts(data.wards || []);
      } catch (err) {
        console.error(err);
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.supplierName) {
      setError("Please fill in required fields: Code, Supplier Name.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const finalAddress = [street, ward, province].filter(Boolean).join(', ');

    try {
      if (isEditMode && initialData?.supplierId) {
        // supplierName, email, phoneNumber, address are all updatable
        await supplierService.updateSupplier(initialData.supplierId, {
          supplierName: formData.supplierName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: finalAddress,
        });
        onConfirm("Edit Supplier Completed");
      } else {
        await supplierService.createSupplier({
          ...formData,
          address: finalAddress,
        });
        onConfirm("Add Supplier Completed");
      }
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save supplier.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[650px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1 flex items-center gap-2">
              <Truck className="w-4 h-4" /> 1. Supplier Credentials
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Supplier Code<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isEditMode}
                  placeholder="Ex: SUP-001" 
                  className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Supplier Name<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  placeholder="Ex: ACME Industries" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1 flex items-center gap-2">
              <Info className="w-4 h-4" /> 2. Contact & Address Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ex: supplier@acme.com" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input 
                  type="text" 
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Ex: 0987654321" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Province/City</label>
                <select 
                  value={selectedProvinceCode}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Select Province/City --</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">District/Ward</label>
                <select 
                  value={districts.find(d => d.name.toLowerCase() === ward.toLowerCase())?.code || ""}
                  onChange={(e) => {
                    const matchedDistrict = districts.find(d => d.code === parseInt(e.target.value));
                    setWard(matchedDistrict ? matchedDistrict.name : "");
                  }}
                  disabled={!districts.length}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-50 bg-white"
                >
                  <option value="">-- Select District/Ward --</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Street Address</label>
                <input
                  type="text"
                  placeholder="Ex: 123 Industrial Parkway, High Tech District"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 bg-white border border-gray-300 
              text-gray-700 font-medium rounded-lg hover:bg-gray-100 
              transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 
              text-white font-medium rounded-lg hover:bg-blue-500 
              transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isLoading ? "Saving..." : buttonLabel}
            </button>
        </div>
      </div>
    </div>
  );
};

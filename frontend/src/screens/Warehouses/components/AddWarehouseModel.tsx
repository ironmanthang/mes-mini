import { X, Save } from "lucide-react";
import { useState, useEffect } from "react";
import type { JSX } from "react";

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  initialData?: any;
}

export const AddWarehouseModal = ({ isOpen, onClose, onConfirm, initialData }: AddWarehouseModalProps): JSX.Element | null => {
  const [formData, setFormData] = useState({
    warehouseName: "",
    location: "",
    warehouseType: "COMPONENT"
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        warehouseName: initialData.warehouseName || "",
        location: initialData.location || "",
        warehouseType: initialData.warehouseType || "COMPONENT"
      });
    } else {
      setFormData({
        warehouseName: "",
        location: "",
        warehouseType: "COMPONENT"
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const title = isEditMode ? "EDIT WAREHOUSE INFORMATION" : "ADD NEW WAREHOUSE";
  const buttonLabel = isEditMode ? "Save Changes" : "Create Warehouse";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.warehouseName || !formData.warehouseType) {
      alert("Warehouse Name and Type are required");
      return;
    }
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div 
        key={initialData ? initialData.warehouseId : 'new'} 
        className="bg-white w-[500px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200"
      >
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Basic Information</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Warehouse Name<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="warehouseName"
                  value={formData.warehouseName}
                  onChange={handleChange}
                  placeholder="Ex: Central Component Storage" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ex: Zone A, Building 2" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type<span className="text-red-500">*</span></label>
                <select 
                  name="warehouseType"
                  value={formData.warehouseType}
                  onChange={handleChange}
                  disabled={isEditMode} // Cannot change type if editing
                  className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="COMPONENT">Component Warehouse</option>
                  <option value="SALES">Finished Product Warehouse</option>
                  <option value="ERROR">Defect/Return Warehouse</option>
                </select>
                {isEditMode && <p className="text-xs text-amber-600">Warehouse type cannot be changed after creation.</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
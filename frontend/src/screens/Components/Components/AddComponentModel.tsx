import { X, Save, Package, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { componentService, type CreateComponentRequest, type Component } from "../../../services/componentServices";

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  initialData?: Component;
}

export const AddComponentModal = ({ isOpen, onClose, onConfirm, initialData }: AddComponentModalProps): JSX.Element | null => {
  const isEditMode = !!initialData;
  const title = isEditMode ? "EDIT COMPONENT DETAILS" : "ADD NEW COMPONENT";
  const buttonLabel = isEditMode ? "Save Changes" : "Create Component";

  const [formData, setFormData] = useState<CreateComponentRequest>({
    code: "",
    componentName: "",
    unit: "pcs",
    minStockLevel: 0,
    standardCost: 0,
    description: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code || "",
          componentName: initialData.componentName || "",
          unit: initialData.unit || "pcs",
          minStockLevel: initialData.minStockLevel || 0,
          standardCost: initialData.standardCost || 0,
          description: initialData.description || "",
        });
      } else {
        setFormData({
          code: "",
          componentName: "",
          unit: "pcs",
          minStockLevel: 0,
          standardCost: 0,
          description: "",
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "minStockLevel" || name === "standardCost") ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    if (!formData.code || !formData.componentName || !formData.unit) {
      setError("Please fill in required fields: Code, Name, Unit.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEditMode && initialData?.componentId) {
        await componentService.updateComponent(initialData.componentId, formData);
      } else {
        await componentService.createComponent(formData);
      }
      
      onConfirm();
      onClose();
    } catch (err) {
      console.error("Failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[700px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="relative p-6 text-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1 flex items-center gap-2">
              <Package className="w-4 h-4" /> 1. Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Component Code (ID)<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isEditMode}
                  placeholder="Ex: COMP-001" 
                  className={`w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Component Name<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="componentName"
                  value={formData.componentName}
                  onChange={handleChange}
                  placeholder="Ex: Intel Core i9-13900K" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Technical specs, compatibility notes..." 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">2. Specifications</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Unit (Đơn vị tính)<span className="text-red-500">*</span></label>
                    <select 
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                        <option value="pcs">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="meter">Meter</option>
                        <option value="box">Box</option>
                        <option value="set">Set</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Min Stock Level</label>
                    <input 
                      type="number" 
                      name="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={handleChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                    />
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> 3. Pricing
                </h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Standard Cost ($)</label>
                    <input 
                      type="number" 
                      name="standardCost"
                      value={formData.standardCost}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono" 
                    />
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isLoading ? "Saving..." : buttonLabel}
            </button>
        </div>
      </div>
    </div>
  );
};
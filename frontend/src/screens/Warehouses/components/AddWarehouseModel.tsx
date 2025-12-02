import { X, Save } from "lucide-react";
import type { JSX } from "react";

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  initialData?: any;
}

export const AddWarehouseModal = ({ isOpen, onClose, onConfirm, initialData }: AddWarehouseModalProps): JSX.Element | null => {
  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const title = isEditMode ? "EDIT WAREHOUSE INFORMATION" : "ADD NEW WAREHOUSE";
  const buttonLabel = isEditMode ? "Save Changes" : "Create Warehouse";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div 
        key={initialData ? initialData.id : 'new'} 
        className="bg-white w-[700px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200"
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
            <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">1. Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Warehouse Name<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  defaultValue={initialData?.name || ""}
                  placeholder="Ex: Central Component Storage" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input 
                  type="text" 
                  defaultValue={initialData?.location || ""}
                  placeholder="Ex: Zone A, Building 2" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Type<span className="text-red-500">*</span></label>
                <select 
                  defaultValue={initialData?.type || "Component"}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="Component">Component Warehouse</option>
                  <option value="Product">Finished Product Warehouse</option>
                  <option value="Defect">Defect/Return Warehouse</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">2. Capacity</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Total Capacity (m³)</label>
                    <input 
                      type="number" 
                      defaultValue={initialData?.capacity || ""}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Storage Units (Shelves)</label>
                    <input 
                      type="number" 
                      defaultValue={initialData?.units || ""} // Giả sử data có field units
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                    />
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">3. Management</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Warehouse Manager</label>
                    <select 
                      defaultValue={initialData?.manager || ""}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                        <option value="">Select Employee...</option>
                        <option value="Thinh Huynh Canh">Thinh Huynh Canh</option>
                        <option value="Lam Phan Phuc">Lam Phan Phuc</option>
                        <option value="Nguyen Van A">Nguyen Van A</option>
                    </select>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">4. Settings (Status)</h3>
             <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      defaultChecked={!initialData || initialData.status === "Active"}
                      className="w-4 h-4 text-green-600" 
                    />
                    <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      defaultChecked={initialData?.status === "Inactive"}
                      className="w-4 h-4 text-gray-400" 
                    />
                    <span className="text-sm text-gray-700">Inactive</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      defaultChecked={initialData?.status === "Maintenance"}
                      className="w-4 h-4 text-orange-500" 
                    />
                    <span className="text-sm text-gray-700">Maintenance</span>
                </label>
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
              onClick={() => { onConfirm(initialData); onClose(); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
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
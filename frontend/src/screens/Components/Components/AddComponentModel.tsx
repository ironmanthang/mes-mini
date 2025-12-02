import { X, Save, Package, DollarSign } from "lucide-react";
import type { JSX } from "react";

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  initialData?: any;
}

export const AddComponentModal = ({ isOpen, onClose, onConfirm, initialData }: AddComponentModalProps): JSX.Element | null => {
  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const title = isEditMode ? "EDIT COMPONENT DETAILS" : "ADD NEW COMPONENT";
  const buttonLabel = isEditMode ? "Save Changes" : "Create Component";

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
            <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1 flex items-center gap-2">
              <Package className="w-4 h-4" /> 1. Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Component Name<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  defaultValue={initialData?.name || ""}
                  placeholder="Ex: Intel Core i9-13900K" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  rows={2}
                  defaultValue={initialData?.description || ""}
                  placeholder="Technical specs, compatibility notes..." 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" 
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Supplier<span className="text-red-500">*</span></label>
                <select 
                  defaultValue={initialData?.supplier || ""}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Select Supplier --</option>
                  <option value="Intel Corporation">Intel Corporation</option>
                  <option value="Samsung Electronics">Samsung Electronics</option>
                  <option value="Bosch Vietnam">Bosch Vietnam</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">2. Stock Settings</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Min Stock Level</label>
                    <input 
                      type="number" 
                      defaultValue={initialData?.minStock || 50}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Reorder Point</label>
                    <input 
                      type="number" 
                      defaultValue={initialData?.reorderPoint || 100}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                    />
                </div>
             </div>

             <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> 3. Pricing
                </h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Standard Unit Cost ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      defaultValue={initialData?.unitCost || 0}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select 
                      defaultValue={initialData?.status || "Active"}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                        <option value="Active">Active</option>
                        <option value="Discontinued">Discontinued</option>
                        <option value="Out of Stock">Out of Stock</option>
                    </select>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(initialData); onClose(); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm"
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
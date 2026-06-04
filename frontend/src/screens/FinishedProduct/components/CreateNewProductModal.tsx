import { X, Save, Loader2, Package } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductServices, type CreateNewProduct } from "../../../services/productServices";
import { QualityChecklistServices, type QualityChecklist } from "../../../services/qualityChecklistServices";
import { ProductCategoryServices, type ProductCategory } from "../../../services/productCategoryServices";

interface CreateNewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateNewProductModal = ({ isOpen, onClose, onSuccess }: CreateNewProductModalProps): JSX.Element | null => {
  const [code, setCode] = useState("");
  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [checklistId, setChecklistId] = useState<number | "">("");
  const [checklistsList, setChecklistsList] = useState<QualityChecklist[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categoriesList, setCategoriesList] = useState<ProductCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setProductName("");
      setUnit("pcs");
      setChecklistId("");
      setCategoryId("");
      
      Promise.all([
        QualityChecklistServices.getAllChecklists(),
        ProductCategoryServices.getAllCategories()
      ])
        .then(([checklists, categories]) => {
          setChecklistsList(checklists);
          setCategoriesList(categories);
        })
        .catch(err => console.error("Failed to load form data", err));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!code.trim() || !productName.trim() || !unit.trim()) {
      return alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
    }

    setIsSubmitting(true);
    try {
      const payload: CreateNewProduct = {
        code,
        productName,
        unit,
        categoryId: categoryId === "" ? null : Number(categoryId),
        checklistId: checklistId === "" ? null : Number(checklistId)
      };

      await ProductServices.createNewProduct(payload);
      
      onSuccess();
      onClose(); 
    } catch (error: any) {
      console.error(error.response?.data?.message || "Lỗi khi tạo sản phẩm.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[500px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> New Product
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 
          rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Product Code <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. PROD-001"
              value={code} 
              onChange={e => setCode(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Product Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. Gaming Laptop X1"
              value={productName} 
              onChange={e => setProductName(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Unit of Measurement <span className="text-red-500">*</span></label>
            <select 
              value={unit} 
              onChange={e => setUnit(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="box">Boxes</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="meters">Meters (m)</option>
              <option value="liters">Liters (L)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Category</label>
            <select 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">-- No Category --</option>
              {categoriesList.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Quality Checklist</label>
            <select 
              value={checklistId} 
              onChange={e => setChecklistId(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">-- No Checklist Assigned --</option>
              {checklistsList.map(c => (
                <option key={c.checklistId} value={c.checklistId}>{c.checklistName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
            {isSubmitting ? "Saving..." : "Save Product"}
          </button>
        </div>

      </div>
    </div>
  );
};
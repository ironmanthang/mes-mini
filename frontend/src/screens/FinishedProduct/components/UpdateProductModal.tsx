import { X, Save, Package, Loader2 } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductServices, type UpdateProduct } from "../../../services/productServices";

interface UpdateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  onSuccess: () => void;
}

export const UpdateProductModal = ({ isOpen, onClose, productId, onSuccess }: UpdateProductModalProps): JSX.Element | null => {
  const [code, setCode] = useState("");
  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [categoryId, setCategoryId] = useState<number | "">(""); 

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      ProductServices.getProductById(productId)
        .then(data => {
          setCode(data.code || "");
          setProductName(data.productName || "");
          setUnit(data.unit || "pcs");
          setCategoryId(data.categoryId || "");
        })
        .catch(err => console.error("Failed to load product details", err))
        .finally(() => setIsLoading(false));
    } else {
      setCode(""); setProductName(""); setUnit("pcs"); setCategoryId("");
    }
  }, [isOpen, productId]);

  const handleSubmit = async () => {
    if (!productId) return;
    if (!code.trim() || !productName.trim() || !unit.trim()) {
      return alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateProduct = {
        code,
        productName,
        unit,
        categoryId: Number(categoryId) || 0
      };

      await ProductServices.updateProduct(productId, payload);
      
      alert("✅ Cập nhật sản phẩm thành công!");
      onSuccess();
      onClose(); 
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi cập nhật sản phẩm.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[500px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" /> Update Product
            </h2>
            <p className="text-sm font-mono text-gray-500 mt-1">ID: {productId}</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 
          rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
             <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
             </div>
          ) : (
            <>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Product Code <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
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
                        value={productName} 
                        onChange={e => setProductName(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Unit <span className="text-red-500">*</span></label>
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
                        <label className="text-sm font-bold text-gray-700">Category ID</label>
                        <input 
                            type="number" min="0"
                            placeholder="Optional"
                            value={categoryId} 
                            onChange={e => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={isSubmitting}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting || isLoading} 
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
            {isSubmitting ? "Updating..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};
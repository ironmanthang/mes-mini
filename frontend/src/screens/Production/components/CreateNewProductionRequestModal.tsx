import { X, Send, Loader2, AlertTriangle, CheckCircle2, Package } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductServices, type Product } from "../../../services/productServices";
import { ProductionRequestServices, type PRPriority } from "../../../services/productionRequestServices";

interface CreateNewProductionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateNewProductionRequestModal = ({ isOpen, onClose, onSuccess }: CreateNewProductionRequestModalProps): JSX.Element | null => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productId, setProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(0);
  const [priority, setPriority] = useState<PRPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const [resultStatus, setResultStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingProducts(true);
      ProductServices.getAllProducts()
        .then(data => setProducts(Array.isArray(data) ? data : (data as any).data || []))
        .catch(err => console.error("Failed to load products", err))
        .finally(() => setIsLoadingProducts(false));
    } else {
      setProductId(""); setQuantity(0); setPriority("MEDIUM"); 
      setDueDate(""); setNote(""); setResultStatus(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!productId) return alert("Vui lòng chọn sản phẩm.");
    if (quantity <= 0) return alert("Số lượng phải lớn hơn 0.");

    setIsSubmitting(true);
    try {
      const payload = {
        productId: Number(productId),
        quantity,
        priority,
        dueDate: dueDate || undefined,
        note
      };

      const response = await ProductionRequestServices.createNewProductionRequest(payload);
      
      setResultStatus(response.status);
      onSuccess();
      
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi tạo Production Request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[700px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> New Production Request (MTS)
          </h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-bold text-gray-700">Product <span className="text-red-500">*</span></label>
              <select 
                value={productId} 
                onChange={e => setProductId(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={isSubmitting || !!resultStatus}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">{isLoadingProducts ? "Loading..." : "-- Select Product --"}</option>
                {products.map(p => <option key={p.productId} value={p.productId}>{p.code} - {p.productName}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Quantity <span className="text-red-500">*</span></label>
              <input 
                type="number" min="1" 
                value={quantity || ""} onChange={e => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isSubmitting || !!resultStatus}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Due Date</label>
              <input 
                type="date" 
                value={dueDate} onChange={e => setDueDate(e.target.value)}
                disabled={isSubmitting || !!resultStatus}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Priority</label>
              <select 
                value={priority} onChange={e => setPriority(e.target.value as PRPriority)}
                disabled={isSubmitting || !!resultStatus}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-bold text-gray-700">Note</label>
              <textarea 
                rows={2} value={note} onChange={e => setNote(e.target.value)}
                disabled={isSubmitting || !!resultStatus}
                placeholder="MTS specific notes..."
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
              />
            </div>
          </div>

          {resultStatus && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${resultStatus === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {resultStatus === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-green-800">Ready for Production</h4>
                    <p className="text-xs text-green-700 mt-1">Materials are available and have been reserved. You can now create a Work Order.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Material Shortage Detected</h4>
                    <p className="text-xs text-red-700 mt-1">Request saved, but waiting for materials. Please check the Draft PO to procure missing items.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          {resultStatus ? (
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-sm cursor-pointer">
              Done & Close
            </button>
          ) : (
            <>
              <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-[#2EE59D] text-white rounded-lg font-bold hover:bg-[#25D390] flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} 
                {isSubmitting ? "Checking BOM..." : "Submit Request"}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
import { 
  Package, 
  Send, 
  CheckCircle2, 
  Clock, 
  Loader2,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";

import { ProductServices, type Product } from "../../../services/productServices";
import { ProductionRequestServices, type PRPriority } from "../../../services/productionRequestServices";

export const CreateProductionRequest = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productId, setProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(0);
  const [priority, setPriority] = useState<PRPriority>("MEDIUM");
  
  const [resultStatus, setResultStatus] = useState<string | null>(null);

  useEffect(() => {
    ProductServices.getAllProducts()
      .then(response => setProducts(response.data))
      .catch(err => console.error("Failed to load products", err))
      .finally(() => setIsLoadingProducts(false));
  }, []);

  const handleReset = () => {
    setProductId("");
    setQuantity(0);
    setPriority("MEDIUM");
    setResultStatus(null);
  };

  const handleSubmit = async () => {
    if (!productId) return alert("Please select a Product.");
    if (quantity <= 0) return alert("Quantity must be greater than 0.");

    setIsSubmitting(true);
    setResultStatus(null);

    try {
      // Gửi request - vì không có soDetailId nên đây là luồng Make-to-Stock (Blue Path)
      const response = await ProductionRequestServices.createNewProductionRequest({
        productId: Number(productId),
        quantity,
        priority,
      });

      setResultStatus(response.status);

      // Xử lý UI theo Traffic Light logic từ Docs
      if (response.status === 'APPROVED') {
        alert("✅ PR Created & Approved. Materials are reserved.");
      } else if (response.status === 'WAITING_MATERIAL') {
        alert("⚠️ PR Created, but waiting for Materials. Please resolve shortages.");
      }

    } catch (error) {
      console.error("Failed to create production request", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = () => {
    if (!resultStatus) {
      return (
        <div className="px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 bg-gray-100 text-gray-600 border border-gray-200">
          <Clock className="w-4 h-4" />
          NEW REQUEST
        </div>
      );
    }

    if (resultStatus === 'APPROVED') {
      return (
        <div className="px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 bg-green-100 text-green-700 border border-green-200">
          <CheckCircle2 className="w-4 h-4" />
          APPROVED (READY)
        </div>
      );
    }

    if (resultStatus === 'WAITING_MATERIAL') {
      return (
        <div className="px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 bg-red-100 text-red-700 border border-red-200">
          <AlertTriangle className="w-4 h-4" />
          WAITING MATERIAL
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Create Production Request (Make-to-Stock)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Submit a manual request to start a new manufacturing batch for inventory.
            </p>
          </div>
          
          {renderStatusBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cột Trái */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Selection<span className="text-red-500">*</span>
              </label>
              <select
                value={productId}
                disabled={isSubmitting || !!resultStatus}
                onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer disabled:bg-gray-50"
              >
                <option value="">
                  {isLoadingProducts ? "Loading products..." : "-- Select Product --"}
                </option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.code} - {p.productName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>
              <div className="flex gap-4">
                {(["HIGH", "MEDIUM", "LOW"] as PRPriority[]).map((level) => (
                  <label key={level} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={level}
                      checked={priority === level}
                      disabled={isSubmitting || !!resultStatus}
                      onChange={(e) => setPriority(e.target.value as PRPriority)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer disabled:opacity-50"
                    />
                    <span className={`ml-2 text-sm ${
                      level === "HIGH" ? "text-red-600 font-bold" : "text-gray-700 font-medium"
                    }`}>
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Cột Phải */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quantity to Produce<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={quantity || ""}
                  disabled={isSubmitting || !!resultStatus}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-50"
                />
                <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm font-medium">
                    {productId ? products.find(p => p.productId === productId)?.unit : "Units"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${resultStatus === 'WAITING_MATERIAL' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
              <h4 className={`text-xs font-bold uppercase mb-2 ${resultStatus === 'WAITING_MATERIAL' ? 'text-red-800' : 'text-blue-800'}`}>
                Request Summary
              </h4>
              <div className={`text-sm space-y-1.5 ${resultStatus === 'WAITING_MATERIAL' ? 'text-red-700' : 'text-blue-700'}`}>
                <p>Product: <span className="font-bold">{products.find(p => p.productId === productId)?.productName || "Not selected"}</span></p>
                <p>Quantity: <span className="font-bold">{quantity > 0 ? quantity : "-"}</span></p>
                {resultStatus === 'WAITING_MATERIAL' && (
                   <p className="mt-2 pt-2 border-t border-red-200 text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> MRP check failed: Material shortage.
                   </p>
                )}
                {resultStatus === 'APPROVED' && (
                   <p className="mt-2 pt-2 border-t border-blue-200 text-xs font-semibold text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> MRP check passed: Materials reserved.
                   </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        {resultStatus ? (
             <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
             >
                <RotateCcw className="w-4 h-4" />
                Create Another Request
             </button>
        ) : (
            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#2EE59D] text-white font-bold rounded-lg hover:bg-[#25D390] transition-colors shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmitting ? "Running MRP Check..." : "Submit Request"}
            </button>
        )}
      </div>
    </div>
  );
};
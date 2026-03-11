import { X, Package, Calendar, Tag, Barcode, Loader2 } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductServices, type Product } from "../../../services/productServices";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
}

export const ProductDetailModal = ({ isOpen, onClose, productId }: ProductDetailModalProps): JSX.Element | null => {
  const [productData, setProductData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      ProductServices.getProductById(productId)
        .then(data => setProductData(data))
        .catch(err => console.error("Failed to load product details", err))
        .finally(() => setIsLoading(false));
    } else {
      setProductData(null);
    }
  }, [isOpen, productId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  if (!isOpen || !productId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[600px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Product Details
            </h2>
            <p className="text-sm font-mono text-gray-500 mt-1">{productData?.code || 'Loading...'}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : productData ? (
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="w-16 h-16 bg-white rounded-lg border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{productData.productName}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mt-1 border border-blue-200">
                            {productData.category || 'Uncategorized'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1"><Tag className="w-3.5 h-3.5"/> Product Code</label>
                            <p className="font-mono font-medium text-gray-900">{productData.code}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1"><Package className="w-3.5 h-3.5"/> Unit of Measure</label>
                            <p className="font-medium text-gray-900">{productData.unit}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5"/> Created At</label>
                            <p className="font-medium text-gray-900">{formatDate(productData.createdAt)}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5"/> Last Updated</label>
                            <p className="font-medium text-gray-900">{formatDate(productData.updatedAt)}</p>
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <div className="text-center text-red-500 py-10">Error loading data.</div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex flex-row-reverse">
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg 
            font-bold hover:bg-blue-500 transition-colors shadow-sm cursor-pointer">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};
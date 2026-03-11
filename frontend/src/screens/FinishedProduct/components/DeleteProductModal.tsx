import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState, type JSX } from "react";
import { ProductServices } from "../../../services/productServices";

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  productName: string;
  onSuccess: () => void;
}

export const DeleteProductModal = ({ isOpen, onClose, productId, productName, onSuccess }: DeleteProductModalProps): JSX.Element | null => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!productId) return;

    setIsDeleting(true);
    try {
      await ProductServices.deleteProduct(productId);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      alert(error?.response?.data?.message || "Cannot delete this product. It might be used in an existing Bill of Materials or Sales Order.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !productId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="bg-white w-[450px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 flex justify-between items-start border-b border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-50 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
            </div>
            <button 
                onClick={onClose} 
                disabled={isDeleting}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="font-bold text-gray-900 text-base">{productName}</span>
                <span className="block text-xs text-gray-500 mt-1 font-mono">ID: {productId}</span>
            </div>
            <p className="text-xs text-red-500 mt-4 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Note: The system will block deletion if this product is linked to existing transactions or inventory.
            </p>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button 
                onClick={onClose} 
                disabled={isDeleting}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            >
                Cancel
            </button>
            <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Deleting..." : "Delete Product"}
            </button>
        </div>
      </div>
    </div>
  );
};
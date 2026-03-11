import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState, type JSX } from "react";
import { componentService } from "../../../services/componentServices";

interface DeleteComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: number | null;
  componentName: string;
  onSuccess: () => void;
}

export const DeleteComponentModal = ({ isOpen, onClose, componentId, componentName, onSuccess }: DeleteComponentModalProps): JSX.Element | null => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!componentId) return;

    setIsDeleting(true);
    try {
      await componentService.deleteComponent(componentId);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Lỗi khi xóa:", error);
      alert(error?.response?.data?.message || "Không thể xóa component này. Có thể nó đang được sử dụng trong BOM hoặc Purchase Order.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !componentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="bg-white w-[450px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 flex justify-between items-start border-b border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-50 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Xóa Linh kiện</h2>
            </div>
            <button 
                onClick={onClose} 
                disabled={isDeleting}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa linh kiện này không? Hành động này không thể hoàn tác.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="font-bold text-gray-900 text-base">{componentName}</span>
                <span className="block text-xs text-gray-500 mt-1 font-mono">ID: {componentId}</span>
            </div>
            <p className="text-xs text-red-500 mt-4 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4" /> Lưu ý: Hệ thống sẽ chặn xóa nếu linh kiện đã có dữ liệu tồn kho hoặc nằm trong lệnh sản xuất.
            </p>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button 
                onClick={onClose} 
                disabled={isDeleting}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
                Hủy bỏ
            </button>
            <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Đang xóa..." : "Xóa Linh kiện"}
            </button>
        </div>
      </div>
    </div>
  );
};
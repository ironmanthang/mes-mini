import { X, Factory, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { type JSX } from "react";

interface ConfirmCreateWOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  requestDetails: {
    code: string;
    productName: string;
    quantity: number;
  } | null;
  lineName: string;
}

export const ConfirmCreateWOModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isSubmitting, 
    requestDetails, 
    lineName 
}: ConfirmCreateWOModalProps): JSX.Element | null => {
  
  if (!isOpen || !requestDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="bg-white w-[500px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-5 flex justify-between items-start border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-3 text-blue-700">
                <div className="p-2 bg-blue-100 rounded-full">
                    <Factory className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Confirm Work Order</h2>
            </div>
            <button 
                onClick={onClose} 
                disabled={isSubmitting}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer disabled:opacity-50"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                    You are about to convert an approved Production Request into an active Work Order. The selected production line will be assigned to this task.
                </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Request Code:</span>
                    <span className="font-mono font-bold text-gray-900">{requestDetails.code}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                    <span className="text-gray-500">Product:</span>
                    <span className="font-bold text-gray-900">{requestDetails.productName}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                    <span className="text-gray-500">Quantity:</span>
                    <span className="font-bold text-blue-600">{requestDetails.quantity}</span>
                </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-600">
                <span>Production Request</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200">
                    {lineName}
                </span>
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button 
                onClick={onClose} 
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm} 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#2EE59D] text-white font-bold rounded-lg hover:bg-[#25D390] transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Factory className="w-4 h-4" />}
                {isSubmitting ? "Creating..." : "Confirm & Create"}
            </button>
        </div>
      </div>
    </div>
  );
};
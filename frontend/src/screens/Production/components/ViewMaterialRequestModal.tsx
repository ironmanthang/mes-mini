import { 
    X, Loader2, PackageSearch, Layers, Calendar, FileText, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { useState, useEffect, useRef, type JSX } from "react";
import { MaterialRequestServices, type MaterialRequest } from "../../../services/materialRequestServices";
import { WarningNotification } from "../../Notification/WarningNotification";

interface ViewMaterialRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: number | null;
}

export const ViewMaterialRequestModal = ({ isOpen, onClose, requestId }: ViewMaterialRequestModalProps): JSX.Element | null => {
    const [requestDetail, setRequestDetail] = useState<MaterialRequest | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showWarningNotification = (message: string) => {
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        setWarningMessage(message);
        setShowWarning(true);
        warningTimeoutRef.current = setTimeout(() => {
            setShowWarning(false);
            setWarningMessage("");
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (isOpen && requestId) {
            setIsLoading(true);
            MaterialRequestServices.getMaterialRequestById(requestId)
                .then(res => {
                    setRequestDetail(res);
                })
                .catch(err => {
                    console.error("Failed to fetch material request details:", err);
                    showWarningNotification("Error loading material request details. Please try again.");
                })
                .finally(() => setIsLoading(false));
        } else {
            setRequestDetail(null);
        }
    }, [isOpen, requestId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm py-10">
            <div className="bg-white w-[800px] max-h-full flex flex-col rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <PackageSearch className="w-5 h-5 text-blue-400" /> Material Request Details
                        </h2>
                        <p className="text-sm font-mono text-gray-400 mt-1">
                            {isLoading ? "Loading..." : requestDetail?.code}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 cursor-pointer transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                        <p className="text-gray-500 font-medium">Loading request data...</p>
                    </div>
                ) : requestDetail ? (
                    <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-gray-50/50">
                        
                        {/* VÙNG 1: THÔNG TIN TỔNG QUAN */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                                <FileText className="w-5 h-5 text-blue-600" /> Overview Information
                            </h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Work Order</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{requestDetail.workOrder.code}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{requestDetail.workOrder.product?.productName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Request Date</p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {new Date(requestDetail.requestDate).toLocaleString('en-US')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Status</p>
                                    <div className="mt-1">
                                        {requestDetail.status === 'PENDING' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-yellow-100 text-yellow-700 font-bold text-xs"><Clock className="w-3.5 h-3.5"/> Waiting to issue</span>}
                                        {requestDetail.status === 'ISSUED' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-100 text-green-700 font-bold text-xs"><CheckCircle2 className="w-3.5 h-3.5"/> Issued</span>}
                                        {requestDetail.status === 'CANCELLED' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-gray-100 text-gray-600 font-bold text-xs"><AlertCircle className="w-3.5 h-3.5"/> Cancelled</span>}
                                    </div>
                                </div>
                            </div>

                            {requestDetail.note && (
                                <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Notes / Cancellation Reason</p>
                                    <p className="text-sm text-gray-700 italic">{requestDetail.note}</p>
                                </div>
                            )}
                        </div>

                        {/* VÙNG 2: DANH SÁCH LINH KIỆN */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-blue-600" /> Requested Components List
                                </h3>
                                <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                                    Total: {requestDetail.details?.length || 0} types
                                </span>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-600 font-bold border-b border-gray-200">
                                        <tr>
                                            <th className="p-3 pl-4">Component Code</th>
                                            <th className="p-3">Component Name</th>
                                            <th className="p-3 text-center">Unit</th>
                                            <th className="p-3 text-right pr-4 text-blue-800">Request Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-100">
                                        {requestDetail.details?.map((item) => (
                                            <tr key={item.componentId} className="hover:bg-gray-50">
                                                <td className="p-3 pl-4 font-mono font-bold text-blue-600">{item.component.code}</td>
                                                <td className="p-3 font-medium text-gray-900">{item.component.componentName}</td>
                                                <td className="p-3 text-center text-gray-600">{item.component.unit}</td>
                                                <td className="p-3 text-right pr-4 font-black text-blue-700 bg-blue-50/30">
                                                    {item.quantity.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!requestDetail.details || requestDetail.details.length === 0) && (
                                            <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">No component data found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">No data found.</p>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="p-5 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-bold hover:bg-gray-200 cursor-pointer transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
            <WarningNotification
                isVisible={showWarning}
                message={warningMessage}
                onClose={() => {
                    setShowWarning(false);
                    setWarningMessage("");
                }}
            />
        </div>
    );
};
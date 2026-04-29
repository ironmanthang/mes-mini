import { 
    X, Send, Loader2, Search, AlertTriangle, PackageSearch
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { WorkOrderServices, type WorkOrderListItem } from "../../../services/workOrderServices";

interface NewMaterialRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface MaterialAllowanceMock {
    componentId: number;
    componentName: string;
    standardQty: number; // Định mức chuẩn
    issuedQty: number;   // Số lượng đã xin trước đây
    remainingAllowance: number; // Hạn mức còn lại
}

export const NewMaterialRequestModal = ({ isOpen, onClose, onSuccess }: NewMaterialRequestModalProps): JSX.Element | null => {
    const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
    const [selectedWoId, setSelectedWoId] = useState<number | "">("");
    const [selectedWo, setSelectedWo] = useState<WorkOrderListItem | null>(null);
    const [isLoadingWOs, setIsLoadingWOs] = useState(false);
    
    const [bomTableData, setBomTableData] = useState<MaterialAllowanceMock[]>([]);
    const [requestQtys, setRequestQtys] = useState<Record<number, number>>({});
    const [isFetchingBom, setIsFetchingBom] = useState(false);
    
    const [isOverLimit, setIsOverLimit] = useState(false);
    const [overRequestReason, setOverRequestReason] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoadingWOs(true);
            WorkOrderServices.getAllWorkOrders({ limit: 500 })
                .then(res => {
                    const data = res.data || [];
                    const validWOs = data.filter(w => w.status === 'RELEASED' || w.status === 'IN_PROGRESS');
                    setWorkOrders(validWOs);
                })
                .catch(err => console.error("Failed to load Work Orders:", err))
                .finally(() => setIsLoadingWOs(false));
        } else {
            setSelectedWoId("");
            setSelectedWo(null);
            setBomTableData([]);
            setRequestQtys({});
            setIsOverLimit(false);
            setOverRequestReason("");
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedWoId) {
            const wo = workOrders.find(w => w.workOrderId === Number(selectedWoId));
            setSelectedWo(wo || null);

            if (wo) {
                setIsFetchingBom(true);
                setTimeout(() => {
                    const mockAllowance: MaterialAllowanceMock[] = [
                        { 
                            componentId: 101, 
                            componentName: "Màn hình OLED 1.5 inch", 
                            standardQty: wo.quantity * 1, 
                            issuedQty: Math.floor(wo.quantity * 0.8), // Giả lập đã xuất 80%
                            remainingAllowance: 0 
                        },
                        { 
                            componentId: 102, 
                            componentName: "Pin Lithium 500mAh", 
                            standardQty: wo.quantity * 1, 
                            issuedQty: 0, 
                            remainingAllowance: 0 
                        }
                    ].map(item => ({
                        ...item,
                        remainingAllowance: item.standardQty - item.issuedQty // Công thức tính hạn mức còn lại
                    }));

                    setBomTableData(mockAllowance);
                    
                    const initialQtys: Record<number, number> = {};
                    mockAllowance.forEach(item => {
                        initialQtys[item.componentId] = Math.max(0, item.remainingAllowance);
                    });
                    setRequestQtys(initialQtys);
                    setIsFetchingBom(false);
                }, 600);
            }
        } else {
            setBomTableData([]);
            setRequestQtys({});
        }
    }, [selectedWoId, workOrders]);

    const handleQtyChange = (compId: number, value: string) => {
        const numVal = parseInt(value) || 0;
        
        setRequestQtys(prev => {
            const next = { ...prev, [compId]: numVal };
            
            let hasOver = false;
            bomTableData.forEach(item => {
                const inputVal = item.componentId === compId ? numVal : (prev[item.componentId] || 0);
                if (inputVal > item.remainingAllowance) hasOver = true;
            });
            setIsOverLimit(hasOver);
            
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!selectedWoId) return alert("Vui lòng chọn Lệnh sản xuất.");
        if (isOverLimit && !overRequestReason.trim()) {
            return alert("Lý do xin vượt mức là bắt buộc!");
        }

        setIsSubmitting(true);
        try {
            const payload = {
                work_order_id: Number(selectedWoId),
                items: bomTableData.map(item => ({
                    component_id: item.componentId,
                    quantity: requestQtys[item.componentId] || 0
                })),
                reason: isOverLimit ? overRequestReason : undefined,
            };
            
            console.log("Mock Submit Payload:", payload);
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert("Gửi yêu cầu vật tư thành công!");
            onSuccess();
            onClose();
        } catch (error) {
            alert("Lỗi khi gửi yêu cầu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm py-10">
            <div className="bg-white w-[900px] max-h-full flex flex-col rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <PackageSearch className="w-5 h-5 text-blue-600" /> New Material Request
                        </h2>
                        <p className="text-sm font-mono text-gray-500 mt-1">ID: [Auto-generated]</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    {/* VÙNG 1: CHỌN LỆNH SẢN XUẤT */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700">Select Work Order <span className="text-red-500">*</span></label>
                        <select 
                            value={selectedWoId} onChange={(e) => setSelectedWoId(Number(e.target.value) || "")}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">{isLoadingWOs ? "Loading Work Orders..." : "-- Choose Released or In-Progress Order --"}</option>
                            {workOrders.map(wo => (
                                <option key={wo.workOrderId} value={wo.workOrderId}>{wo.code} - {wo.product?.productName} ({wo.status})</option>
                            ))}
                        </select>

                        {selectedWo && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase block">Target Product</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedWo.product?.productName}</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Product Quantity</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedWo.quantity} units</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* VÙNG 2: BẢNG CHI TIẾT YÊU CẦU */}
                    <div className={`space-y-3 ${!selectedWoId ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-600" /> BOM Request Table
                            </h3>
                            {isFetchingBom && <Loader2 className="w-4 h-4 animate-spin text-blue-600"/>}
                        </div>

                        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                                    <tr>
                                        <th className="p-3">Component</th>
                                        <th className="p-3 text-right">Standard Qty</th>
                                        <th className="p-3 text-right">Issued/Pending</th>
                                        <th className="p-3 text-right text-blue-600">Remaining Allowance</th>
                                        <th className="p-3 text-center bg-blue-50 w-32">Request Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-100">
                                    {bomTableData.map((item) => {
                                        const inputQty = requestQtys[item.componentId] ?? 0;
                                        const overLimit = inputQty > item.remainingAllowance;

                                        return (
                                            <tr key={item.componentId} className={overLimit ? 'bg-orange-50/30' : 'hover:bg-gray-50'}>
                                                <td className="p-3 font-medium text-gray-900">{item.componentName}</td>
                                                <td className="p-3 text-right text-gray-500">{item.standardQty}</td>
                                                <td className="p-3 text-right text-gray-500">{item.issuedQty}</td>
                                                <td className="p-3 text-right font-bold text-blue-700">{item.remainingAllowance}</td>
                                                <td className="p-3 bg-blue-50/30">
                                                    <input 
                                                        type="number" min="0"
                                                        value={inputQty}
                                                        onChange={(e) => handleQtyChange(item.componentId, e.target.value)}
                                                        className={`w-full p-2 border rounded text-center font-bold outline-none focus:ring-2 bg-white ${
                                                            overLimit ? 'border-orange-400 text-orange-700 focus:ring-orange-500' : 'border-blue-200 text-blue-700 focus:ring-blue-500'
                                                        }`}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {bomTableData.length === 0 && !isFetchingBom && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Please select a Work Order to load BOM details.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* VÙNG 3: XỬ LÝ VƯỢT HẠN MỨC */}
                    {isOverLimit && (
                        <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="w-full">
                                    <h4 className="text-sm font-bold text-orange-800">Cảnh báo: Yêu cầu vượt hạn mức!</h4>
                                    <p className="text-xs text-orange-700 mt-1 mb-3">
                                        Bạn đang yêu cầu cấp phát linh kiện nhiều hơn hạn mức cho phép. Vui lòng nhập lý do giải trình để cấp trên phê duyệt.
                                    </p>
                                    <textarea 
                                        value={overRequestReason} onChange={e => setOverRequestReason(e.target.value)}
                                        rows={2}
                                        placeholder="Nhập lý do xin vượt định mức (VD: Máy dập lỗi làm hỏng linh kiện)..."
                                        className="w-full p-2.5 border border-orange-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !selectedWoId || (isOverLimit && !overRequestReason.trim()) || isFetchingBom} 
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />} 
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
};
import {
    X, CheckCircle2, AlertTriangle, ScanBarcode, Save, Printer, Loader2
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductServices, type BOMComponent } from "../../../services/productServices";
import { WorkOrderServices, type WorkOrderListItem } from "../../../services/workOrderServices";

interface RecordOutputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    workOrder: WorkOrderListItem;
}

interface BOMVerifyItem extends BOMComponent {
    isVerified: boolean;
}

export const RecordOutputModal = ({ isOpen, onClose, onSuccess, workOrder }: RecordOutputModalProps): JSX.Element | null => {
    const [bomComponents, setBomComponents] = useState<BOMVerifyItem[]>([]);
    const [isLoadingBom, setIsLoadingBom] = useState(false);
    const [scannedCode, setScannedCode] = useState("");
    const [scanError, setScanError] = useState("");

    const [producedQty, setProducedQty] = useState<number | "">("");
    const [overProduceReason, setOverProduceReason] = useState("");
    const [autoGenerateSN, setAutoGenerateSN] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && workOrder) {
            setIsLoadingBom(true);
            ProductServices.getBOMById(workOrder.product.productId)
                .then(bom => {
                    setBomComponents(bom.map(b => ({ ...b, isVerified: false })));
                })
                .catch(err => console.error("Failed to fetch BOM:", err))
                .finally(() => setIsLoadingBom(false));
        } else {
            // Reset
            setBomComponents([]);
            setProducedQty("");
            setOverProduceReason("");
            setScannedCode("");
            setScanError("");
        }
    }, [isOpen, workOrder]);

    // LOGIC FOR SCANNING BY LINE LEADER
    const handleScanVerification = (value: string) => {
        setScannedCode(value);
        setScanError("");

        // Tìm xem chuỗi nhập vào có khớp với Component Code hoặc ID nào trong BOM không
        const matchedIndex = bomComponents.findIndex(b =>
            b.component.code.toLowerCase() === value.trim().toLowerCase() ||
            b.componentId.toString() === value.trim()
        );

        if (matchedIndex !== -1) {
            // Đánh dấu dòng đó là Verified
            const updatedBOM = [...bomComponents];
            updatedBOM[matchedIndex].isVerified = true;
            setBomComponents(updatedBOM);
            setScannedCode(""); // Clear ô nhập sau khi quét đúng
        } else if (value.trim().length > 3) {
            setScanError("Invalid component. Please check again!");
            // Giả lập phát âm thanh Beep lỗi
            const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...");
            audio.play().catch(e => { });
        }
    };

    const handleSimulateScan = (code: string) => {
        handleScanVerification(code);
    };

    // SAFETY LOCK CHECK
    const isAllVerified = bomComponents.length > 0 && bomComponents.every(b => b.isVerified);

    // SIMULATE: Previously produced quantity (If API not supported, default = 0)
    const previouslyProduced = 0;
    const remainingTarget = workOrder.quantity - previouslyProduced;
    const isOverProducing = Number(producedQty) > remainingTarget;

    // SUBMIT & SAVE TRANSACTION
    const handleSave = async (printLabels: boolean) => {
        if (!isAllVerified) return alert("Please verify all BOM components first!");
        if (!producedQty || Number(producedQty) <= 0) return alert("Production quantity must be greater than 0");
        if (isOverProducing && !overProduceReason.trim()) return alert("Please enter a reason for overproduction!");

        setIsSubmitting(true);
        try {
            // Gọi API Backend Transaction (Task 1, 2, 3) thông qua completeWorkOrder
            // Note: backend completeWorkOrder will create Batch, Serial, deduct inventory and close WO.
            await WorkOrderServices.completeWorkOrder(
                workOrder.workOrderId,
                { quantityProduced: Number(producedQty) }
            );

            alert("Production output recorded successfully!");

            if (printLabels) {
                // Redirect sang D.2 (Component Barcodes / Print Labels)
                // Trong môi trường React Router, sử dụng useNavigate. Ở đây ta alert mô phỏng.
                alert("Redirecting to Print Labels interface...");
                window.location.href = "/production/barcodes"; // Simulate redirect
            } else {
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            alert(error?.response?.data?.message || "Error recording production output. Please check if the Material Request has been ISSUED.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm py-10">
            <div className="bg-white w-[950px] max-h-full flex flex-col rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" /> Production Output Recording
                        </h2>
                        <p className="text-sm font-mono text-gray-300 mt-1">Verify materials and update progress.</p>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-gray-50">

                    {/* VÙNG 1: THÔNG TIN WO */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-3 gap-6">
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">WO Code</span>
                            <span className="text-lg font-mono font-black text-blue-700">{workOrder.code}</span>
                        </div>
                        <div className="col-span-1 border-l border-gray-100 pl-6">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Product</span>
                            <span className="text-sm font-bold text-gray-900 line-clamp-1">{workOrder.product.productName}</span>
                            <span className="text-xs font-mono text-gray-500 mt-0.5 block">{workOrder.product.code}</span>
                        </div>
                        <div className="col-span-1 border-l border-gray-100 pl-6 flex flex-col justify-center items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Current Output Target</span>
                            <div className="text-2xl font-black text-gray-900">
                                <span className="text-green-600">{previouslyProduced}</span> <span className="text-gray-300 text-lg">/</span> {workOrder.quantity}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-bold text-gray-900 uppercase flex items-center gap-2">
                                <ScanBarcode className="w-5 h-5 text-indigo-600" /> BOM Verification
                            </h3>
                            {isLoadingBom && <span className="text-xs text-indigo-600 font-bold flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading BOM...</span>}
                        </div>

                        <div className="flex gap-6 items-start">
                            {/* Bảng linh kiện */}
                            <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                                        <tr>
                                            <th className="p-3">Component ID / Code</th>
                                            <th className="p-3">Name</th>
                                            <th className="p-3 text-center">Qty / Unit</th>
                                            <th className="p-3 text-center w-28">Status</th>
                                            <th className="p-3 text-center w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-100">
                                        {bomComponents.map((b) => (
                                            <tr key={b.componentId} className={`transition-colors ${b.isVerified ? 'bg-green-50/50' : 'bg-white'}`}>
                                                <td className="p-3 font-mono font-bold text-gray-600">{b.component.code}</td>
                                                <td className="p-3 font-medium text-gray-900">{b.component.componentName}</td>
                                                <td className="p-3 text-center font-bold text-gray-700">{b.quantityNeeded}</td>
                                                <td className="p-3 text-center">
                                                    {b.isVerified ? (
                                                        <span className="px-2 py-1 rounded text-[10px] font-black bg-green-100 text-green-700 border border-green-200 flex justify-center items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">Pending</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {!b.isVerified && (
                                                        <button
                                                            onClick={() => handleSimulateScan(b.component.code)}
                                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                                        >
                                                            Simulate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Máy quét Simulator */}
                            <div className="w-72 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="text-xs font-bold text-gray-700 uppercase block mb-2 flex justify-between">
                                    Simulated Scanner
                                    <input
                                        id="simulated-scanner"
                                        type="text" autoFocus
                                        value={scannedCode}
                                        onChange={(e) => handleScanVerification(e.target.value)}
                                        placeholder="Scan component code..."
                                        className={`w-full p-3 border rounded-lg text-sm font-mono outline-none focus:ring-2 transition-colors ${scanError ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-indigo-500 bg-white shadow-inner'}`}
                                    />
                                    {scanError && <p className="text-[11px] text-red-600 font-bold mt-2 animate-in slide-in-from-top-1">{scanError}</p>}
                                </label>
                                <p className="text-[10px] text-gray-500 mt-3 text-center">
                                    * Section 3 will be locked until all components are verified.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`bg-white p-6 rounded-xl border shadow-sm transition-all duration-300 ${isAllVerified ? 'border-green-200 opacity-100 ring-4 ring-green-50' : 'border-gray-200 opacity-50 pointer-events-none grayscale'}`}>
                        <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
                            <CheckCircle2 className={`w-5 h-5 ${isAllVerified ? 'text-green-600' : 'text-gray-400'}`} /> Output Entry & Exception
                        </h3>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Produced Quantity <span className="text-red-500">*</span>
                                        <input
                                            type="number" min="1"
                                            value={producedQty}
                                            onChange={(e) => setProducedQty(e.target.value ? Number(e.target.value) : "")}
                                            placeholder="Enter the actual quantity produced..."
                                            className={`w-full p-3 border rounded-lg text-base font-sans mt-2
                                                font-black outline-none focus:ring-2 transition-colors ${isOverProducing ? 'border-orange-400 focus:ring-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 focus:ring-blue-500 text-blue-700'}`}
                                            id="produced-quantity"
                                        />
                                    </label>
                                    {isOverProducing && <p className="text-xs text-orange-600 font-bold mt-2">Warning: The entered production quantity exceeds the remaining target ({remainingTarget}).</p>}
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="autosn" checked={autoGenerateSN} onChange={(e) => setAutoGenerateSN(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                                    <label htmlFor="autosn" className="text-sm font-medium text-gray-700 cursor-pointer">Automatically generate serial numbers for finished products.</label>
                                </div>
                            </div>

                            {isOverProducing && (
                                <div className="space-y-2 animate-in slide-in-from-right-4">
                                    <label className="text-sm font-bold text-orange-800 flex items-center gap-1.5 mb-2">
                                        <AlertTriangle className="w-4 h-4" /> Reason for overproduction <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={overProduceReason}
                                        onChange={e => setOverProduceReason(e.target.value)}
                                        placeholder="A reason is required to record this in the ledger..."
                                        rows={3}
                                        className="w-full p-3 border border-orange-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* VÙNG 4: FOOTER ACTIONS */}
                <div className="p-5 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={isSubmitting || !isAllVerified || !producedQty || (isOverProducing && !overProduceReason.trim())}
                        className="px-6 py-2.5 bg-gray-800 text-white rounded-lg font-bold hover:bg-black flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save & Update
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={isSubmitting || !isAllVerified || !producedQty || (isOverProducing && !overProduceReason.trim())}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} Save & Print Labels
                    </button>
                </div>
            </div>
        </div>
    );
};
import {
    X, CheckCircle2, Save, Loader2, PackageCheck, 
    AlertOctagon, Boxes, Hash, Calendar, Barcode, Store
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { WorkOrderServices, type WorkOrderListItem, type CompleteWorkOrderRequest } from "../../../services/workOrderServices";

interface RecordOutputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    workOrder: WorkOrderListItem;
}

export const RecordOutputModal = ({ isOpen, onClose, onSuccess, workOrder }: RecordOutputModalProps): JSX.Element | null => {
    const [quantityProduced, setQuantityProduced] = useState<number | "">("");
    const [customBatchCode, setCustomBatchCode] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [targetWarehouseIdOverride, setTargetWarehouseIdOverride] = useState<number | "">("");
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && workOrder) {
            setQuantityProduced(workOrder.quantity);
            
            const shortWoCode = workOrder.code.replace('WO-', '');
            setCustomBatchCode(`BATCH-${shortWoCode}-${new Date().getTime().toString().slice(-4)}`);
            
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            setExpiryDate(nextYear.toISOString().split('T')[0]);

            setTargetWarehouseIdOverride(workOrder.targetSalesWarehouseId || "");
        }
    }, [isOpen, workOrder]);

    if (!isOpen) return null;

    const mrStatus = workOrder.materialRequest?.status;
    const isLocked = mrStatus !== 'ISSUED';

    const handleSubmit = async () => {
        if (isLocked) return;
        if (quantityProduced === "" || Number(quantityProduced) <= 0) {
            return alert("Actual output must be greater than 0!");
        }
        if (!customBatchCode.trim() || !expiryDate) {
            return alert("Please enter both batch code and expiry date!");
        }
        if (targetWarehouseIdOverride === "") {
            return alert("Please enter the Target Warehouse ID for finished products!");
        }

        setIsSubmitting(true);
        try {
            // Map exactly 100% of the 4 data variables to the CompleteWorkOrderRequest Interface
            const payload: CompleteWorkOrderRequest = {
                quantityProduced: Number(quantityProduced),
                customBatchCode: customBatchCode,
                expiryDate: new Date(expiryDate).toISOString(), // Parse to Backend standard ISO
                targetWarehouseIdOverride: Number(targetWarehouseIdOverride)
            };

            await WorkOrderServices.completeWorkOrder(workOrder.workOrderId, payload);

            alert("Production recorded and batch generated successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error?.response?.data?.message || "Error completing work order. Please check the information again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm py-10">
            <div className="bg-white w-[800px] max-h-full flex flex-col rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <PackageCheck className="w-5 h-5 text-blue-600" /> Production Output Recording
                        </h2>
                        <p className="text-sm font-mono text-gray-500 mt-1">Complete work order and generate product instances.</p>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white">

                    {/* WO SUMMARY INFO */}
                    <div className="flex gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase block">Work Order Code</span>
                            <span className="text-base font-bold text-blue-900">{workOrder.code}</span>
                        </div>
                        <div className="flex-1 border-l border-blue-200 pl-4">
                            <span className="text-[10px] font-bold text-blue-500 uppercase block">Target Product</span>
                            <span className="text-base font-bold text-blue-900">{workOrder.product.productName}</span>
                        </div>
                        <div className="flex-1 border-l border-blue-200 pl-4">
                            <span className="text-[10px] font-bold text-blue-500 uppercase block">Target Qty</span>
                            <span className="text-base font-bold text-blue-900">{workOrder.quantity} {workOrder.product.unit}</span>
                        </div>
                    </div>

                    {/* ZONE 1: PRE-CONDITION VALIDATION */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase">1. Material Verification</h3>
                        {isLocked ? (
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top-2">
                                <AlertOctagon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-800">Warning: This order has not been issued enough materials!</h4>
                                    <p className="text-xs text-red-700 mt-1">
                                        Material Request status: <span className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-red-100">{mrStatus || 'NULL'}</span>. 
                                        You cannot record output until the input materials have been issued (ISSUED).
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-green-800">Materials issued, eligible to record output</h4>
                                    <p className="text-xs text-green-700 mt-1">
                                        The warehouse keeper has completed the component issue process. You can proceed to finalize output and generate batches.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ZONE 2: NEW PRODUCT BATCH PARAMETERS (4 DATA VARIABLES) */}
                    <div className={`space-y-4 transition-opacity duration-300 ${isLocked ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                        <h3 className="text-sm font-bold text-gray-900 uppercase pt-2 border-t border-gray-100">2. Batch Generation Settings <span className="text-red-500">*</span></h3>
                        
                        <div className="grid grid-cols-2 gap-5">
                            {/* 1. Quantity Produced */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase" htmlFor="quantity-produced">
                                    Actual Qty (Output)
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input 
                                        id="quantity-produced"
                                        type="number" min="1"
                                        value={quantityProduced} onChange={(e) => setQuantityProduced(e.target.value === "" ? "" : Number(e.target.value))}
                                        disabled={isLocked}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>

                            {/* 2. Expiry Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase" htmlFor="expiry-date">
                                    Expiry Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input 
                                        id="expiry-date"
                                        type="date"
                                        value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* 3. Custom Batch Code */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase" htmlFor="batch-code">
                                    Batch Code
                                </label>
                                <div className="relative">
                                    <Barcode className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input 
                                        id="batch-code"
                                        type="text"
                                        value={customBatchCode} onChange={(e) => setCustomBatchCode(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-mono font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>

                            {/* 4. Target Warehouse ID */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase" htmlFor="target-warehouse">
                                    Target Warehouse ID
                                </label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input 
                                        id="target-warehouse"
                                        type="number" min="1"
                                        value={targetWarehouseIdOverride} onChange={(e) => setTargetWarehouseIdOverride(e.target.value === "" ? "" : Number(e.target.value))}
                                        disabled={isLocked}
                                        placeholder="Storage Warehouse ID..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ZONE 3: OUTPUT DATA PREVIEW */}
                    <div className={`space-y-4 transition-opacity duration-300 ${isLocked ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                        <h3 className="text-sm font-bold text-gray-900 uppercase pt-2 border-t border-gray-100">3. Output Preview</h3>
                        <div className="p-4 border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Boxes className="w-8 h-8 text-indigo-500" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Target Output to Generate</span>
                                    <p className="text-2xl font-black text-gray-900">{quantityProduced || 0} <span className="text-sm font-medium text-gray-500">{workOrder.product.unit}s</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Initial Status</span>
                                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                    PENDING_QC
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ZONE 4: FOOTER ACTIONS */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isLocked || quantityProduced === "" || !customBatchCode || !expiryDate || targetWarehouseIdOverride === ""}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                        Confirm & Generate Instances
                    </button>
                </div>
            </div>
        </div>
    );
};
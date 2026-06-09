import { 
    X, Send, Loader2, Search, PackageSearch
} from "lucide-react";
import { useState, useEffect, useRef, type JSX } from "react";
import { WorkOrderServices, type WorkOrderListItem } from "../../../services/workOrderServices";
import { MaterialRequestServices } from "../../../services/materialRequestServices";
import { ProductServices } from "../../../services/productServices"; 
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";

interface NewMaterialRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface AutoBomRow {
    componentId: number;
    componentName: string;
    unit: string;
    bomRatio: number;      
    requestQty: number;    
}

export const NewMaterialRequestModal = ({ isOpen, onClose, onSuccess }: NewMaterialRequestModalProps): JSX.Element | null => {
    const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
    const [selectedWoId, setSelectedWoId] = useState<number | "">("");
    const [selectedWo, setSelectedWo] = useState<WorkOrderListItem | null>(null);
    const [isLoadingWOs, setIsLoadingWOs] = useState(false);
    
    const [bomTableData, setBomTableData] = useState<AutoBomRow[]>([]);
    const [isFetchingBom, setIsFetchingBom] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showSuccessNotification = (message: string) => {
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        setSuccessMessage(message);
        setShowSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
            setShowSuccess(false);
            setSuccessMessage("");
        }, 2000);
    };

    const showWarningNotification = (message: string) => {
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        setWarningMessage(message);
        setShowWarning(true);
        warningTimeoutRef.current = setTimeout(() => {
            setShowWarning(false);
            setWarningMessage("");
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsLoadingWOs(true);
            WorkOrderServices.getAllWorkOrders({ limit: 500, missingMR: true })
                .then(res => {
                    const data = res.data || [];
                    const validWOs = data.filter(w => w.status === 'IN_PROGRESS');
                    setWorkOrders(validWOs);
                })
                .catch(err => console.error("Failed to load Work Orders:", err))
                .finally(() => setIsLoadingWOs(false));
        } else {
            resetModalState();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedWoId) {
            const wo = workOrders.find(w => w.workOrderId === Number(selectedWoId));
            setSelectedWo(wo || null);

            if (wo && wo.productId) {
                setIsFetchingBom(true);
                
                WorkOrderServices.getWorkOrderById(Number(selectedWoId))
                    .then(async (detailedWo) => {
                        const componentMap = new Map<number, AutoBomRow>();

                        if (detailedWo.workOrderFulfillments && detailedWo.workOrderFulfillments.length > 0) {
                            for (const fulfillment of detailedWo.workOrderFulfillments) {
                                const pr = fulfillment.productionRequest;
                                
                                if (pr.details && pr.details.length > 0) {
                                    // Use snapshot BOM details
                                    for (const detail of pr.details) {
                                        const needed = fulfillment.quantity * detail.quantityPerUnit;
                                        const current = componentMap.get(detail.componentId);
                                        if (current) {
                                            current.requestQty += needed;
                                        } else {
                                            componentMap.set(detail.componentId, {
                                                componentId: detail.componentId,
                                                componentName: detail.component.componentName,
                                                unit: detail.component.unit,
                                                bomRatio: detail.quantityPerUnit,
                                                requestQty: needed
                                            });
                                        }
                                    }
                                } else {
                                    // Fallback for legacy PR without snapshot: use live BOM
                                    try {
                                        const bomList = await ProductServices.getBOMById(pr.productId);
                                        for (const bomItem of bomList) {
                                            const needed = fulfillment.quantity * bomItem.quantityNeeded;
                                            const current = componentMap.get(bomItem.componentId);
                                            if (current) {
                                                current.requestQty += needed;
                                            } else {
                                                componentMap.set(bomItem.componentId, {
                                                    componentId: bomItem.componentId,
                                                    componentName: bomItem.component.componentName,
                                                    unit: bomItem.component.unit,
                                                    bomRatio: bomItem.quantityNeeded,
                                                    requestQty: needed
                                                });
                                            }
                                        }
                                    } catch (err) {
                                        console.error("Failed to fetch BOM for fallback:", err);
                                    }
                                }
                            }
                        } else {
                            // Standalone WO (MTS) -> use live BOM
                            try {
                                const bomList = await ProductServices.getBOMById(wo.productId);
                                for (const bomItem of bomList) {
                                    componentMap.set(bomItem.componentId, {
                                        componentId: bomItem.componentId,
                                        componentName: bomItem.component.componentName,
                                        unit: bomItem.component.unit,
                                        bomRatio: bomItem.quantityNeeded,
                                        requestQty: bomItem.quantityNeeded * wo.quantity
                                    });
                                }
                            } catch (err) {
                                console.error("Failed to fetch live BOM for standalone WO:", err);
                            }
                        }

                        setBomTableData(Array.from(componentMap.values()));
                    })
                    .catch(err => {
                        console.error("Failed to fetch Work Order details:", err);
                        setBomTableData([]);
                    })
                    .finally(() => {
                        setIsFetchingBom(false);
                    });
            }
        } else {
            setBomTableData([]);
        }
    }, [selectedWoId, workOrders]);

    const resetModalState = () => {
        setSelectedWoId("");
        setSelectedWo(null);
        setBomTableData([]);
    };

    const handleSubmit = async () => {
        if (!selectedWoId) {
            showWarningNotification("Please select a Work Order.");
            return;
        }

        setIsSubmitting(true);
        try {
            // BE automatically extracts data by workOrderId
            await MaterialRequestServices.createFromWorkOrder(Number(selectedWoId));

            showSuccessNotification("Material request submitted successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showWarningNotification("Error submitting request. Please try again!");
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
                    {/* ZONE 1: SELECT WORK ORDER */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700" htmlFor="select-work-order">
                            Select Work Order <span className="text-red-500">*</span>
                            <select 
                                value={selectedWoId} 
                                onChange={(e) => setSelectedWoId(Number(e.target.value) || "")}
                                className="w-full p-2.5 border my-2 border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                id="select-work-order"
                                name="workOrderId"
                            >
                                <option value="">{isLoadingWOs ? "Loading Work Orders..." : "-- Choose In-Progress Order --"}</option>
                                {workOrders.map(wo => (
                                    <option key={wo.workOrderId} value={wo.workOrderId}>
                                        {wo.code} - {wo.product?.productName} ({wo.status})
                                    </option>
                                ))}
                            </select>
                        </label>

                        {selectedWo && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase block">Target Product</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedWo.product?.productName}</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Planned Quantity</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedWo.quantity} {selectedWo.product?.unit || 'units'}</span>
                                </div>
                            </div>
                        )}
                    </div>
 
                    {/* ZONE 2: AUTO-BOM REQUEST DETAILS TABLE */}
                    <div className={`space-y-3 ${!selectedWoId ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-600" /> Auto-BOM Preview
                            </h3>
                            {isFetchingBom && <Loader2 className="w-4 h-4 animate-spin text-blue-600"/>}
                        </div>

                        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                                    <tr>
                                        <th className="p-3">Component Name</th>
                                        <th className="p-3">Unit</th>
                                        <th className="p-3 text-right">BOM Ratio</th>
                                        <th className="p-3 text-center bg-blue-50 text-blue-700 w-32">Request Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-100">
                                    {bomTableData.map((item) => (
                                        <tr key={item.componentId} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3 font-medium text-gray-900">{item.componentName}</td>
                                            <td className="p-3 text-gray-500">{item.unit}</td>
                                            <td className="p-3 text-right text-gray-500">{item.bomRatio}</td>
                                            <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/30">
                                                {item.requestQty}
                                            </td>
                                        </tr>
                                    ))}
                                    {bomTableData.length === 0 && !isFetchingBom && selectedWoId && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-orange-500 italic">
                                                BOM has not been configured for this product!
                                            </td>
                                        </tr>
                                    )}
                                    {!selectedWoId && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                                Please select a Work Order to load material list.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !selectedWoId || isFetchingBom || bomTableData.length === 0} 
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />} 
                        Submit Request
                    </button>
                </div>
            </div>
            <SuccessNotification isVisible={showSuccess} message={successMessage} />
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
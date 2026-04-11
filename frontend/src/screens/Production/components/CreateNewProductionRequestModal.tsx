import { 
    X, Play, Loader2, Package, Search, AlertTriangle, ListChecks, CheckCircle
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductServices, type Product } from "../../../services/productServices";
import { ProductionRequestServices, type PRPriority } from "../../../services/productionRequestServices";
import { SalesOrdersServices } from "../../../services/salesOrdersServices";
import { InventoryServices } from "../../../services/inventoryServices";
import { WarningNotification } from "../../Notification/WarningNotification";

interface CreateNewProductionRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface SOLineItem {
    detailId: number;
    code: string;
    productName: string;
    qty: number;
}

export const CreateNewProductionRequestModal = ({ isOpen, onClose, onSuccess }: CreateNewProductionRequestModalProps): JSX.Element | null => {
    const [requestType, setRequestType] = useState<'MTS' | 'MTO'>('MTS');
    const [soDetailId, setSoDetailId] = useState<number | "">("");
    const [priority, setPriority] = useState<PRPriority>('MEDIUM');
    const [productId, setProductId] = useState<number | "">("");
    const [quantity, setQuantity] = useState<number | "">("");
    const [dueDate, setDueDate] = useState<string>("");
    const [note, setNote] = useState("");

    // --- State UI & Dữ liệu API ---
    const [products, setProducts] = useState<Product[]>([]);
    const [salesOrderLines, setSalesOrderLines] = useState<SOLineItem[]>([]);
    const [isLoadingInit, setIsLoadingInit] = useState(false);
    
    const [isCheckingBom, setIsCheckingBom] = useState(false);
    const [bomResult, setBomResult] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [messageWarning, setMessageWarning] = useState("");

    useEffect(() => {
        if (isOpen) {
            setIsLoadingInit(true);
            Promise.all([
                ProductServices.getAllProducts(),
                SalesOrdersServices.getAllSalesOrders({ limit: 500 })
            ]).then(([productsData, soData]) => {
                setProducts(Array.isArray(productsData) ? productsData : (productsData as any).data || []);

                const validLines: SOLineItem[] = [];
                const orders = soData.data || [];
                
                orders.forEach(so => {
                    if (so.status === 'APPROVED' || so.status === 'IN_PROGRESS') {
                        so.details.forEach(d => {
                            const prQtyCovered = d.productionRequests?.reduce((sum, pr) => sum + pr.quantity, 0) || 0;
                            
                            if (prQtyCovered < d.quantity) {
                                validLines.push({
                                    detailId: d.soDetailId,
                                    code: so.code,
                                    productName: d.product.productName,
                                    qty: d.quantity - prQtyCovered
                                });
                            }
                        });
                    }
                });
                setSalesOrderLines(validLines);

            }).catch(err => {
                console.error("Failed to load initial data", err);
            }).finally(() => {
                setIsLoadingInit(false);
            });
        } else {
            setRequestType('MTS'); setSoDetailId(""); setProductId(""); 
            setQuantity(""); setDueDate(""); setPriority('MEDIUM'); 
            setNote(""); setBomResult([]); setShowWarningPopup(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const checkBomFeasibility = async () => {
            if (productId && quantity && Number(quantity) > 0) {
                setIsCheckingBom(true);
                try {
                    const [bomData, invData] = await Promise.all([
                        ProductServices.getBOMById(Number(productId)),
                        InventoryServices.getConsolidatedInventory({ limit: 2000 })
                    ]);

                    const inventoryList = invData.data || [];

                    const result = bomData.map((bItem: any) => {
                        const requiredQty = bItem.quantityNeeded * Number(quantity);
                        const stockItem = inventoryList.find((i: any) => i.componentId === bItem.componentId);
                        const inStock = stockItem ? stockItem.availableQuantity : 0;

                        return {
                            name: bItem.component.componentName,
                            required: requiredQty,
                            inStock: inStock,
                            status: inStock >= requiredQty ? 'Available' : 'Shortage'
                        };
                    });

                    setBomResult(result);
                } catch (error) {
                    console.error("Failed to check BOM:", error);
                    setBomResult([]);
                } finally {
                    setIsCheckingBom(false);
                }
            } else {
                setBomResult([]);
            }
        };

        const timeoutId = setTimeout(() => {
            checkBomFeasibility();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [productId, quantity]);

    useEffect(() => {
        if (requestType === 'MTS') setSoDetailId("");
    }, [requestType]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowWarning(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [showWarning])

    const handleSoDetailChange = (val: string) => {
        setSoDetailId(Number(val));
        if (val) {
            const selectedLine = salesOrderLines.find(l => l.detailId === Number(val));
            if (selectedLine) {
                const matchedProduct = products.find(p => p.productName === selectedLine.productName);
                if (matchedProduct) setProductId(matchedProduct.productId);
                setQuantity(selectedLine.qty);
            }
        }
    };


    const handleInitialSubmit = () => {
        if (!productId || !quantity || !dueDate) {
            setShowWarning(true);
            setMessageWarning("Please fill in the Product Information, Quantity, and Deadline completely.");
            return;
        }
        if (requestType === 'MTO' && !soDetailId) {
            setShowWarning(true);
            setMessageWarning("Please select a linked Sales Order for the MTO request.");
            return;
        }

        const hasShortage = bomResult.some(item => item.status === 'Shortage');
        
        if (hasShortage) {
            setShowWarningPopup(true);
        } else {
            executeCreateAPI();
        }
    };

    const executeCreateAPI = async () => {
        setShowWarningPopup(false);
        setIsSubmitting(true);
        try {
            await ProductionRequestServices.createNewProductionRequest({
                productId: Number(productId),
                quantity: Number(quantity),
                priority,
                dueDate: new Date(dueDate).toISOString(),
                soDetailId: soDetailId ? Number(soDetailId) : undefined,
                note
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error?.response?.data?.message || "Lỗi khi tạo yêu cầu sản xuất. (Sản phẩm này có thể chưa được thiết lập công thức BOM).");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = () => {
        alert("Tính năng 'Lưu Nháp' đang được cập nhật phía Backend. Vui lòng bấm 'Create Request' để tạo chính thức.");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm py-10">
            <div className="bg-white w-[900px] max-h-full flex flex-col rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200 relative">
                
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" /> Create Production Request
                        </h2>
                        <p className="text-sm font-mono text-gray-500 mt-1">Request ID: [Auto-generated after creation]</p>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    
                    <div className="space-y-5">
                        <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                            <ListChecks className="w-5 h-5 text-blue-600" /> Request Information
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Request Type <span className="text-red-500">*</span></label>
                                    <select 
                                        value={requestType} onChange={(e) => setRequestType(e.target.value as any)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="MTS">Restock (Build to Stock)</option>
                                        <option value="MTO">Build to Order (Sales Linked)</option>
                                    </select>
                                </div>

                                {requestType === 'MTO' && (
                                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                        <label className="text-sm font-bold text-blue-700">Linked Sales Order <span className="text-red-500">*</span></label>
                                        <select 
                                            value={soDetailId} onChange={(e) => handleSoDetailChange(e.target.value)}
                                            className="w-full p-2.5 border border-blue-200 bg-blue-50/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="">{isLoadingInit ? "Loading..." : "-- Select Pending Order --"}</option>
                                            {salesOrderLines.map(line => (
                                                <option key={line.detailId} value={line.detailId}>
                                                    {line.code} - {line.productName} (Need: {line.qty})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Target Product <span className="text-red-500">*</span></label>
                                    <select 
                                        value={productId} onChange={(e) => setProductId(Number(e.target.value))}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="">{isLoadingInit ? "Loading products..." : "-- Select Product --"}</option>
                                        {products.map(p => (
                                            <option key={p.productId} value={p.productId}>{p.code} - {p.productName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Priority</label>
                                    <select 
                                        value={priority} onChange={(e) => setPriority(e.target.value as PRPriority)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High (Urgent)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Quantity <span className="text-red-500">*</span></label>
                                    <input 
                                        type="number" min="1"
                                        value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                                        placeholder="Enter target quantity..."
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700">Due Date <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-600" /> Automated BOM Check
                            </h3>
                            {isCheckingBom && <span className="flex items-center gap-2 text-xs text-blue-600 font-medium"><Loader2 className="w-3.5 h-3.5 animate-spin"/> Validating materials...</span>}
                        </div>

                        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="p-3">Component Name</th>
                                        <th className="p-3 text-right">Required Qty</th>
                                        <th className="p-3 text-right">In Stock (Available)</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-100">
                                    {bomResult.length > 0 ? (
                                        bomResult.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium text-gray-900">{item.name}</td>
                                                <td className="p-3 text-right font-bold text-gray-700">{item.required}</td>
                                                <td className="p-3 text-right text-gray-600">{item.inStock}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        item.status === 'Available' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                                Please select a Product and enter Quantity to view material requirements.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Internal Note / Justification</label>
                        <textarea 
                            value={note} onChange={e => setNote(e.target.value)}
                            rows={2}
                            placeholder="Add specifics for the production line or reasoning for high priority..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3 flex-shrink-0">
                    <button 
                        onClick={handleSaveDraft} 
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        Save Draft
                    </button>
                    <button 
                        onClick={handleInitialSubmit} 
                        disabled={isSubmitting || !productId || !quantity || isCheckingBom} 
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-md transition-all"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Play className="w-5 h-5" />} 
                        Create Request
                    </button>
                </div>
            </div>

            {showWarningPopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white w-[450px] p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in">
                      <div className="flex items-center gap-4 mb-4 text-red-600">
                          <div className="p-3 bg-red-100 rounded-full">
                              <AlertTriangle className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold">Material Shortage Warning!</h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-6">
                          The system has detected that the current warehouse <b>does not have sufficient components </b> 
                          to fulfill this production request. <br/><br/>
                          Are you sure you want to continue creating this request? 
                          (The request will automatically be set to <b>Waiting Material</b> status.)
                      </p>
                      <div className="flex justify-end gap-3">
                          <button 
                              onClick={() => setShowWarningPopup(false)}
                              className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={executeCreateAPI}
                              className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md cursor-pointer transition-colors flex items-center gap-2"
                          >
                              <CheckCircle className="w-4 h-4"/> Continue Creating
                          </button>
                      </div>
                  </div>
              </div>
            )}

            <WarningNotification isVisible={showWarning} message={messageWarning} onClose={() => setShowWarning(false)}/>
        </div>
    );
};
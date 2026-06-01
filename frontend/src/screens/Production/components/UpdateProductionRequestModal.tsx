import { 
    X, RefreshCcw, Ban, AlertTriangle, CheckCircle2, 
    ShoppingCart, Loader2, Send, CheckCircle, Save, Search
} from "lucide-react";
import { useState, useEffect, useRef, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { ProductionRequestServices, type ProductionRequest, type DraftPurchaseOrderResponse, type PRPriority } from "../../../services/productionRequestServices";
import { ProductServices } from "../../../services/productServices";
import { InventoryServices } from "../../../services/inventoryServices";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { ReasonConfirmNotification } from "../../Notification/ReasonConfirmNotification";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";

interface UpdateProductionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
  onSuccess: () => void;
}

export const UpdateProductionRequestModal = ({ isOpen, onClose, requestId, onSuccess }: UpdateProductionRequestModalProps): JSX.Element | null => {
  const navigate = useNavigate();
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [requestData, setRequestData] = useState<ProductionRequest | null>(null);
  const [draftPO, setDraftPO] = useState<DraftPurchaseOrderResponse | null>(null);
  
  // --- Edit States for DRAFT ---
  const [editQty, setEditQty] = useState<number | "">("");
  const [editPriority, setEditPriority] = useState<PRPriority>("MEDIUM");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editNote, setEditNote] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showShortageConfirm, setShowShortageConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // --- Live BOM Check ---
  const [isCheckingBom, setIsCheckingBom] = useState(false);
  const [bomResult, setBomResult] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails(requestId);
    } else {
      setRequestData(null);
      setDraftPO(null);
      setEditQty("");
      setEditPriority("MEDIUM");
      setEditDueDate("");
      setEditNote("");
      setBomResult([]);
    }
  }, [isOpen, requestId]);

  useEffect(() => {
    const checkBomFeasibility = async () => {
        if (requestData && requestData.status === 'DRAFT' && editQty && Number(editQty) > 0) {
            setIsCheckingBom(true);
            try {
                const [bomData, invData] = await Promise.all([
                    ProductServices.getBOMById(requestData.productId),
                    InventoryServices.getConsolidatedInventory({ limit: 2000 })
                ]);

                const inventoryList = invData.data || [];

                const result = bomData.map((bItem: any) => {
                    const requiredQty = bItem.quantityNeeded * Number(editQty);
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
}, [requestData?.productId, editQty, requestData?.status]);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  const fetchRequestDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await ProductionRequestServices.getProductionRequestById(id);
      setRequestData(data);

      // Initialize edit states
      setEditQty(data.quantity);
      setEditPriority(data.priority);
      setEditDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "");
      setEditNote(data.note || "");
      
      if (data.status === 'WAITING_MATERIAL') {
         const poData = await ProductionRequestServices.getDraftPurchaseOrder(id);
         setDraftPO(poData);
      }
    } catch (error) {
      console.error("Failed to load request details", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage("");
    }, 1200);
  };

  const showWarningNotification = (message: string) => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    setWarningMessage(message);
    setShowWarning(true);
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      setWarningMessage("");
      warningTimeoutRef.current = null;
    }, 2000);
  };

  const closeAfterSuccess = (message: string) => {
    showSuccessNotification(message);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 700);
  };

  const handleUpdateDraft = async () => {
    if (!requestId || !requestData) return;
    if (!editQty || Number(editQty) <= 0) {
        showWarningNotification("Quantity must be greater than 0");
        return;
    }

    setIsActionLoading(true);
    try {
        await ProductionRequestServices.updateProductionRequest(requestId, {
            quantity: Number(editQty),
            priority: editPriority,
            dueDate: editDueDate || undefined,
            note: editNote
        });
        showSuccessNotification("Draft updated successfully!");
        fetchRequestDetails(requestId); // Refresh data
        onSuccess(); // Refresh parent list
    } catch (error: any) {
        showWarningNotification(error.response?.data?.message || "Failed to update draft.");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleRecheck = async () => {
    if (!requestId) return;
    setIsActionLoading(true);
    try {
      const response = await ProductionRequestServices.recheckFeasibility(requestId);
      
      if (response.status === 'APPROVED') {
        closeAfterSuccess("Re-check successful! Materials are now reserved. Status changed to APPROVED.");
      } else {
        showWarningNotification("Still missing materials. Check the shortage list.");
        fetchRequestDetails(requestId);
      }
    } catch (error: any) {
      showWarningNotification(error.response?.data?.message || "Error while re-checking materials.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!requestId) return;
    const canCancel =
      requestData?.status === 'PENDING' ||
      requestData?.status === 'WAITING_MATERIAL' ||
      requestData?.status === 'APPROVED';

    if (!canCancel) {
      showWarningNotification("Cannot cancel. Only PENDING, WAITING_MATERIAL, and APPROVED production requests can be cancelled.");
      return;
    }

    setCancelReason("");
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!requestId || !cancelReason.trim()) return;

    setIsActionLoading(true);
    try {
      await ProductionRequestServices.cancelProductionRequest(requestId, cancelReason.trim());
      setShowCancelConfirm(false);
      closeAfterSuccess("Production request cancelled successfully.");
    } catch (error: any) {
      setShowCancelConfirm(false);
      showWarningNotification(error.response?.data?.message || "Error while cancelling request.");
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleSubmitRequest = async () => {
    if (!requestId) return;

    const hasShortage = bomResult.some(item => item.status === 'Shortage');
    if (hasShortage) {
        setShowShortageConfirm(true);
        return;
    }

    submitProductionRequest();
  };

  const submitProductionRequest = async () => {
    if (!requestId) return;

    setIsActionLoading(true);
    try {
      await ProductionRequestServices.submitProductionRequest(requestId);
      setShowShortageConfirm(false);
      closeAfterSuccess("Production Request submitted successfully!");
    } catch (error: any) {
      showWarningNotification(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleApproveRequest = async () => {
    if (!requestId) return;
    setIsActionLoading(true);
    try {
      await ProductionRequestServices.approveProductionRequest(requestId);
      closeAfterSuccess("Production Request approved!");
    } catch (error: any) {
      showWarningNotification(error.response?.data?.message || "Failed to approve request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const canCancelRequest =
    requestData?.status === 'PENDING' ||
    requestData?.status === 'WAITING_MATERIAL' ||
    requestData?.status === 'APPROVED';

  if (!isOpen || !requestId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[800px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Manage Production Request
            </h2>
            <p className="text-sm font-mono text-gray-500 mt-1">{requestData?.code || 'Loading...'}</p>
          </div>
          <button onClick={onClose} disabled={isActionLoading} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : requestData ? (
            <>
              {/* General Info / Edit Form */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Information</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${requestData.soDetailId ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {requestData.soDetailId ? 'MTO (Linked to SO)' : 'MTS (Make to Stock)'}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Target Product</label>
                        <div className="font-bold text-gray-900 border-b border-transparent py-1">{requestData.product?.productName}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Quantity ({requestData.product?.unit})</label>
                        {requestData.status === 'DRAFT' ? (
                            <input 
                                type="number" 
                                value={editQty} 
                                onChange={(e) => setEditQty(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full text-sm font-bold text-blue-600 bg-blue-50/50 border border-blue-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400 Transition-all"
                            />
                        ) : (
                            <div className="font-bold text-gray-900 py-1">{requestData.quantity}</div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Priority</label>
                        {requestData.status === 'DRAFT' ? (
                           <select 
                             value={editPriority}
                             onChange={(e) => setEditPriority(e.target.value as PRPriority)}
                             className="w-full text-sm font-bold text-blue-600 bg-blue-50/50 border border-blue-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                           >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                           </select>
                        ) : (
                            <div className="font-bold text-gray-900 py-1 uppercase">{requestData.priority}</div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Due Date</label>
                        {requestData.status === 'DRAFT' ? (
                            <input 
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                className="w-full text-sm font-bold text-blue-600 bg-blue-50/50 border border-blue-100 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                            />
                        ) : (
                            <div className="font-bold text-gray-900 py-1">{requestData.dueDate ? new Date(requestData.dueDate).toLocaleDateString() : 'N/A'}</div>
                        )}
                    </div>

                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Note / Justification</label>
                        {requestData.status === 'DRAFT' ? (
                            <textarea 
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                rows={2}
                                className="w-full text-sm font-medium text-blue-800 bg-blue-50/30 border border-blue-100 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                                placeholder="Add specifics why this request is needed..."
                            />
                        ) : (
                            <div className="text-sm text-gray-600 italic py-1">{requestData.note || 'No notes provided.'}</div>
                        )}
                    </div>
                </div>

                {requestData.status === 'DRAFT' && (
                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={handleUpdateDraft}
                            disabled={isActionLoading}
                            className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />}
                            Save Draft Changes
                        </button>
                    </div>
                )}
              </div>

              {/* Automated BOM Check for Drafts */}
              {requestData.status === 'DRAFT' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-500" /> Automated BOM Check
                    </h3>
                    {isCheckingBom && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100/50 text-gray-400 font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-2">Component Name</th>
                                <th className="px-4 py-2 text-right">Required</th>
                                <th className="px-4 py-2 text-right">In Stock</th>
                                <th className="px-4 py-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {bomResult.length > 0 ? (
                                bomResult.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2.5 font-medium text-gray-700">{item.name}</td>
                                        <td className="px-4 py-2.5 text-right font-bold">{item.required}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-500">{item.inStock}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                item.status === 'Available' 
                                                ? 'bg-green-50 text-green-600 border-green-100' 
                                                : 'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                                        {isCheckingBom ? 'Calculating components...' : 'No BOM data available for this product.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status & Actions Area (Traffic Light Logic) */}
              {requestData.status === 'WAITING_MATERIAL' && (
                <div className="bg-red-50 border border-red-200 p-5 rounded-lg space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h3 className="text-base font-bold text-red-800">Waiting for Materials</h3>
                            <p className="text-sm text-red-700 mt-1">
                                This request cannot proceed because there are missing components in the warehouse. 
                                Please purchase the missing items and click "Re-check" when they arrive.
                            </p>
                        </div>
                    </div>

                    {draftPO && draftPO.components.length > 0 && (
                        <div className="mt-4 bg-white border border-red-100 rounded-md overflow-hidden">
                            <div className="bg-red-100 px-4 py-2 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-red-700" />
                                <span className="text-xs font-bold text-red-800 uppercase">Required Purchases</span>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-2">Component</th>
                                        <th className="px-4 py-2 text-right">Required</th>
                                        <th className="px-4 py-2 text-right">Available</th>
                                        <th className="px-4 py-2 text-right">Shortage</th>
                                        <th className="px-4 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draftPO.components.map(comp => (
                                        <tr key={comp.componentId} className="border-b border-gray-50">
                                            <td className="px-4 py-2 font-medium">{comp.componentName} <span className="text-xs text-gray-400 block">{comp.componentCode}</span></td>
                                            <td className="px-4 py-2 text-right">{comp.requiredQty}</td>
                                            <td className="px-4 py-2 text-right text-green-600">{comp.availableQty}</td>
                                            <td className="px-4 py-2 text-right font-bold text-red-600">{comp.shortageQty}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button 
                                                    onClick={() => {
                                                        onClose();
                                                        navigate('/components/create-order', { 
                                                        state: { 
                                                            draftPO: {
                                                                ...draftPO,
                                                                components: [comp]
                                                            }
                                                        } 
                                                    });
                                                    }}
                                                    className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                                                >
                                                    Create PO
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
              )}

              {requestData.status === 'APPROVED' && (
                  <div className="bg-green-50 border border-green-200 p-5 rounded-lg flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                          <h3 className="text-base font-bold text-green-800">Ready for Production</h3>
                          <p className="text-sm text-green-700 mt-1">
                              All required materials are available and reserved. You can now convert this request into a Work Order.
                          </p>
                      </div>
                  </div>
              )}

              {requestData.status === 'PENDING' && (
                  <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                      <div>
                          <h3 className="text-base font-bold text-yellow-800">Pending Approval</h3>
                          <p className="text-sm text-yellow-700 mt-1">
                              This request has been submitted and is currently awaiting manager review and approval.
                          </p>
                      </div>
                  </div>
              )}

              {requestData.status === 'DRAFT' && (
                  <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                      <div>
                          <h3 className="text-base font-bold text-gray-700">Draft Request</h3>
                          <p className="text-sm text-gray-500 mt-1">
                              This request is still a draft. Please review the details and submit it for processing.
                          </p>
                      </div>
                  </div>
              )}
            </>
          ) : (
            <div className="text-center text-red-500 py-10">Error loading data.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-between">
            <button 
              onClick={handleCancel} 
              disabled={isActionLoading || !canCancelRequest}
              title={canCancelRequest ? "Cancel Request" : "Only PENDING, WAITING_MATERIAL, and APPROVED requests can be cancelled"}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-4 h-4" /> Cancel Request
            </button>
            
            <div className="flex gap-3">
                <button onClick={onClose} disabled={isActionLoading} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50">
                    Close
                </button>
                
                {requestData?.status === 'WAITING_MATERIAL' && (
                    <button 
                        onClick={handleRecheck} 
                        disabled={isActionLoading} 
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
                    >
                        {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCcw className="w-4 h-4" />} 
                        {isActionLoading ? "Checking..." : "Re-check Feasibility"}
                    </button>
                )}

                {requestData?.status === 'DRAFT' && (
                  <button 
                      onClick={handleSubmitRequest} 
                      disabled={isActionLoading} 
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
                  >
                      {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} 
                      {isActionLoading ? "Submitting..." : "Submit Request"}
                  </button>
                )}

                {requestData?.status === 'PENDING' && (
                  <button 
                      onClick={handleApproveRequest} 
                      disabled={isActionLoading} 
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
                  >
                      {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4" />} 
                      {isActionLoading ? "Approving..." : "Approve Request"}
                  </button>
                )}
            </div>
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
      <ConfirmNotification
        isOpen={showShortageConfirm}
        title="Submit With Material Shortage"
        message="Shortages detected. Inventory does not have enough components, so this request will move to WAITING_MATERIAL status. Do you want to proceed?"
        confirmLabel="Submit Anyway"
        variant="danger"
        isProcessing={isActionLoading}
        onConfirm={submitProductionRequest}
        onClose={() => {
          if (!isActionLoading) setShowShortageConfirm(false);
        }}
      />
      <ReasonConfirmNotification
        isOpen={showCancelConfirm}
        title="Cancel Production Request"
        message="Please enter a reason before cancelling this production request."
        reason={cancelReason}
        reasonPlaceholder="Enter cancellation reason..."
        confirmLabel="Cancel Request"
        isProcessing={isActionLoading}
        onReasonChange={setCancelReason}
        onConfirm={handleConfirmCancel}
        onClose={() => {
          if (!isActionLoading) setShowCancelConfirm(false);
        }}
      />
    </div>
  );
};

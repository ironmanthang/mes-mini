import { 
    X, RefreshCcw, Ban, AlertTriangle, CheckCircle2, 
    ShoppingCart, Loader2 
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductionRequestServices, type ProductionRequest, type DraftPurchaseOrderResponse } from "../../../services/productionRequestServices";

interface UpdateProductionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
  onSuccess: () => void;
}

export const UpdateProductionRequestModal = ({ isOpen, onClose, requestId, onSuccess }: UpdateProductionRequestModalProps): JSX.Element | null => {
  const [requestData, setRequestData] = useState<ProductionRequest | null>(null);
  const [draftPO, setDraftPO] = useState<DraftPurchaseOrderResponse | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetails(requestId);
    } else {
      setRequestData(null);
      setDraftPO(null);
    }
  }, [isOpen, requestId]);

  const fetchRequestDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await ProductionRequestServices.getProductionRequestById(id);
      setRequestData(data);
      
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

  const handleRecheck = async () => {
    if (!requestId) return;
    setIsActionLoading(true);
    try {
      const response = await ProductionRequestServices.recheckFeasibility(requestId);
      
      if (response.status === 'APPROVED') {
        alert("✅ Re-check successful! Materials are now reserved. Status changed to APPROVED.");
        onSuccess();
        onClose();
      } else {
        alert("⚠️ Still missing materials. Check the shortage list.");
        fetchRequestDetails(requestId);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi kiểm tra lại vật tư.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!requestId) return;
    const reason = window.prompt("Vui lòng nhập lý do hủy yêu cầu sản xuất này:");
    if (reason === null) return;

    setIsActionLoading(true);
    try {
      await ProductionRequestServices.cancelProductionRequest(requestId, reason);
      alert("Đã hủy yêu cầu sản xuất thành công.");
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi hủy yêu cầu.");
    } finally {
      setIsActionLoading(false);
    }
  };

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
              {/* General Info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-lg border border-gray-200">
                <div><span className="text-gray-500">Product:</span> <span className="font-bold text-gray-900 ml-1">{requestData.product?.productName}</span></div>
                <div><span className="text-gray-500">Quantity:</span> <span className="font-bold text-gray-900 ml-1">{requestData.quantity} {requestData.product?.unit}</span></div>
                <div><span className="text-gray-500">Priority:</span> <span className="font-bold text-gray-900 ml-1">{requestData.priority}</span></div>
                <div><span className="text-gray-500">Type:</span> <span className="font-bold text-gray-900 ml-1">{requestData.soDetailId ? 'MTO (Sales Order)' : 'MTS (Make to Stock)'}</span></div>
              </div>

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
                                    </tr>
                                </thead>
                                <tbody>
                                    {draftPO.components.map(comp => (
                                        <tr key={comp.componentId} className="border-b border-gray-50">
                                            <td className="px-4 py-2 font-medium">{comp.componentName} <span className="text-xs text-gray-400 block">{comp.componentCode}</span></td>
                                            <td className="px-4 py-2 text-right">{comp.requiredQty}</td>
                                            <td className="px-4 py-2 text-right text-green-600">{comp.availableQty}</td>
                                            <td className="px-4 py-2 text-right font-bold text-red-600">{comp.shortageQty}</td>
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
            </>
          ) : (
            <div className="text-center text-red-500 py-10">Error loading data.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-between">
            <button 
              onClick={handleCancel} 
              disabled={isActionLoading || requestData?.status === 'FULFILLED' || requestData?.status === 'CANCELLED'} 
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
            </div>
        </div>

      </div>
    </div>
  );
};
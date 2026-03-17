import { 
  Factory, 
  CalendarDays,
  ArrowRight,
  Loader2,
  Package,
  Hash,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductionRequestServices, type ProductionRequest } from "../../../services/productionRequestServices";
import { ProductionLineServices, type ProductionLine } from "../../../services/productionLineServices";
import { ConfirmCreateWOModal } from "./ConfirmCreateWOModal";
import { SuccessNotification } from "../../UserAndSystem/components/SuccessNotification";

export const CreateWorkOrder = (): JSX.Element => {
  const [approvedRequests, setApprovedRequests] = useState<ProductionRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [isLoadingLines, setIsLoadingLines] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedRequestId, setSelectedRequestId] = useState<number | "">("");
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchApprovedRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await ProductionRequestServices.getAllProductionRequests({ status: 'APPROVED' });
      //@ts-expect-error have data
      const data = Array.isArray(response) ? response : response.data || [];
      setApprovedRequests(data);
    } catch (error) {
      console.error("Failed to fetch approved requests", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchProductionLines = async () => {
    setIsLoadingLines(true);
    try {
      const response = await ProductionLineServices.getAllProductionLines();
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setProductionLines(data);
    } catch (error) {
      console.error("Failed to fetch production lines", error);
    } finally {
      setIsLoadingLines(false);
    }
  };

  useEffect(() => {
    fetchApprovedRequests();
    fetchProductionLines();
  }, []);

  const selectedRequest = approvedRequests.find(r => r.productionRequestId === selectedRequestId);
  const selectedLine = productionLines.find(l => l.productionLineId === selectedLineId);

  const executeCreateWorkOrder = async () => {
    setIsSubmitting(true);
    try {
      await ProductionRequestServices.convertToWorkOrder(
        [Number(selectedRequestId)], 
        Number(selectedLineId)
      );
      
      alert("✅ Work Order Created Successfully!");
      setShowSuccess(true);
      setSelectedRequestId("");
      setSelectedLineId("");
      setIsConfirmModalOpen(false);
      fetchApprovedRequests();
      fetchProductionLines();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create Work Order.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirmModal = () => {
    if (!selectedRequestId || !selectedLineId) {
      alert("Please select both a Production Request and a Production Line.");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Create Work Order
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Convert an Approved Production Request into an active Work Order.
          </p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                        Production Request<span className="text-red-500">*</span>
                        {isLoadingRequests && <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-2" />}
                    </label>
                    <select
                        value={selectedRequestId}
                        onChange={(e) => setSelectedRequestId(e.target.value === "" ? "" : Number(e.target.value))}
                        disabled={isLoadingRequests || isSubmitting}
                        className="w-full p-3 border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 outline-none text-sm 
                        bg-white cursor-pointer disabled:bg-gray-50"
                    >
                        <option value="">
                            {isLoadingRequests ? "Loading requests..." : "-- Select an Approved Request --"}
                        </option>
                        {approvedRequests.map((req) => (
                            <option key={req.productionRequestId} value={req.productionRequestId}>
                                {req.code} — {req.product?.productName} (Qty: {req.quantity})
                            </option>
                        ))}
                    </select>
                    {!isLoadingRequests && approvedRequests.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">No approved requests found. Please approve a request first.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                        Production Line<span className="text-red-500">*</span>
                        {isLoadingLines && <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-2" />}
                    </label>

                    {isLoadingLines ? (
                        <div className="text-sm text-gray-500 py-2">Loading production lines...</div>
                    ) : productionLines.length === 0 ? (
                        <div className="text-sm text-red-500 py-2">No production lines configured in the system.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {productionLines.map((line) => {
                                const activeWOs = line._count?.workOrders || 0;
                                return (
                                    <label 
                                        key={line.productionLineId} 
                                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                            selectedLineId === line.productionLineId 
                                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="radio" 
                                                name="productionLine"
                                                value={line.productionLineId}
                                                disabled={isSubmitting}
                                                checked={selectedLineId === line.productionLineId}
                                                onChange={(e) => setSelectedLineId(Number(e.target.value))}
                                                className="w-4 h-4 text-blue-600 cursor-pointer disabled:cursor-not-allowed"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{line.lineName}</span>
                                                <span className="text-xs text-gray-500">Location: {line.location}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                                            activeWOs === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                        }`}>
                                            {activeWOs === 0 ? "Idle" : `${activeWOs} Active WOs`}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Nút Submit */}
                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={handleOpenConfirmModal}
                        disabled={isSubmitting || !selectedRequestId || !selectedLineId}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2EE59D] text-white font-bold rounded-lg hover:bg-[#25D390] transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Factory className="w-5 h-5" />}
                        {isSubmitting ? "Creating..." : "Confirm & Create Work Order"}
                    </button>
                </div>
            </div>
          </div>

          <div className="lg:col-span-1 h-full">
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 h-full flex flex-col">
               <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        Selected Request Info
                    </label>
               </div>
            
               <div className="flex-1 flex flex-col">
                   {selectedRequest ? (
                      <div className="space-y-4">
                          <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
                              <p className="text-xs font-bold text-green-600 mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> APPROVED
                              </p>
                              <h4 className="font-mono text-lg font-bold text-gray-900">{selectedRequest.code}</h4>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                 <CalendarDays className="w-3 h-3" />
                                 {new Date(selectedRequest.requestDate).toLocaleDateString('vi-VN')}
                              </p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3 text-sm">
                              <div>
                                  <span className="text-gray-500 block text-xs">Target Product:</span>
                                  <span className="font-bold text-gray-900">{selectedRequest.product?.productName}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                  <span className="text-gray-500 text-xs">Quantity to Produce:</span>
                                  <span className="font-bold text-blue-600 text-base">{selectedRequest.quantity} <span className="text-xs font-normal text-gray-500">{selectedRequest.product?.unit}</span></span>
                              </div>
                              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                  <span className="text-gray-500 text-xs">Priority:</span>
                                  <span className={`font-bold ${
                                      selectedRequest.priority === 'HIGH' ? 'text-red-600' : 
                                      selectedRequest.priority === 'MEDIUM' ? 'text-orange-500' : 'text-green-600'
                                  }`}>
                                      {selectedRequest.priority}
                                  </span>
                              </div>
                              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                  <span className="text-gray-500 text-xs">Type:</span>
                                  <span className="font-medium text-gray-700 flex items-center gap-1">
                                      <Hash className="w-3 h-3" />
                                      {selectedRequest.soDetailId ? "Make to Order (Sales)" : "Make to Stock"}
                                  </span>
                              </div>
                          </div>
                      </div>
                   ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-white">
                           <ArrowRight className="w-10 h-10 mb-3 opacity-30" />
                           <p className="text-sm">Select a Production Request from the list to view its details.</p>
                       </div>
                   )}
               </div>
            </div>
          </div>

      </div>

      <ConfirmCreateWOModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeCreateWorkOrder}
        isSubmitting={isSubmitting}
        requestDetails={selectedRequest ? {
            code: selectedRequest.code,
            productName: selectedRequest.product?.productName || "Unknown Product",
            quantity: selectedRequest.quantity
        } : null}
        lineName={selectedLine?.lineName || "Unknown Line"}
      />

      <SuccessNotification isVisible={showSuccess}/>
    </div>
  );
};
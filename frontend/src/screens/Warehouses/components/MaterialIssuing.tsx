import { 
  Search, ArrowLeft, PackageCheck,
  CheckCircle2, Send, Loader2, Layers,
  AlertCircle, ClipboardCheck
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { MaterialRequestServices, type MaterialRequest, type ValidationLine } from "../../../services/materialRequestServices";
import { WarehouseServices, type Warehouse } from "../../../services/warehouseServices";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";

export const MaterialIssuing = (): JSX.Element => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [validationLines, setValidationLines] = useState<ValidationLine[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIssueConfirmOpen, setIsIssueConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | "">("");

  useEffect(() => {
    WarehouseServices.getAllWarehouse({ type: 'COMPONENT' })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setWarehouses(list);
        if (list.length > 0) {
          setSelectedWarehouseId(list[0].warehouseId);
        }
      })
      .catch(err => console.error("Failed to load warehouses:", err));
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await MaterialRequestServices.getAllMaterialRequests({ 
        status: "PENDING"
      });
      
      const sortedData = (response.data || []).sort((a, b) => 
        new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
      );
      
      setRequests(sortedData);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage("");
    }, 1200);
  };

  const showWarningNotification = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
  };

  const handleValidate = async () => {
    if (!selectedRequest || !selectedWarehouseId) return;
    
    setIsValidating(true);
    try {
      const res = await MaterialRequestServices.validateMaterial(
        selectedRequest.requestId, 
        selectedWarehouseId
      );
      setValidationLines(res.lines || []);
      setHasValidated(true);
    } catch (err) {
      console.error("Validation failed", err);
      showWarningNotification("Error checking inventory.");
    } finally {
      setIsValidating(false);
    }
  };

  const isAllAvailable = useMemo(() => {
    return hasValidated && validationLines.length > 0 && validationLines.every(line => line.isSufficient);
  }, [hasValidated, validationLines]);

  const handleConfirmIssue = () => {
    if (!isAllAvailable || !selectedRequest || !selectedWarehouseId) return;
    setIsIssueConfirmOpen(true);
  };

  const handleCompleteIssue = async () => {
    if (!isAllAvailable || !selectedRequest || !selectedWarehouseId) return;

    setIsSubmitting(true);
    try {
      const consumedLotsPayload = [];

      for (const line of validationLines) {
        let remainingToFulfill = line.requiredQuantity;

        if (line.availableLots && line.availableLots.length > 0) {
          for (const lot of line.availableLots) {
            if (remainingToFulfill <= 0) break;

            const quantityToTake = Math.min(remainingToFulfill, lot.currentQuantity);
            
            consumedLotsPayload.push({
              componentId: line.componentId,
              lotCode: lot.lotCode,
              quantity: quantityToTake,
            });

            remainingToFulfill -= quantityToTake;
          }
        }
      }

      await MaterialRequestServices.completeMaterialIssue(selectedRequest.requestId, {
        warehouseId: selectedWarehouseId,
        consumedLots: consumedLotsPayload 
      });
      
      showSuccessNotification("Material components issued successfully!");
      fetchRequests(); 
      setSelectedRequest(null);
      setHasValidated(false);
      setValidationLines([]);
      setIsIssueConfirmOpen(false);
    } catch (e: any) {
      showWarningNotification(e?.response?.data?.message || "Error during material issuing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const searchStr = searchQuery.toLowerCase();
      return req.code?.toLowerCase().includes(searchStr) || 
             req.workOrder?.code?.toLowerCase().includes(searchStr);
    });
  }, [requests, searchQuery]);

  const notifications = (
    <>
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
        isOpen={isIssueConfirmOpen}
        title="Complete Material Issue"
        message="Are you sure you want to issue these material components from the selected warehouse?"
        confirmLabel="Complete & Issue"
        variant="primary"
        isProcessing={isSubmitting}
        onConfirm={handleCompleteIssue}
        onClose={() => {
          if (!isSubmitting) setIsIssueConfirmOpen(false);
        }}
      />
    </>
  );

  if (!selectedRequest) {
    return (
      <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <PackageCheck className="w-6 h-6 text-blue-600" /> Material Issuing
              </h2>
              <p className="text-sm text-gray-500 mt-1">Manage and process component issue requests from the production shop.</p>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" placeholder="Search by request code, work order..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="p-4">Request Code</th>
                    <th className="p-4">Work Order</th>
                    <th className="p-4">Request Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{req.code}</td>
                      <td className="p-4 font-medium text-gray-700">{req.workOrder?.code}</td>
                      <td className="p-4 text-gray-600">
                          {new Date(req.requestDate).toLocaleString('en-US')}
                      </td>
                      <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase border border-yellow-200">PENDING</span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="px-6 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-xs cursor-pointer shadow-sm"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-gray-400 italic">No pending requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {notifications}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300">
      
      <div className="flex items-center gap-4">
        <button onClick={() => { setSelectedRequest(null); setHasValidated(false); }} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Material Issue Processing</h2>
          <p className="text-sm text-gray-500 font-mono">Process inventory check and issue for request: {selectedRequest.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Request Code</span>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.code}</p>
              </div>
              <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Work Order</span>
                  <p className="text-sm font-bold text-gray-900">{selectedRequest.workOrder?.code}</p>
              </div>
              <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Request Date</span>
                  <p className="text-sm font-bold text-gray-900">{new Date(selectedRequest.requestDate).toLocaleDateString('en-US')}</p>
              </div>
              <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                  <p className="text-sm font-bold text-yellow-600">PENDING</p>
              </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
               <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                 <Layers className="w-5 h-5 text-blue-600" /> Validation Table
               </h3>
               {isValidating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                    <tr>
                        <th className="p-4">Component Name</th>
                        <th className="p-4 text-right">Required Qty</th>
                        <th className="p-4 text-center">Availability</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {(hasValidated ? validationLines : (selectedRequest.details || [])).map((line: any, idx) => {
                      const isSufficient = hasValidated ? (line as ValidationLine).isSufficient : null;
                      
                      // Calculate lot allocations inline for picking guidance
                      const allocations: { lotCode: string; quantityToTake: number; currentQuantity: number }[] = [];
                      if (hasValidated && isSufficient) {
                        let remainingToFulfill = (line as ValidationLine).requiredQuantity;
                        if ((line as ValidationLine).availableLots && (line as ValidationLine).availableLots.length > 0) {
                          for (const lot of (line as ValidationLine).availableLots) {
                            if (remainingToFulfill <= 0) break;
                            const qty = Math.min(remainingToFulfill, lot.currentQuantity);
                            allocations.push({
                              lotCode: lot.lotCode,
                              quantityToTake: qty,
                              currentQuantity: lot.currentQuantity
                            });
                            remainingToFulfill -= qty;
                          }
                        }
                      }

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-4 font-medium text-gray-900">
                                <div>{hasValidated ? (line as ValidationLine).componentName : line.component?.componentName}</div>
                                {allocations.length > 0 && (
                                  <div className="mt-1 pl-4 text-xs text-gray-500 font-mono space-y-0.5">
                                    {allocations.map((alloc, aIdx) => (
                                      <div key={aIdx}>
                                        - {alloc.lotCode} (Pick {alloc.quantityToTake} / Stock {alloc.currentQuantity})
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </td>
                            <td className="p-4 text-right font-bold text-gray-700">
                                {hasValidated ? (line as ValidationLine).requiredQuantity : line.quantity}
                            </td>
                            <td className="p-4 text-center">
                                {!hasValidated ? (
                                    <span className="text-gray-300 italic text-xs">Awaiting check...</span>
                                ) : isSufficient ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                        <CheckCircle2 className="w-3 h-3" /> AVAILABLE
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                        <AlertCircle className="w-3 h-3" /> SHORTAGE
                                    </span>
                                )}
                            </td>
                        </tr>
                      )
                    })}
                </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-3">Actions</h3>
            
            {/* WAREHOUSE SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700" htmlFor="select-warehouse">
                Source Component Warehouse <span className="text-red-500">*</span>
              </label>
              <select 
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(Number(e.target.value) || "");
                  setHasValidated(false);
                  setValidationLines([]);
                }}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                id="select-warehouse"
                name="warehouseId"
                disabled={isValidating || isSubmitting}
              >
                <option value="">-- Select Warehouse --</option>
                {warehouses.map(wh => (
                  <option key={wh.warehouseId} value={wh.warehouseId}>
                    {wh.warehouseName} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={handleValidate}
                    disabled={isValidating || isSubmitting || !selectedWarehouseId}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50 cursor-pointer"
                >
                    {isValidating ? <Loader2 className="w-5 h-5 animate-spin"/> : <ClipboardCheck className="w-5 h-5" />} 
                    Step 1: Validate Stock
                </button>

                <button 
                    onClick={handleConfirmIssue}
                    disabled={!isAllAvailable || isSubmitting || !selectedWarehouseId}
                    className={`w-full flex items-center justify-center gap-2 py-4 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer
                        ${isAllAvailable ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 grayscale cursor-not-allowed opacity-60'}
                    `}
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />} 
                    Step 2: Complete & Issue
                </button>
            </div>

            {!hasValidated && (
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="text-[11px] text-orange-700 leading-relaxed">
                        <b>Instructions:</b> Select a warehouse and click <b>Validate Stock</b> to check inventory before issuing components.
                    </p>
                </div>
            )}
            {hasValidated && !isAllAvailable && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-[11px] text-red-700 leading-relaxed font-bold">
                        Insufficient stock! Cannot proceed with issuing. Please check physical inventory.
                    </p>
                </div>
            )}
          </div>
        </div>

      </div>
      {notifications}
    </div>
  );
};

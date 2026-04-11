import { 
  Factory, Loader2, Package, 
  AlertTriangle, ListChecks, Info, Clock, Save, Play
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductionRequestServices, type ProductionRequestById } from "../../../services/productionRequestServices";
import { ProductionLineServices, type ProductionLine } from "../../../services/productionLineServices";
import { ProductServices } from "../../../services/productServices";
import { InventoryServices } from "../../../services/inventoryServices";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";

export const CreateWorkOrder = (): JSX.Element => {
  const [validRequests, setValidRequests] = useState<any[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [selectedPrDetail, setSelectedPrDetail] = useState<ProductionRequestById | null>(null);
  
  const [selectedRequestId, setSelectedRequestId] = useState<number | "">("");
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const [quantityToProduce, setQuantityToProduce] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");

  const [isLoadingInit, setIsLoadingInit] = useState(true);
  const [, setIsLoadingPr] = useState(false);
  const [isCheckingBom, setIsCheckingBom] = useState(false);
  const [bomAllocation, setBomAllocation] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWaring] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [prRes, lineRes] = await Promise.all([
          ProductionRequestServices.getAllProductionRequests({ limit: 1000 }),
          ProductionLineServices.getAllProductionLines()
        ]);
        const prList = (prRes.data || []).filter((r: any) => 
          r.status === 'APPROVED' || r.status === 'IN_PROGRESS'
        );
        setValidRequests(prList);
        setProductionLines(Array.isArray(lineRes) ? lineRes : (lineRes as any).data || []);
      } catch (error) {
        console.error("Init failed", error);
      } finally {
        setIsLoadingInit(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (selectedRequestId) {
      setIsLoadingPr(true);
      ProductionRequestServices.getProductionRequestById(Number(selectedRequestId))
        .then(details => {
          setSelectedPrDetail(details);
          const scheduledQty = details.workOrderFulfillments?.reduce((sum, f) => sum + (f.workOrder?.quantity || 0), 0) || 0;
          const remaining = Math.max(0, details.quantity - scheduledQty);
          
          setQuantityToProduce(remaining);
          setStartDate(new Date().toISOString().slice(0, 16));
        })
        .finally(() => setIsLoadingPr(false));
    } else {
      setSelectedPrDetail(null);
      setQuantityToProduce("");
    }
  }, [selectedRequestId]);

  useEffect(() => {
    const checkAllocation = async () => {
      if (selectedPrDetail && quantityToProduce && Number(quantityToProduce) > 0) {
        setIsCheckingBom(true);
        try {
          const [bomData, invData] = await Promise.all([
            ProductServices.getBOMById(selectedPrDetail.productId),
            InventoryServices.getConsolidatedInventory({ limit: 2000 })
          ]);
          
          const inventory = invData.data || [];
          const result = bomData.map((b: any) => {
            const required = b.quantityNeeded * Number(quantityToProduce);
            const stock = inventory.find((i: any) => i.componentId === b.componentId)?.availableQuantity || 0;
            return {
              name: b.component.componentName,
              required,
              stock,
              status: stock >= required ? 'Available' : 'Shortage'
            };
          });
          setBomAllocation(result);
        } catch (e) { console.error(e); }
        finally { setIsCheckingBom(false); }
      } else {
        setBomAllocation([]);
      }
    };
    const timer = setTimeout(checkAllocation, 400);
    return () => clearTimeout(timer);
  }, [selectedPrDetail, quantityToProduce]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setShowWaring(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showWarning]);

  const scheduledQty = selectedPrDetail?.workOrderFulfillments?.reduce((sum, f) => sum + (f.workOrder?.quantity || 0), 0) || 0;
  const remainingQtyToSchedule = selectedPrDetail ? selectedPrDetail.quantity - scheduledQty : 0;
  
  const isDateDelayed = endDate && selectedPrDetail?.dueDate && new Date(endDate) > new Date(selectedPrDetail.dueDate);
  const isQtyInvalid = Number(quantityToProduce) > remainingQtyToSchedule;
  const isDateInvalid = startDate && endDate && new Date(endDate) < new Date(startDate);

  const handleRelease = async (status: 'PLANNED' | 'RELEASED') => {
    if (!selectedRequestId || !selectedLineId || !quantityToProduce || isQtyInvalid || isDateInvalid) {
        console.log(status);
        setShowWaring(true);
        return;
    }
    
    setIsSubmitting(true);
    try {
        await ProductionRequestServices.convertToWorkOrder(
            [Number(selectedRequestId)], 
            Number(selectedLineId)
        );
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 2000);
    } catch (e: any) {
        alert(e.response?.data?.message || "Lỗi khi phát hành lệnh.");
    } finally { setIsSubmitting(false); }
  };

  if (isLoadingInit) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10"/></div>;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Work Order</h2>
        <p className="text-sm text-gray-500">Allocate resources and schedule production from the approved request.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
              <ListChecks className="w-5 h-5 text-blue-600" /> Zone 1: Request Reference
            </h3>
            
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Select Production Request <span className="text-red-500">*</span></label>
                <select 
                    value={selectedRequestId} onChange={(e) => setSelectedRequestId(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="">-- Choose Approved or In-Progress Request --</option>
                    {validRequests.map(r => <option key={r.productionRequestId} value={r.productionRequestId}>{r.code} - {r.product?.productName}</option>)}
                </select>
            </div>

            {selectedPrDetail && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-600 uppercase block">Target Product</span>
                        <span className="text-sm font-bold text-gray-900">{selectedPrDetail.product?.productName}</span>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <span className="text-[10px] font-bold text-orange-600 uppercase block">Request Due Date</span>
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {new Date(selectedPrDetail.dueDate!).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Requested</span>
                        <span className="text-sm font-bold text-gray-900">{selectedPrDetail.quantity} {selectedPrDetail.product?.unit}</span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-[10px] font-bold text-green-600 uppercase block">Remaining to Schedule</span>
                        <span className="text-sm font-black text-green-700">{remainingQtyToSchedule} {selectedPrDetail.product?.unit}</span>
                    </div>
                </div>
            )}
          </div>

          <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-opacity ${!selectedRequestId ? 'opacity-50 pointer-events-none' : ''}`}>
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
               <Factory className="w-5 h-5 text-blue-600" /> Zone 2: Work Order Details
             </h3>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Production Line <span className="text-red-500">*</span></label>
                    <select 
                        value={selectedLineId} onChange={(e) => setSelectedLineId(Number(e.target.value))}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="">-- Select Assembly Line --</option>
                        {productionLines.map(l => <option key={l.productionLineId} value={l.productionLineId}>{l.lineName} ({l.location})</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Quantity to Produce <span className="text-red-500">*</span></label>
                    <input 
                        type="number" value={quantityToProduce}
                        onChange={(e) => setQuantityToProduce(e.target.value === "" ? "" : Number(e.target.value))}
                        className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 ${isQtyInvalid ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    {isQtyInvalid && <p className="text-[10px] text-red-600 font-bold">Quantity cannot exceed the remaining quantity. ({remainingQtyToSchedule})</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Start Date</label>
                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">End Date</label>
                    <input 
                        type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 ${isDateDelayed ? 'border-orange-500 focus:ring-orange-500 bg-orange-50' : 'border-gray-300 focus:ring-blue-500'}`} 
                    />
                    {isDateDelayed && (
                        <p className="text-[10px] text-orange-700 font-bold flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" /> Warning: The end date is later than the request due date.
                        </p>
                    )}
                    {isDateInvalid && <p className="text-[10px] text-red-600 font-bold mt-1">End date cannot be earlier than the start date.</p>}
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
            
            <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 min-h-[400px] flex flex-col ${!selectedRequestId || !quantityToProduce ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" /> Zone 3: Material Allocation
                    </h3>
                    {isCheckingBom && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </div>

                <div className="flex-1 overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b">
                            <tr>
                                <th className="py-2 px-2">Component</th>
                                <th className="py-2 px-2 text-right">Required</th>
                                <th className="py-2 px-2 text-right">Stock</th>
                                <th className="py-2 px-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bomAllocation.length > 0 ? (
                                bomAllocation.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="py-3 px-2 font-medium text-gray-700">{item.name}</td>
                                        <td className="py-3 px-2 text-right font-bold">{item.required}</td>
                                        <td className="py-3 px-2 text-right text-gray-500">{item.stock}</td>
                                        <td className="py-3 px-2 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                item.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>{item.status}</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-gray-400 italic">
                                        Enter a quantity to view material allocation.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {bomAllocation.some(i => i.status === 'Shortage') && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                        <Info className="w-4 h-4 text-red-500 mt-0.5" />
                        <p className="text-[10px] text-red-700 font-medium">
                            Warning: This order is missing materials. If released, the materials will be placed in a waiting state.</p>
                    </div>
                )}
            </div>

            <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 ${!selectedRequestId ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">Shift Note / Instructions</label>
                    <textarea 
                        value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Note..."
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleRelease('PLANNED')}
                        disabled={isSubmitting || !selectedRequestId}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border 
                        border-gray-300 text-gray-700 font-bold rounded-lg 
                        hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> Save Draft
                    </button>
                    <button 
                        onClick={() => handleRelease('RELEASED')}
                        disabled={isSubmitting || !selectedRequestId || isQtyInvalid}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 
                        bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 
                        shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />} Release WO
                    </button>
                </div>
            </div>

        </div>
      </div>

      <SuccessNotification isVisible={showSuccess} message="Work Order released successfully!"/>
      <WarningNotification isVisible={showWarning} message="Please review the information and quantity/time constraints." onClose={() => setShowWaring(false)}/>
    </div>
  );
};
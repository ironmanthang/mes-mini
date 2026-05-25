import { 
  Factory, Loader2, Save, X, Store, FileText
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductionLineServices, type ProductionLine } from "../../../services/productionLineServices";
import { WarehouseServices, type Warehouse } from "../../../services/warehouseServices";
import { WorkOrderServices, type WorkOrderListItem } from "../../../services/workOrderServices";

interface ConfigureWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workOrder: WorkOrderListItem;
}

export const ConfigureWorkOrderModal = ({ isOpen, onClose, onSuccess, workOrder }: ConfigureWorkOrderModalProps): JSX.Element | null => {
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const [targetSalesWarehouseId, setTargetSalesWarehouseId] = useState<number | "">("");
  const [targetErrorWarehouseId, setTargetErrorWarehouseId] = useState<number | "">("");
  const [note, setNote] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !workOrder) return;

    const initData = async () => {
      setIsLoading(true);
      try {
        const [lineRes, whRes] = await Promise.all([
          ProductionLineServices.getAllProductionLines(),
          WarehouseServices.getAllWarehouse()
        ]);
        
        setProductionLines(Array.isArray(lineRes) ? lineRes : (lineRes as any).data || []);
        setWarehouses(Array.isArray(whRes) ? whRes : (whRes as any).data || []);
        
        setSelectedLineId(workOrder.productionLineId || "");
        setTargetSalesWarehouseId(workOrder.targetSalesWarehouseId || "");
        setTargetErrorWarehouseId(workOrder.targetErrorWarehouseId || "");
        setNote(workOrder.note || "");
      } catch (error) {
        console.error("Failed to load configuration data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [isOpen, workOrder]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await WorkOrderServices.updateWorkOrder(workOrder.workOrderId, {
        productionLineId: selectedLineId ? Number(selectedLineId) : undefined,
        targetSalesWarehouseId: targetSalesWarehouseId ? Number(targetSalesWarehouseId) : undefined,
        targetErrorWarehouseId: targetErrorWarehouseId ? Number(targetErrorWarehouseId) : undefined,
        note: note
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to update Work Order configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl overflow-y-auto rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Factory className="w-5 h-5 text-blue-600" /> Configure Work Order
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configure physical line and QC warehouse routing for {workOrder.code}.</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500 w-10 h-10"/>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Production Line */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                  <Factory className="w-3.5 h-3.5 text-gray-400" /> Production Line
                </label>
                <select 
                  value={selectedLineId} 
                  onChange={(e) => setSelectedLineId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- Select Production Line --</option>
                  {productionLines.map(l => (
                    <option key={l.productionLineId} value={l.productionLineId}>
                      {l.lineName} ({l.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Sales Warehouse */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-gray-400" /> Target Sales WH (QC Pass)
                </label>
                <select 
                  value={targetSalesWarehouseId} 
                  onChange={(e) => setTargetSalesWarehouseId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 border border-green-200 bg-green-50/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="">-- Select FG Warehouse --</option>
                  {warehouses.filter(w => w.warehouseType === 'SALES').map(wh => (
                    <option key={wh.warehouseId} value={wh.warehouseId}>
                      {wh.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Error Warehouse */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-gray-400" /> Target Error WH (QC Fail)
                </label>
                <select 
                  value={targetErrorWarehouseId} 
                  onChange={(e) => setTargetErrorWarehouseId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 border border-red-200 bg-red-50/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="">-- Select Defect Warehouse --</option>
                  {warehouses.filter(w => w.warehouseType === 'ERROR').map(wh => (
                    <option key={wh.warehouseId} value={wh.warehouseId}>
                      {wh.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> Notes / Shift Instructions
                </label>
                <textarea 
                  value={note} 
                  onChange={e => setNote(e.target.value)}
                  placeholder="Enter details..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={onClose} 
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { 
  ClipboardList, 
  Factory, 
  Zap, 
  CheckSquare, 
  Square,
  CalendarDays,
  ArrowRight
} from "lucide-react";
import { useState, useMemo, type JSX } from "react";

const products = [
  { id: "PROD001", name: "Gaming Laptop X1", category: "Electronics" },
  { id: "PROD002", name: "Mechanical Keyboard", category: "Accessories" },
  { id: "PROD004", name: "Smart Watch V2", category: "Wearables" },
];

const productionLines = [
  { id: "LINE-A1", name: "Assembly Line Alpha", status: "Ready" },
  { id: "LINE-B2", name: "Assembly Line Beta", status: "Maintenance" },
  { id: "LINE-C3", name: "Packaging Line", status: "Ready" },
];

const pendingRequestsData = [
  { id: "REQ-001", productId: "PROD001", quantity: 50, requester: "Sales Dept", date: "2025-11-20" },
  { id: "REQ-002", productId: "PROD001", quantity: 30, requester: "Warehouse", date: "2025-11-21" },
  { id: "REQ-003", productId: "PROD002", quantity: 100, requester: "Sales Dept", date: "2025-11-22" },
  { id: "REQ-004", productId: "PROD004", quantity: 200, requester: "Export Team", date: "2025-11-23" },
];

export const CreateWorkOrder = (): JSX.Element => {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [targetQuantity, setTargetQuantity] = useState<number>(0);
  const [selectedLineId, setSelectedLineId] = useState("");

  
  const availableRequests = useMemo(() => {
    if (!selectedProductId) return [];
    return pendingRequestsData.filter(req => req.productId === selectedProductId);
  }, [selectedProductId]);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedRequestIds([]);
    setTargetQuantity(0);
  };

  const toggleRequestSelection = (reqId: string, quantity: number) => {
    if (selectedRequestIds.includes(reqId)) {
      setSelectedRequestIds(prev => prev.filter(id => id !== reqId));
      setTargetQuantity(prev => prev - quantity);
    } else {
      setSelectedRequestIds(prev => [...prev, reqId]);
      setTargetQuantity(prev => prev + quantity);
    }
  };

  const handleCreateWorkOrder = () => {
    if (!selectedProductId || !selectedLineId || targetQuantity <= 0) {
      alert("Please fill in all required fields.");
      return;
    }
    console.log("Creating Work Order:", {
      product: selectedProductId,
      requests: selectedRequestIds,
      quantity: targetQuantity,
      line: selectedLineId
    });
    alert("Work Order Created Successfully!");
  };

  const handleAutoBatch = () => {
    alert("System is calculating optimal batch size based on AI...");
    if(availableRequests.length > 0) {
        setSelectedRequestIds(availableRequests.map(r => r.id));
        const totalQty = availableRequests.reduce((sum, r) => sum + r.quantity, 0);
        setTargetQuantity(totalQty);
        setSelectedLineId(productionLines[0].id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Create Work Order
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Consolidate requests and assign to a production line.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                1. Product Selection<span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
              >
                <option value="">-- Select Product to Produce --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                4. Production Line<span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {productionLines.map((line) => (
                  <label 
                    key={line.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedLineId === line.id 
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                        : "border-gray-200 hover:border-gray-300"
                    } ${line.status !== "Ready" ? "opacity-60 grayscale" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                        <input 
                            type="radio" 
                            name="productionLine"
                            value={line.id}
                            disabled={line.status !== "Ready"}
                            checked={selectedLineId === line.id}
                            onChange={(e) => setSelectedLineId(e.target.value)}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{line.name}</span>
                            <span className="text-xs text-gray-500">ID: {line.id}</span>
                        </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                        line.status === "Ready" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    }`}>
                        {line.status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium text-gray-700">
                3. Target Quantity<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={targetQuantity || ""}
                  onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 outline-none text-lg font-semibold text-blue-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pr-4">Units</span>
              </div>
              <p className="text-xs text-gray-500">
                *Can be manually adjusted or auto-summed from requests.
              </p>
            </div>
          </div>

          <div className="space-y-2 h-full flex flex-col">
            <label className="text-sm font-medium text-gray-700 flex justify-between">
              <span>2. Pending Requests (Multi-select)</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {selectedRequestIds.length} selected
              </span>
            </label>
            
            <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden flex flex-col">
               {selectedProductId ? (
                  availableRequests.length > 0 ? (
                    <div className="overflow-y-auto p-2 space-y-2 max-h-[400px]">
                        {availableRequests.map((req) => {
                            const isSelected = selectedRequestIds.includes(req.id);
                            return (
                                <div 
                                    key={req.id}
                                    onClick={() => toggleRequestSelection(req.id, req.quantity)}
                                    className={`p-3 rounded-md border cursor-pointer flex items-center gap-3 transition-colors ${
                                        isSelected 
                                        ? "bg-white border-blue-500 shadow-sm" 
                                        : "bg-white border-gray-200 hover:border-blue-300"
                                    }`}
                                >
                                    {isSelected 
                                        ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                                        : <Square className="w-5 h-5 text-gray-300" />
                                    }
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-sm text-gray-900">{req.id}</span>
                                            <span className="font-bold text-sm text-blue-600">{req.quantity} units</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/> {req.date}</span>
                                            <span>From: {req.requester}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <ClipboardList className="w-12 h-12 mb-2 opacity-20" />
                        <p>No pending requests found for this product.</p>
                    </div>
                  )
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                       <ArrowRight className="w-12 h-12 mb-2 opacity-20" />
                       <p>Please select a Product on the left to view requests.</p>
                   </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 ml-[200px]">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          <button
            onClick={handleAutoBatch}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 
            text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors 
            border border-indigo-200 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            Auto-create Production Batch
          </button>
          
          <button
            onClick={handleCreateWorkOrder}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2EE59D] 
            text-white font-medium rounded-lg hover:bg-[#25D390] transition-colors 
            shadow-sm cursor-pointer"
          >
            <Factory className="w-4 h-4"/>
            Create Work Order
          </button>
        </div>
      </div>
    </div>
  );
};
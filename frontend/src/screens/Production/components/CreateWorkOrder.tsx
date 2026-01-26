import { 
  ClipboardList, 
  Factory, 
  Zap, 
  CheckSquare, 
  Square,
  CalendarDays,
  ArrowRight,
  Info
} from "lucide-react";
import { useState, useMemo, type JSX, useEffect } from "react";
import { productServices, type Product } from "../../../services/productServices";

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

  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    const fetchAllProducts = async () => {
        try {
            const response = await productServices.getAllProducts();
            //@ts-expect-error data
            setProducts(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    fetchAllProducts();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Create Work Order
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Consolidate requests and assign to a production line.
          </p>
        </div>
        
        <button
            onClick={handleAutoBatch}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 
            font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer text-sm"
        >
            <Zap className="w-4 h-4" />
            Auto-create Batch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                        Product Selection<span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedProductId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
                    >
                        <option value="">-- Select Product to Produce --</option>
                        {products.map((p) => (
                        <option key={p.productId} value={p.productId}>
                            {p.productName} ({p.productId})
                        </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                        Production Line<span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {productionLines.map((line) => (
                        <label 
                            key={line.id} 
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedLineId === line.id 
                                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            } ${line.status !== "Ready" ? "opacity-60 grayscale cursor-not-allowed" : ""}`}
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

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                        Target Quantity<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                        type="number"
                        min="1"
                        value={targetQuantity || ""}
                        onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                        className="w-full p-3 border border-gray-300 
                        rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-semibold 
                        text-blue-600"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pr-4">Units</span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Can be manually adjusted or auto-summed from requests.
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={handleCreateWorkOrder}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2EE59D] text-white font-bold rounded-lg hover:bg-[#25D390] transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98]"
                    >
                        <Factory className="w-5 h-5" />
                        Confirm & Create Work Order
                    </button>
                </div>
            </div>
          </div>

          <div className="lg:col-span-1 h-full">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full flex flex-col">
               <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-gray-700">Pending Requests</label>
                    <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">
                        {selectedRequestIds.length} selected
                    </span>
               </div>
            
               <div className="flex-1 overflow-hidden flex flex-col">
                   {selectedProductId ? (
                      availableRequests.length > 0 ? (
                        <div className="overflow-y-auto pr-1 space-y-2 max-h-[500px]">
                            {availableRequests.map((req) => {
                                const isSelected = selectedRequestIds.includes(req.id);
                                return (
                                    <div 
                                        key={req.id}
                                        onClick={() => toggleRequestSelection(req.id, req.quantity)}
                                        className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-all ${
                                            isSelected 
                                            ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500" 
                                            : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                        }`}
                                    >
                                        <div className="mt-0.5">
                                            {isSelected 
                                                ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                                                : <Square className="w-5 h-5 text-gray-300" />
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-sm text-gray-900">{req.id}</span>
                                                <span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{req.quantity}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                <div className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/> {req.date}</div>
                                                <div>By: {req.requester}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                            <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
                            <p className="text-sm">No pending requests.</p>
                        </div>
                      )
                   ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                           <ArrowRight className="w-10 h-10 mb-2 opacity-30" />
                           <p className="text-sm">Select a Product on the left.</p>
                       </div>
                   )}
               </div>
            </div>
          </div>

      </div>
    </div>
  );
};
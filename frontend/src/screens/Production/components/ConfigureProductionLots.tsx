import { 
  Settings, 
  Zap, 
  CheckSquare, 
  Info,
  QrCode,
  ArrowRight
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";

const workOrders = [
  { 
    id: "WO-2025-001", 
    productName: "Gaming Laptop X1", 
    category: "Electronics", 
    quantity: 50, 
    status: "Approved",
    description: "High performance batch for Q4"
  },
  { 
    id: "WO-2025-002", 
    productName: "Organic Energy Bar", 
    category: "Food & Beverage", 
    quantity: 1000, 
    status: "Approved",
    description: "Export quality batch"
  },
  { 
    id: "WO-2025-003", 
    productName: "Mechanical Keyboard", 
    category: "Accessories", 
    quantity: 200, 
    status: "Pending",
    description: "Switch Blue Clicky"
  },
];

const productionLines = [
  { id: "LINE-A1", name: "Assembly Line Alpha" },
  { id: "LINE-B2", name: "Assembly Line Beta" },
  { id: "LINE-C3", name: "Packaging Line" },
];

export const ConfigureProductionLots = (): JSX.Element => {
  const [selectedWOId, setSelectedWOId] = useState("");
  const [selectedWO, setSelectedWO] = useState<any>(null);
  
  const [batchCode, setBatchCode] = useState("");
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedLine, setSelectedLine] = useState("");

  useEffect(() => {
    const wo = workOrders.find(w => w.id === selectedWOId);
    setSelectedWO(wo || null);

    if (wo) {
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      setBatchCode(`${wo.id}-${dateStr}`);
      
      calculateExpiry(wo.category, productionDate);
    } else {
      setBatchCode("");
      setExpiryDate("");
    }
  }, [selectedWOId]);

  useEffect(() => {
    if (selectedWO) {
      calculateExpiry(selectedWO.category, productionDate);
    }
  }, [productionDate]);

  const calculateExpiry = (category: string, prodDate: string) => {
    const date = new Date(prodDate);
    
    if (category === "Food & Beverage") {
      date.setMonth(date.getMonth() + 6);
    } else if (category === "Electronics") {
      date.setFullYear(date.getFullYear() + 2);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    setExpiryDate(date.toISOString().split('T')[0]);
  };

  const handleGenerateInstances = () => {
    if (!selectedWO || !selectedLine) return alert("Please select Work Order and Production Line");
    alert(`Generated ${selectedWO.quantity} product instances for Batch ${batchCode}`);
  };

  const handleAssignChecklist = () => {
    if (!selectedWO) return alert("Please select Work Order");
    alert(`Quality Checklist assigned to ${batchCode}`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Configure Production Lots
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Setup batch details and assign production lines before starting.
                </p>
            </div>
            
            <div className="w-full md:w-[350px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Select Approved Work Order
                </label>
                <div className="relative">
                    <select 
                        value={selectedWOId}
                        onChange={(e) => setSelectedWOId(e.target.value)}
                        className="w-full p-2.5 border border-blue-200 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-blue-50 
                        font-medium text-blue-900 cursor-pointer appearance-none pr-8"
                    >
                        <option value="">-- Choose Work Order --</option>
                        {workOrders.map(wo => (
                            <option key={wo.id} value={wo.id}>{wo.id} - {wo.productName}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-blue-500">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {selectedWO ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
            
            <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-fit">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                    <Info className="w-4 h-4 text-blue-500" /> Work Order Details
                </h4>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Product</label>
                        <p className="text-sm font-medium text-gray-900">{selectedWO.productName}</p>
                        <p className="text-xs text-gray-500">{selectedWO.category}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Quantity</label>
                            <p className="text-lg font-bold text-blue-600">{selectedWO.quantity}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {selectedWO.status}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {selectedWO.description}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 mb-6">
                    <QrCode className="w-4 h-4 text-blue-500" /> Batch Configuration
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">Batch Code (Auto-generated)</label>
                        <input 
                            type="text" 
                            value={batchCode}
                            readOnly
                            className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono tracking-wide cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Production Date</label>
                        <input 
                            type="date" 
                            value={productionDate}
                            onChange={(e) => setProductionDate(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Expiry Date (Auto)</label>
                        <input 
                            type="date" 
                            value={expiryDate}
                            readOnly
                            className="w-full p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 font-medium cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">Production Line<span className="text-red-500">*</span></label>
                        <select 
                            value={selectedLine}
                            onChange={(e) => setSelectedLine(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
                        >
                            <option value="">-- Select Production Line --</option>
                            {productionLines.map(line => (
                                <option key={line.id} value={line.id}>{line.name} ({line.id})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-3 justify-end">
                    <button
                        onClick={handleAssignChecklist}
                        disabled={!selectedWO}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 
                        bg-white border border-gray-300 text-gray-700 font-medium 
                        rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer
                        disabled:cursor-not-allowed text-sm"
                    >
                        <CheckSquare className="w-4 h-4" />
                        Assign Quality Checklist
                    </button>
                    
                    <button
                        onClick={handleGenerateInstances}
                        disabled={!selectedWO || !selectedLine}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2EE59D] text-white font-bold 
                        rounded-lg hover:bg-[#25D390] transition-colors shadow-sm disabled:opacity-50 cursor-pointer
                        disabled:cursor-not-allowed text-sm"
                    >
                        <Zap className="w-4 h-4" />
                        Generate Product Instances
                    </button>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Settings className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-lg font-medium">Select a Work Order above to start configuration.</p>
        </div>
      )}
    </div>
  );
};
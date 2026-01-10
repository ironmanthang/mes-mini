import { 
  QrCode, 
  Wand2, 
  CheckCircle, 
  Search, 
  Package, 
  Play,
  AlertCircle
} from "lucide-react";
import { useState, useMemo, type JSX } from "react";

const productionBatches = [
  { id: "BATCH-2025-001", product: "Gaming Laptop X1", target: 100, current: 45, status: "In Progress" },
  { id: "BATCH-2025-002", product: "Mechanical Keyboard", target: 200, current: 200, status: "Completed" },
  { id: "BATCH-2025-003", product: "Smart Watch V2", target: 50, current: 0, status: "Pending" },
];

const mockInstances = [
  { id: 1, serial: "SN-2025001-001", status: "Passed", createdAt: "2025-12-10 08:30" },
  { id: 2, serial: "SN-2025001-002", status: "Passed", createdAt: "2025-12-10 08:35" },
  { id: 3, serial: "SN-2025001-003", status: "Defect", createdAt: "2025-12-10 08:42" },
];

export const Information = (): JSX.Element => {
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [serialInput, setSerialInput] = useState("");
  
  const [productList, setProductList] = useState(mockInstances);

  const selectedBatch = useMemo(() => 
    productionBatches.find(b => b.id === selectedBatchId), 
  [selectedBatchId]);

  const createdCount = selectedBatchId === "BATCH-2025-001" ? productList.length + 42 : (selectedBatch?.current || 0); // Logic giả để demo
  const progressPercent = selectedBatch ? Math.min(100, Math.round((createdCount / selectedBatch.target) * 100)) : 0;

  const handleGenerate = () => {
    if (!selectedBatch) return;
    const remaining = selectedBatch.target - createdCount;
    if (remaining <= 0) return alert("Batch target already reached!");
    
    alert(`Auto-generating ${remaining} serial numbers for ${selectedBatch.id}...`);
  };

  const handleScan = () => {
    if (!serialInput) return;
    alert(`Scanned/Added Serial: ${serialInput}`);
    setSerialInput("");
  };

  const handleCompleteBatch = () => {
    if (!selectedBatch) return;
    if (window.confirm(`Mark batch ${selectedBatch.id} as Completed?`)) {
        alert("Batch status updated to Completed.");
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Batch Selection
            </h3>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Production Batch</label>
                <select 
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                >
                    <option value="">-- Choose Batch --</option>
                    {productionBatches.map(b => (
                        <option key={b.id} value={b.id}>{b.id} - {b.product}</option>
                    ))}
                </select>
            </div>
            {selectedBatch && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1 border border-gray-100">
                    <div className="flex justify-between"><span className="text-gray-500">Product:</span> <span className="font-medium">{selectedBatch.product}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Status:</span> 
                        <span className={`font-bold ${selectedBatch.status === 'Completed' ? 'text-green-600' : 'text-blue-600'}`}>
                            {selectedBatch.status}
                        </span>
                    </div>
                </div>
            )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center space-y-4">
             <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Real-time Progress</h3>
                    <div className="text-3xl font-bold text-gray-900">
                        {selectedBatch ? createdCount : 0} 
                        <span className="text-lg text-gray-400 font-medium mx-1">/</span> 
                        <span className="text-lg text-gray-500">{selectedBatch ? selectedBatch.target : 0}</span>
                        <span className="text-sm font-normal text-gray-400 ml-2">units</span>
                    </div>
                </div>
                {selectedBatch && (
                    <div className="text-right">
                        <span className="text-sm font-medium text-blue-600">{progressPercent}% Completed</span>
                    </div>
                )}
             </div>

             <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                    style={{ width: `${progressPercent}%` }}
                ></div>
             </div>
             
             {selectedBatch && progressPercent < 100 && (
                 <p className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {selectedBatch.target - createdCount} units remaining to meet target.
                 </p>
             )}
        </div>
      </div>

      {selectedBatch ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-blue-500" /> Product Creation
                    </h4>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Scan or enter SN..." 
                            value={serialInput}
                            onChange={(e) => setSerialInput(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                        />
                        <button 
                            onClick={handleScan}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded border border-gray-300 transition-colors"
                            title="Simulate Scan"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Connect scanner or input manually.</p>
                </div>

                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 space-y-3">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">Batch Actions</h4>
                    
                    <button 
                        onClick={handleGenerate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 font-medium rounded hover:bg-blue-50 transition-colors shadow-sm text-sm"
                    >
                        <Wand2 className="w-4 h-4" /> Auto-Generate Remaining
                    </button>

                    <button 
                        onClick={handleCompleteBatch}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded hover:bg-green-500 transition-colors shadow-md text-sm"
                    >
                        <CheckCircle className="w-4 h-4" /> Complete Batch
                    </button>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-gray-700 text-sm">Created Instances</h4>
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" />
                        <input type="text" placeholder="Filter SN..." className="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded outline-none" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-xs uppercase text-gray-500 sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border-b border-gray-100 bg-gray-50">#</th>
                                <th className="p-3 border-b border-gray-100 bg-gray-50">Serial Number</th>
                                <th className="p-3 border-b border-gray-100 bg-gray-50 text-center">Status</th>
                                <th className="p-3 border-b border-gray-100 bg-gray-50 text-right">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {productList.length > 0 ? (
                                productList.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                        <td className="p-3 text-gray-500">{index + 1}</td>
                                        <td className="p-3 font-mono font-medium text-gray-800">{item.serial}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                item.status === 'Passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-gray-500 text-xs">{item.createdAt}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                                        No instances created yet for this batch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
            <Package className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">Please select a Production Batch to view details.</p>
        </div>
      )}
    </div>
  );
};
import { 
  ClipboardCheck, 
  History, 
  Play, 
  FileDown, 
  AlertTriangle,
  Plus
} from "lucide-react";
import { useState, type JSX } from "react";
import { StocktakingSessionModal } from "./StocktakingSessionModel";

const stocktakeHistory = [
  { id: "STK-2025-001", warehouse: "Central Component Storage", date: "2025-11-20", items: 1500, variance: -2, status: "Completed", by: "Thinh Huynh Canh" },
  { id: "STK-2025-002", warehouse: "Defect Quarantine", date: "2025-11-25", items: 200, variance: 0, status: "Pending Approval", by: "Lam Phan Phuc" },
  { id: "STK-2025-003", warehouse: "Finished Goods Hub", date: "2025-11-28", items: 850, variance: -5, status: "In Progress", by: "Nguyen Van A" },
];

export const Stocktaking = (): JSX.Element => {
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [countMethod, setCountMethod] = useState("Full Count");

  const handleStartStocktake = () => {
    if (!selectedWarehouse) {
      alert("Please select a warehouse first!");
      return;
    }
    setIsSessionOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
           <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
             <Plus className="w-5 h-5" />
           </span>
           Start New Stocktake
        </h3>
        
        <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-gray-700">Warehouse Selection</label>
                <select 
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="">-- Select Warehouse to Count --</option>
                    <option value="Central Component Storage">Central Component Storage</option>
                    <option value="Finished Goods Hub">Finished Goods Hub</option>
                    <option value="Defect Quarantine">Defect Quarantine</option>
                </select>
            </div>

            <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-gray-700">Items to Count</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500" disabled>
                    <option>All Items in Warehouse (Auto-filled)</option>
                </select>
            </div>

            <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-gray-700">Counting Method</label>
                <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="method" 
                            value="Full Count"
                            checked={countMethod === "Full Count"}
                            onChange={(e) => setCountMethod(e.target.value)}
                            className="w-4 h-4 text-blue-600" 
                        />
                        <span className="text-sm text-gray-700">Full Count</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="method" 
                            value="Random Count"
                            checked={countMethod === "Random Count"}
                            onChange={(e) => setCountMethod(e.target.value)}
                            className="w-4 h-4 text-blue-600" 
                        />
                        <span className="text-sm text-gray-700">Random Count</span>
                    </label>
                </div>
            </div>

            <button 
                onClick={handleStartStocktake}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
                <Play className="w-4 h-4" /> Start Counting
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
         <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Continue Counting
         </button>
         <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> View Variance Report
         </button>
         <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Export Results
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" /> Stocktake History
            </h3>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                        <th className="p-4">Stocktake ID</th>
                        <th className="p-4">Warehouse</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-center">Total Items</th>
                        <th className="p-4 text-center">Variance</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Conducted By</th>
                        <th className="p-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {stocktakeHistory.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-blue-600">{item.id}</td>
                            <td className="p-4 text-gray-700">{item.warehouse}</td>
                            <td className="p-4 text-gray-500">{item.date}</td>
                            <td className="p-4 text-center">{item.items}</td>
                            <td className={`p-4 text-center font-bold ${item.variance === 0 ? 'text-gray-300' : 'text-red-500'}`}>
                                {item.variance}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                    item.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                    item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="p-4 text-gray-700">{item.by}</td>
                            <td className="p-4 text-center">
                                <button className="text-blue-600 hover:underline text-xs font-medium">View Report</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <StocktakingSessionModal 
        isOpen={isSessionOpen} 
        onClose={() => setIsSessionOpen(false)} 
        warehouseName={selectedWarehouse}
      />
    </div>
  );
};
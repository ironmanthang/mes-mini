import { 
  ArrowRightLeft, 
  History, 
  FileText, 
  Clock, 
  Zap,
  ArrowRight
} from "lucide-react";
import { useState, type JSX } from "react";
import { NewTransferModal } from "./NewTransferModel";

const transferHistory = [
  { id: "TRF-001", from: "Central Storage", to: "Finished Goods", item: "Chipset A1", qty: 500, date: "2025-12-01", status: "Completed" },
  { id: "TRF-002", from: "Central Storage", to: "Defect Quarantine", item: "Damaged Case", qty: 15, date: "2025-12-02", status: "Pending" },
  { id: "TRF-003", from: "Zone B", to: "Zone A", item: "Packaging Box", qty: 1000, date: "2025-12-03", status: "In Transit" },
];

export const TransferStock = (): JSX.Element => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 pb-12">
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
           <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
             <Zap className="w-5 h-5" />
           </span>
           Quick Transfer
        </h3>
        
        <div className="flex flex-col xl:flex-row items-end gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">From</label>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm"><option>Central Storage</option></select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">To</label>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm"><option>Finished Goods Hub</option></select>
                </div>
            </div>
            
            <div className="flex items-center justify-center px-2 pb-2">
                <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Item</label>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm"><option>Select Item...</option></select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Qty</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="0" />
                </div>
            </div>

            <div className="w-full md:w-auto">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Reason</label>
                    <select className="w-full p-2 border border-gray-300 rounded text-sm">
                        <option>Production</option>
                        <option>Replenishment</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            <button className="px-6 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-500 transition-colors shadow-sm whitespace-nowrap">
                Transfer Now
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
         <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-sm text-sm font-medium flex items-center gap-2"
         >
            <ArrowRightLeft className="w-4 h-4" /> New Transfer Request
         </button>
         <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" /> View Pending Transfers
         </button>
         <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" /> Transfer Template
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" /> Transfer History
            </h3>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                        <th className="p-4">Transfer ID</th>
                        <th className="p-4">From</th>
                        <th className="p-4">To</th>
                        <th className="p-4">Item</th>
                        <th className="p-4 text-center">Quantity</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {transferHistory.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-indigo-600">{item.id}</td>
                            <td className="p-4 text-gray-700">{item.from}</td>
                            <td className="p-4 text-gray-700">{item.to}</td>
                            <td className="p-4 text-gray-900 font-medium">{item.item}</td>
                            <td className="p-4 text-center font-mono font-bold">{item.qty}</td>
                            <td className="p-4 text-gray-500">{item.date}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                    item.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                    item.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                    <FileText className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <NewTransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
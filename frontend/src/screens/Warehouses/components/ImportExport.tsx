import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Calendar,
  Box,
  MoreHorizontal
} from "lucide-react";
import { useState, type JSX } from "react";
import { ImportModal, ExportModal, TransferModal } from "./TransactionModel";

const transactions = [
  { id: "TRX-001", type: "IMPORT", date: "2025-12-01", warehouse: "Central Storage", item: "CPU Chipset A1", quantity: 500, ref: "PO-001" },
  { id: "TRX-002", type: "EXPORT", date: "2025-12-01", warehouse: "Central Storage", item: "Memory 8GB", quantity: 200, ref: "WO-2025-001" },
  { id: "TRX-003", type: "TRANSFER", date: "2025-12-02", warehouse: "Central -> Defect", item: "Damaged Case", quantity: 10, ref: "-" },
  { id: "TRX-004", type: "IMPORT", date: "2025-12-02", warehouse: "Finished Goods Hub", item: "Laptop Dell XPS 15", quantity: 50, ref: "PB-2024-001" },
];

export const ImportExport = (): JSX.Element => {
  const [activeModal, setActiveModal] = useState<"IMPORT" | "EXPORT" | "TRANSFER" | null>(null);
  const [filterType, setFilterType] = useState("All");

  return (
    <div className="h-full flex flex-col space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transactions Management</h2>
          <p className="text-sm text-gray-500">Monitor incoming, outgoing, and internal stock movements.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setActiveModal("TRANSFER")}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                <ArrowRightLeft className="w-4 h-4" /> Transfer
            </button>
            <button 
                onClick={() => setActiveModal("EXPORT")}
                className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                <ArrowUpRight className="w-4 h-4" /> Export
            </button>
            <button 
                onClick={() => setActiveModal("IMPORT")}
                className="px-4 py-2 bg-[#0F172A] text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
                <ArrowDownLeft className="w-4 h-4" /> New Import
            </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Import</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">120</h3>
                </div>
                <div className="p-2 bg-green-50 rounded-md">
                    <ArrowDownLeft className="w-4 h-4 text-green-600" />
                </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-orange-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Export</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">85</h3>
                </div>
                <div className="p-2 bg-orange-50 rounded-md">
                    <ArrowUpRight className="w-4 h-4 text-orange-600" />
                </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfers</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">10</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-md">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center gap-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Box className="w-3 h-3" /> Stock Check
                </p>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Quick Look</span>
            </div>
            <div className="flex gap-2">
                <select className="flex-1 p-1.5 border border-gray-300 rounded text-sm bg-gray-50 outline-none focus:border-blue-500">
                    <option>Select Item...</option>
                    <option>CPU Chipset A1</option>
                </select>
                <div className="bg-blue-50 px-3 py-1 rounded border border-blue-100 flex items-center">
                    <span className="text-blue-700 font-bold text-sm">500</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 flex flex-col">
        
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
            <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search Transaction ID, Ref..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select 
                        className="bg-transparent text-sm outline-none text-gray-700 font-medium cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="IMPORT">Imports Only</option>
                        <option value="EXPORT">Exports Only</option>
                        <option value="TRANSFER">Transfers Only</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input type="date" className="bg-transparent text-sm outline-none text-gray-700 font-medium cursor-pointer" />
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10">
                    <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                        <th className="p-4">Transaction Details</th>
                        <th className="p-4">Warehouse Info</th>
                        <th className="p-4">Item Details</th>
                        <th className="p-4 text-center">Qty</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                    {transactions
                    .filter(t => filterType === "All" || t.type === filterType)
                    .map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        item.type === 'IMPORT' ? 'bg-green-100 text-green-700' :
                                        item.type === 'EXPORT' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {item.type === 'IMPORT' && <ArrowDownLeft className="w-4 h-4" />}
                                        {item.type === 'EXPORT' && <ArrowUpRight className="w-4 h-4" />}
                                        {item.type === 'TRANSFER' && <ArrowRightLeft className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{item.id}</p>
                                        <p className="text-xs text-gray-500">{item.date}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <p className="text-gray-900 font-medium">{item.warehouse}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    Ref: <span className="font-mono bg-gray-100 px-1 rounded">{item.ref}</span>
                                </p>
                            </td>
                            <td className="p-4">
                                <p className="text-gray-900 font-medium">{item.item}</p>
                            </td>
                            <td className="p-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    item.type === 'IMPORT' ? 'bg-green-50 text-green-700' :
                                    item.type === 'EXPORT' ? 'bg-orange-50 text-orange-700' :
                                    'bg-blue-50 text-blue-700'
                                }`}>
                                    {item.type === 'IMPORT' ? '+' : item.type === 'EXPORT' ? '-' : ''}{item.quantity}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    {item.type === 'EXPORT' && (
                                        <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <span>Showing 4 of 128 transactions</span>
            <div className="flex gap-1">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Next</button>
            </div>
        </div>

      </div>

      <ImportModal isOpen={activeModal === "IMPORT"} onClose={() => setActiveModal(null)} />
      <ExportModal isOpen={activeModal === "EXPORT"} onClose={() => setActiveModal(null)} />
      <TransferModal isOpen={activeModal === "TRANSFER"} onClose={() => setActiveModal(null)} />

    </div>
  );
};
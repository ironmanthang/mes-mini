import { 
  Cpu, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  History, 
  BarChart,
} from "lucide-react";
import { useState, type JSX } from "react";
import { AddComponentModal } from "./AddComponentModel";
// --- Mock Data ---
const components = [
  { id: "COMP-001", name: "CPU Chipset A1", description: "Main processor for Laptop X1", stock: 1500, minStock: 200, supplier: "Intel Corporation", cost: 250.00, status: "Active" },
  { id: "COMP-002", name: "Memory Module 8GB", description: "DDR4 SODIMM RAM", stock: 45, minStock: 50, supplier: "Samsung Electronics", cost: 45.50, status: "Active" },
  { id: "COMP-003", name: "Wifi Card 6E", description: "Wifi & Bluetooth Module", stock: 300, minStock: 100, supplier: "Intel Corporation", cost: 15.00, status: "Active" },
  { id: "COMP-004", name: "Legacy Port Connector", description: "Old VGA port for specific models", stock: 0, minStock: 10, supplier: "Bosch Vietnam", cost: 2.50, status: "Discontinued" },
];

export const ComponentInformation = (): JSX.Element => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("All");

  // Handlers
  const handleOpenAdd = () => {
    setSelectedComponent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: any) => {
    setSelectedComponent(comp);
    setIsModalOpen(true);
  };

  const activeCount = components.filter(c => c.status === "Active").length;
  const lowStockCount = components.filter(c => c.stock < c.minStock && c.status === "Active").length;

  return (
    <div className="space-y-8 pb-12">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active Components</p>
                <h3 className="text-3xl font-bold text-gray-900">{activeCount}</h3>
                <p className="text-xs text-green-600 font-medium mt-1">Ready for production</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Cpu className="w-6 h-6" />
            </div>
        </div>

        <div className={`p-6 rounded-lg border shadow-sm flex items-center justify-between ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
            <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>Low Stock Alerts</p>
                <h3 className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>{lowStockCount}</h3>
                <p className={`text-xs font-medium mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>Items below minimum level</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
             <div className="flex justify-between items-start mb-2">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Supplier</p>
                 <TrendingUp className="w-4 h-4 text-green-500" />
             </div>
             <h3 className="text-lg font-bold text-gray-900">Intel Corporation</h3>
             <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                 <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '75%'}}></div>
             </div>
             <p className="text-xs text-gray-400 mt-2">75% of total stock value</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search Component Name/ID..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <Filter className="w-4 h-4 text-gray-400 ml-2" />
                    <select 
                        className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Discontinued">Discontinued</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <History className="w-4 h-4" /> Purchase History
                </button>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Component
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                        <th className="p-4">ID</th>
                        <th className="p-4">Component Name</th>
                        <th className="p-4">Supplier</th>
                        <th className="p-4 text-right">Unit Cost</th>
                        <th className="p-4 text-center">Current Stock</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {components
                    .filter(c => {
                        if (filterStatus === "All") return true;
                        if (filterStatus === "Low Stock") return c.stock < c.minStock;
                        return c.status === filterStatus;
                    })
                    .map((item) => {
                        const isLowStock = item.stock < item.minStock;
                        return (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-500">{item.id}</td>
                                <td className="p-4">
                                    <p className="font-bold text-gray-900">{item.name}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                                </td>
                                <td className="p-4 text-gray-700">{item.supplier}</td>
                                <td className="p-4 text-right font-mono text-gray-700">${item.cost.toFixed(2)}</td>
                                <td className="p-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        isLowStock 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                        {item.stock}
                                    </span>
                                    {isLowStock && <p className="text-[10px] text-red-500 mt-1 font-medium">Low Stock!</p>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                        item.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 flex items-center justify-center gap-2">
                                    <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="View Stock Details">
                                        <BarChart className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleOpenEdit(item)}
                                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Edit Component"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      <AddComponentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedComponent}
        onConfirm={() => alert("Changes saved successfully!")} 
      />
    </div>
  );
};
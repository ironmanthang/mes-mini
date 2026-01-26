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
  Loader2,
  Trash2
} from "lucide-react";
import { useState, useEffect, useCallback, type JSX } from "react";
import { AddComponentModal } from "./AddComponentModel";
import { componentService, type Component } from "../../../services/componentServices";


export const ComponentInformation = (): JSX.Element => {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const fetchComponents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await componentService.getAllComponents(searchTerm);
      //@ts-expect-error data
      setComponents(response.data);
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchComponents();
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [fetchComponents]);

  const handleOpenAdd = () => {
    setSelectedComponent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Component) => {
    setSelectedComponent(comp);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this component?")) {
      try {
        await componentService.deleteComponent(id);
        fetchComponents();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleSaveSuccess = () => {
    fetchComponents();
  };

  const activeCount = components.length; 
  const lowStockCount = components.filter(c => (c.currentStock || 0) < c.minStockLevel).length;
  const topSupplier = "Intel Corporation";

  return (
    <div className="space-y-8 pb-12">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Components</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {isLoading ? "-" : activeCount}
                </h3>
                <p className="text-xs text-green-600 font-medium mt-1">Ready for production</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Cpu className="w-6 h-6" />
            </div>
        </div>

        <div className={`p-6 rounded-lg border shadow-sm flex items-center justify-between ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
            <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>Low Stock Alerts</p>
                <h3 className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {isLoading ? "-" : lowStockCount}
                </h3>
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
             <h3 className="text-lg font-bold text-gray-900">{topSupplier}</h3>
             <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                 <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '75%'}}></div>
             </div>
             <p className="text-xs text-gray-400 mt-2">Based on purchase volume</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search Name/Code..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <Filter className="w-4 h-4 text-gray-400 ml-2" />
                    <select 
                        className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Low Stock">Low Stock</option>
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

        <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
                <div className="flex h-full items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                            <th className="p-4">Code</th>
                            <th className="p-4">Component Name</th>
                            <th className="p-4">Unit</th>
                            <th className="p-4 text-right">Standard Cost</th>
                            <th className="p-4 text-center">Stock / Min</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {components
                        .filter(c => {
                            if (filterStatus === "Low Stock") return (c.currentStock || 0) < c.minStockLevel;
                            return true;
                        })
                        .map((item) => {
                            const stock = item.currentStock || 0;
                            const isLowStock = stock < item.minStockLevel;
                            const status = stock > 0 ? "Active" : "Out of Stock"; 

                            return (
                                <tr key={item.componentId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-500">{item.code}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{item.componentName}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description || "No description"}</p>
                                    </td>
                                    <td className="p-4 text-gray-700">{item.unit}</td>
                                    <td className="p-4 text-right font-mono text-gray-700">
                                        ${item.standardCost.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                isLowStock 
                                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                                : 'bg-green-100 text-green-700 border border-green-200'
                                            }`}>
                                                {stock}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-0.5">Min: {item.minStockLevel}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                            status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                            {status}
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
                                        <button 
                                            onClick={() => handleDelete(item.componentId)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete Component"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
      </div>

        <AddComponentModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            initialData={selectedComponent || undefined}
            onConfirm={handleSaveSuccess} 
        />
    
    </div>
  );
};
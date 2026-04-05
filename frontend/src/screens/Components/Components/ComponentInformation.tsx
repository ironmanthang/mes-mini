import { 
  Cpu, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  History, 
  Loader2,
  Trash2,
  Barcode,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect, useCallback, type JSX } from "react";
import { AddComponentModal } from "./AddComponentModal";
import { componentService, type Component } from "../../../services/componentServices";
import { InventoryServices } from "../../../services/inventoryServices";
import { DeleteComponentModal } from "./DeleteComponentModal";
import { SuccessNotification } from "../../UserAndSystem/components/SuccessNotification";

export const ComponentInformation = (): JSX.Element => {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<{id: number, name: string} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  const fetchComponents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compResponse, invResponse] = await Promise.all([
        componentService.getAllComponents({ search: searchTerm, page, limit }),
        InventoryServices.getConsolidatedInventory({ limit: 5000 }),
      ]);

      const compData = (compResponse as any).data || compResponse || [];
      const totalItems = (compResponse as any).total || compData.length || 0;
      setTotal(totalItems);

      const invData = invResponse?.data || [];

      const mergedComponents = compData.map((comp: Component) => {
        const stockInfo = invData.find((inv: any) => inv.componentId === comp.componentId);
        return {
          ...comp,
          currentStock: stockInfo ? stockInfo.availableQuantity : 0 
        };
      });

      setComponents(mergedComponents);
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, limit]);

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

  const handleDelete = (id: number, name: string) => {
    setComponentToDelete({ id, name });
  };

  const handleSaveSuccess = (msg: string) => {
    setMessage(msg);
    setShowSuccess(true);
    fetchComponents();
    setTimeout(() => {
        setMessage("");
        setShowSuccess(false);
    }, 1000);
  };

  const handleViewBarcode = async (id: number, name: string) => {
    try {
        const data = await componentService.getComponentBarcode(id);
        alert(`Mã vạch của ${name} là:\n\n[ ${data.barcode} ]`);
    } catch (error: any) {
        alert(error?.response?.data?.message || "Không thể lấy mã vạch");
    }
  };

  const lowStockCount = components.filter(c => (c.currentStock || 0) < c.minStockLevel).length;

  const formatNumberVN = (numberString: string | number) => {
    const number = Number(numberString);
    if (isNaN(number)) return numberString;
    return number.toLocaleString('vi-VN');
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Components</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {isLoading ? "-" : total}
                </h3>
                <p className="text-xs text-green-600 font-medium mt-1">In database</p>
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
                <p className={`text-xs font-medium mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>On current page</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
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
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer">
                    <History className="w-4 h-4" /> Purchase History
                </button>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add Component
                </button>
            </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold sticky top-0">
                            <th className="p-4">Code</th>
                            <th className="p-4">Component Name</th>
                            <th className="p-4">Unit</th>
                            <th className="p-4 text-right">Standard Cost</th>
                            <th className="p-4 text-center">Available / Min</th>
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
                                    <td className="p-4 font-mono font-medium text-gray-500">{item.code}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{item.componentName}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description || "No description"}</p>
                                    </td>
                                    <td className="p-4 text-gray-700">{item.unit}</td>
                                    <td className="p-4 text-right font-mono text-gray-700">
                                        ${formatNumberVN(item.standardCost)}
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
                                    <td className="p-4 flex items-center justify-center gap-1">
                                        <button 
                                            onClick={() => handleViewBarcode(item.componentId, item.componentName)}
                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors" 
                                            title="View Barcode"
                                        >
                                            <Barcode className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded cursor-pointer transition-colors" 
                                            title="Edit Component"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.componentId, item.componentName)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors" 
                                            title="Delete Component"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {components.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-gray-500">
                                    <Cpu className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    No components found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
        
        {!isLoading && total > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <span className="text-sm text-gray-500 font-medium">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                </span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Previous Page"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-gray-700 px-2">
                        {page} / {totalPages}
                    </span>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Next Page"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

      </div>

      <AddComponentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedComponent}
        onConfirm={handleSaveSuccess} 
      />

      <DeleteComponentModal
        isOpen={componentToDelete !== null}
        onClose={() => setComponentToDelete(null)}
        componentId={componentToDelete?.id || null}
        componentName={componentToDelete?.name || ""}
        onSuccess={() => {
            setMessage("Deleted Component")
            setShowSuccess(true);
            fetchComponents();
            setComponentToDelete(null);
            setTimeout(() => {
                setShowSuccess(false);
                setMessage("");
            }, 1000);
        }}
      />

      <SuccessNotification isVisible={showSuccess} message={message}/>
    </div>
  );
};
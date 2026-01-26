import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  FileText,
  PlayCircle,
  User
} from "lucide-react";
import { useState, useMemo, type JSX, useEffect } from "react";
import { NewSalesOrderModal } from "./NewSalesOrderModel";
import { SalesOrderDetailModal } from "./SalesOrderDetailModel";
import { salesOrderServices, type SalesOrder } from "../../../services/salesOrderServices";

export const Orders = (): JSX.Element => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllSalesOrders = async () => {
        setIsLoading(true);
        try {
            const response = await salesOrderServices.getAllSalesOrders();
            //@ts-expect-error data
            setSalesOrders(response.data || []);
        }
        catch (err) {
            console.error("Failed to fetch sales orders", err);
        } finally {
            setIsLoading(false);
        }
    };

    fetchAllSalesOrders();
  }, []);

  const stats = useMemo(() => {
    const total = salesOrders.length;
    const completed = salesOrders.filter(o => o.status === "Completed").length;
    const pending = salesOrders.filter(o => o.status !== "Completed").length; 
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const urgent = salesOrders.filter(o => o.status === "High Priority").length; 

    return { total, pending, completionRate, urgent };
  }, [salesOrders]);

  const handleCreateOrder = () => {
    alert("New Sales Order Created Successfully!");
    setIsNewOrderOpen(false);
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case "Completed": return "bg-green-100 text-green-700 border-green-200";
        case "Processing": return "bg-blue-100 text-blue-700 border-blue-200";
        case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
        case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
        default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredOrders = useMemo(() => {
    return salesOrders.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        order.salesOrderId.toString().includes(searchLower) || 
        order.code.toLowerCase().includes(searchLower) ||
        order.agent.agentName.toLowerCase().includes(searchLower) ||
        order.employee.fullName.toLowerCase().includes(searchLower);

      const matchStatus = filterStatus === "All" || order.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [salesOrders, searchQuery, filterStatus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                    <span className="text-sm text-gray-500">Records</span>
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">{stats.pending} active orders</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <ShoppingCart className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fulfillment Rate</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.completionRate}%</h3>
                <p className="text-xs text-green-600 font-medium mt-1">Completed orders</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <TrendingUp className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Attention Needed</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.urgent}</h3>
                <p className="text-xs text-red-500 font-medium mt-1">High priority / Issues</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                <AlertTriangle className="w-6 h-6" />
            </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
        
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search ID, Code, Agent..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <Filter className="w-4 h-4 text-gray-400 ml-2" />
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <button 
                onClick={() => setIsNewOrderOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium 
                rounded-lg hover:bg-blue-500 transition-colors shadow-sm text-sm cursor-pointer"
            >
                <Plus className="w-4 h-4" /> New Sales Order
            </button>
        </div>

        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold sticky top-0">
                    <tr>
                        <th className="p-4 border-b border-gray-200">ID</th>
                        <th className="p-4 border-b border-gray-200">Order Code</th>
                        <th className="p-4 border-b border-gray-200">Agent Name</th>
                        <th className="p-4 border-b border-gray-200">Sales Rep</th> {/* Thay cho Product/Qty */}
                        <th className="p-4 border-b border-gray-200 text-right">Total Amount</th>
                        <th className="p-4 border-b border-gray-200 text-center">Status</th>
                        <th className="p-4 border-b border-gray-200 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {isLoading ? (
                        <tr>
                             <td colSpan={7} className="p-12 text-center text-gray-500">Loading data...</td>
                        </tr>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <tr key={order.salesOrderId} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                                <td className="p-4 font-bold text-blue-600">#{order.salesOrderId}</td>
                                <td className="p-4 font-mono text-gray-700">{order.code}</td>
                                <td className="p-4 font-medium text-gray-900">{order.agent.agentName}</td>
                                <td className="p-4 text-gray-600 flex items-center gap-2">
                                    <User className="w-3 h-3 text-gray-400"/>
                                    {order.employee.fullName}
                                </td>
                                <td className="p-4 text-right font-bold text-gray-900">
                                    {formatCurrency(order.totalAmount)}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 
                                        hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    
                                    {order.status !== 'Completed' && (
                                        <button className="p-1.5 text-gray-500 hover:text-green-600 
                                        hover:bg-green-50 rounded transition-colors cursor-pointer" title="Process Order">
                                            <PlayCircle className="w-4 h-4" />
                                        </button>
                                    )}

                                    <button className="p-1.5 text-gray-500 hover:text-purple-600 
                                    hover:bg-purple-50 rounded transition-colors cursor-pointer" title="Generate Invoice">
                                        <FileText className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="p-12 text-center text-gray-400">
                                No orders found matching criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <NewSalesOrderModal 
        isOpen={isNewOrderOpen} 
        onClose={() => setIsNewOrderOpen(false)} 
        onConfirm={handleCreateOrder} 
      />
      
      {selectedOrder && (
        <SalesOrderDetailModal 
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            order={selectedOrder}
        />
      )}
      
    </div>
  );
};
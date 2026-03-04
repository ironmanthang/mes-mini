import { 
  Search, 
  Filter, 
  Plus, 
  Eye,
  FileText,
  PlayCircle
} from "lucide-react";
import { useState, useMemo, type JSX, useEffect } from "react";
import { NewSalesOrderModal } from "./NewSalesOrderModel";
import { SalesOrderDetailModal } from "./SalesOrderDetailModel";
import { SalesOrdersServices, type SalesOrder, type SalesOrderDetail } from "../../../services/salesOrdersServices";

export const Orders = (): JSX.Element => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDetail | null>(null);

  const fetchSalesOrders = async () => {
    try {
        const response = await SalesOrdersServices.getAllSalesOrders();
        setOrders(response.data);
    } catch (error) {
        console.error("Failed to get sales order: ", error);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = (order.code?.toLowerCase().includes(searchLower)) || 
                          (order.agent?.agentName?.toLowerCase().includes(searchLower));
      const matchStatus = filterStatus === "All" || order.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, filterStatus]);

  const handleCreateOrder = () => {
    alert("Sales Order Created Successfully!");
    setIsNewOrderOpen(false);
    fetchSalesOrders();
  };

  const handleSelectedSalesOrder = async (id: number) => {
    try {
        const response = await SalesOrdersServices.getSalesOrderDetail(id);
        setSelectedOrder(response);
    } catch (error) {
        console.error("Failed to get sales order detail: ", error);
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
        case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
        case "IN_PROGRESS": return "bg-blue-100 text-blue-700 border-blue-200";
        case "APPROVED": return "bg-purple-100 text-purple-700 border-purple-200";
        case "PENDING_APPROVAL": return "bg-yellow-100 text-yellow-700 border-yellow-200";
        case "DRAFT": return "bg-gray-100 text-gray-700 border-gray-200";
        case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
        default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col gap-6">

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
        
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search Order Code, Agent..." 
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
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING_APPROVAL">Pending Approval</option>
                        <option value="APPROVED">Approved</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
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
                        <th className="p-4 border-b border-gray-200">Order Code</th>
                        <th className="p-4 border-b border-gray-200">Agent</th>
                        <th className="p-4 border-b border-gray-200">Employee</th>
                        <th className="p-4 border-b border-gray-200 text-right">Total Amount</th>
                        <th className="p-4 border-b border-gray-200 text-center">Status</th>
                        <th className="p-4 border-b border-gray-200 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <tr key={order.salesOrderId} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                                <td className="p-4 font-bold text-blue-600">{order.code}</td>
                                <td className="p-4 font-medium text-gray-900">{order.agent?.agentName || "Unknown"}</td>
                                <td className="p-4 font-medium text-gray-900">{order.employee?.fullName || "Unknown"}</td>
                                <td className="p-4 text-right font-bold text-gray-900">
                                  ${Number(order.totalAmount || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleSelectedSalesOrder(order.salesOrderId)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 
                                        hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    
                                    
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={9} className="p-12 text-center text-gray-400">
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
      
      <SalesOrderDetailModal 
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

    </div>
  );
};
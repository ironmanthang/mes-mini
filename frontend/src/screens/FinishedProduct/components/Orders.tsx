import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  FileText,
  PlayCircle
} from "lucide-react";
import { useState, useMemo, type JSX } from "react";
import { NewSalesOrderModal } from "./NewSalesOrderModel";
import { SalesOrderDetailModal } from "./SalesOrderDetailModel";

const initialOrders = [
  { id: "SO-2025-001", agent: "TechWorld Distributor", date: "2025-12-10", product: "Gaming Laptop X1", quantity: 50, totalValue: 60000, status: "Processing", deliveryDate: "2025-12-15" },
  { id: "SO-2025-002", agent: "Global Electronics", date: "2025-12-11", product: "Mechanical Keyboard", quantity: 200, totalValue: 16000, status: "Pending", deliveryDate: "2025-12-20" },
  { id: "SO-2025-003", agent: "Local Retailer A", date: "2025-12-12", product: "Smart Watch V2", quantity: 30, totalValue: 7500, status: "Completed", deliveryDate: "2025-12-12" },
  { id: "SO-2025-004", agent: "TechWorld Distributor", date: "2025-12-12", product: "Gaming Laptop X1", quantity: 10, totalValue: 12000, status: "Pending", deliveryDate: "2025-12-18" },
];

export const Orders = (): JSX.Element => {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const todayOrders = orders.filter(o => o.date === "2025-12-12").length;
  const pendingDelivery = orders.filter(o => o.status !== "Completed").length;
  const completedRate = Math.round((orders.filter(o => o.status === "Completed").length / orders.length) * 100);
  const lateAlerts = 1;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.agent.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "All" || order.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, filterStatus]);

  const handleCreateOrder = () => {
    alert("New Sales Order Created Successfully!");
    setIsNewOrderOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case "Completed": return "bg-green-100 text-green-700 border-green-200";
        case "Processing": return "bg-blue-100 text-blue-700 border-blue-200";
        case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
        default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Activity</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{todayOrders}</h3>
                    <span className="text-sm text-gray-500">New Orders</span>
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">{pendingDelivery} orders pending delivery</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <ShoppingCart className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fulfillment Rate</p>
                <h3 className="text-2xl font-bold text-gray-900">{completedRate}%</h3>
                <p className="text-xs text-green-600 font-medium mt-1">On-time delivery</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <TrendingUp className="w-6 h-6" />
            </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Urgent Alerts</p>
                <h3 className="text-2xl font-bold text-red-600">{lateAlerts}</h3>
                <p className="text-xs text-red-500 font-medium mt-1">Orders approaching deadline</p>
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
                        placeholder="Search Order ID, Agent..." 
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
                        <th className="p-4 border-b border-gray-200">Sales Order ID</th>
                        <th className="p-4 border-b border-gray-200">Agent</th>
                        <th className="p-4 border-b border-gray-200">Order Date</th>
                        <th className="p-4 border-b border-gray-200">Product</th>
                        <th className="p-4 border-b border-gray-200 text-right">Qty</th>
                        <th className="p-4 border-b border-gray-200 text-right">Total Value</th>
                        <th className="p-4 border-b border-gray-200 text-center">Status</th>
                        <th className="p-4 border-b border-gray-200">Delivery Date</th>
                        <th className="p-4 border-b border-gray-200 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                                <td className="p-4 font-bold text-blue-600">{order.id}</td>
                                <td className="p-4 font-medium text-gray-900">{order.agent}</td>
                                <td className="p-4 text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {order.date}
                                </td>
                                <td className="p-4 text-gray-800">{order.product}</td>
                                <td className="p-4 text-right font-mono">{order.quantity}</td>
                                <td className="p-4 text-right font-bold text-gray-900">${order.totalValue.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">{order.deliveryDate}</td>
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
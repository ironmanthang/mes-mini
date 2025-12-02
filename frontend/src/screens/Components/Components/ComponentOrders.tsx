import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  RefreshCw,
  Calendar
} from "lucide-react";
import { useState, type JSX } from "react";
import { OrderDetailModal } from "./OrderDetailModel";

// --- Mock Data ---
const ordersData = [
  { 
    id: "PO-2025-001", 
    supplier: "Intel Corporation", 
    date: "2025-12-01", 
    status: "Pending", 
    amount: 12500, 
    createdBy: "Lam Phan Phuc",
    supplierInfo: { contact: "John Doe", email: "sales@intel.com", phone: "+1 234 567 890" },
    items: [
      { name: "CPU Chipset A1", quantity: 50, price: 250 }
    ],
    history: [
      { action: "Order Created", date: "2025-12-01 09:00", user: "Lam Phan Phuc" }
    ]
  },
  { 
    id: "PO-2025-002", 
    supplier: "Samsung Electronics", 
    date: "2025-11-28", 
    status: "Approved", 
    amount: 4500, 
    createdBy: "Thinh Huynh Canh",
    supplierInfo: { contact: "Jane Smith", email: "support@samsung.com", phone: "+82 10 1234 5678" },
    items: [
      { name: "Memory 8GB", quantity: 100, price: 45 }
    ],
    history: [
      { action: "Order Approved", date: "2025-11-29 10:30", user: "Manager" },
      { action: "Order Created", date: "2025-11-28 14:00", user: "Thinh Huynh Canh" }
    ]
  },
  { 
    id: "PO-2025-003", 
    supplier: "Bosch Vietnam", 
    date: "2025-11-25", 
    status: "Received", 
    amount: 800, 
    createdBy: "Nguyen Van A",
    supplierInfo: { contact: "Minh Tran", email: "contact@bosch.vn", phone: "028 1234 5678" },
    items: [
      { name: "Legacy Port", quantity: 200, price: 4 }
    ],
    history: [
        { action: "Goods Received", date: "2025-11-30 08:00", user: "Warehouse Keeper" },
        { action: "Order Approved", date: "2025-11-26 09:00", user: "Manager" },
        { action: "Order Created", date: "2025-11-25 11:00", user: "Nguyen Van A" }
    ]
  },
];

export const ComponentOrders = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleApprove = (id: string) => {
    alert(`Order ${id} Approved Successfully!`);
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    alert(`Order ${id} status updated to ${newStatus}`);
  };

  const filteredOrders = ordersData.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "All" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search PO ID, Supplier Name..." 
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
              <option value="Approved">Approved</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 px-3 py-1.5">
             <Calendar className="w-4 h-4 text-gray-400" />
             <span className="text-sm text-gray-600">Date Range</span>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" /> Export List
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="p-4">Purchase Order ID</th>
              <th className="p-4">Supplier Name</th>
              <th className="p-4">Order Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Total Amount</th>
              <th className="p-4">Created By</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-blue-600">{order.id}</td>
                <td className="p-4 font-medium text-gray-900">{order.supplier}</td>
                <td className="p-4 text-gray-500">{order.date}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    order.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    order.status === 'Received' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-right font-mono font-medium">${order.amount.toLocaleString()}</td>
                <td className="p-4 text-gray-700">{order.createdBy}</td>
                <td className="p-4 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleViewDetails(order)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {order.status === 'Pending' && (
                    <button 
                        onClick={() => handleApprove(order.id)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors" 
                        title="Approve Order"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {order.status === 'Approved' && (
                    <button 
                        onClick={() => handleUpdateStatus(order.id, "Received")}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                        title="Update Status"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No orders found matching your search.
          </div>
        )}
      </div>

      <OrderDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        order={selectedOrder}
        onApprove={handleApprove}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
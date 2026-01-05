import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  RefreshCw,
  Loader2,
  FileText
} from "lucide-react";
import { useState, useEffect, useCallback, type JSX } from "react";
import { OrderDetailModal } from "./OrderDetailModel";
import { purchaseOrderService, type PurchaseOrder } from "../../../services/purchaseOrderServices";

export const ComponentOrders = (): JSX.Element => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await purchaseOrderService.getAllPOs();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch POs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetails = async (orderId: number) => {
    try {
      const detail = await purchaseOrderService.getPOById(orderId);
      setSelectedOrder(detail);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      alert("Failed to load order details.");
    }
  };

  const handleApprove = async (id: number) => {
    if (window.confirm("Are you sure you want to approve this order?")) {
      try {
        await purchaseOrderService.approvePO(id);
        alert("Approved Successfully!");
        fetchOrders();
        setIsModalOpen(false);
      } catch (error: any) {
        const msg = error.response?.data?.message || "Failed to approve.";
        alert(msg);
      }
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    alert(`Change status to ${newStatus}: Feature is pending Backend API support.`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'APPROVED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RECEIVED': return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // --- Filter Logic ---
  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (order.code?.toLowerCase() || "").includes(searchLower) || 
      (order.supplier?.supplierName?.toLowerCase() || "").includes(searchLower);
    
    const matchesFilter = filterStatus === "All" || order.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search PO Code, Supplier..." 
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" /> Export List
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[300px]">
        {isLoading ? (
           <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
           </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="p-4">PO Code</th>
                <th className="p-4">Supplier Name</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4">Created By</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.purchaseOrderId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-blue-600">{order.code}</td>
                    <td className="p-4 font-medium text-gray-900">{order.supplier?.supplierName || "Unknown"}</td>
                    <td className="p-4 text-gray-500">{formatDate(order.orderDate)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-gray-800">
                      ${Number(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-700">{order.employee?.fullName || "System"}</td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleViewDetails(order.purchaseOrderId)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {order.status === 'PENDING' && (
                        <button 
                            onClick={() => handleApprove(order.purchaseOrderId)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors" 
                            title="Approve Order"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {order.status === 'APPROVED' && (
                        <button 
                            onClick={() => handleUpdateStatus(order.purchaseOrderId, "RECEIVED")}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Mark as Received"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-8 h-8 mb-2 opacity-20" />
                      <p>No orders found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
          <OrderDetailModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            order={selectedOrder} 
            onApprove={() => handleApprove(selectedOrder.purchaseOrderId)}
            onUpdateStatus={() => handleUpdateStatus(selectedOrder.purchaseOrderId, "RECEIVED")}
          />
        )}
    </div>
  );
};
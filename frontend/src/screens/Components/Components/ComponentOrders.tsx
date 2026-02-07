import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  Loader2,
  FileText,
  Edit,
  Send,
  ChevronLeft,
  ChevronRight,
  PackagePlus
} from "lucide-react";
import { useState, useEffect, useCallback, type JSX } from "react";
import { OrderDetailModal } from "./OrderDetailModel";
import { purchaseOrderService, type PurchaseOrder } from "../../../services/purchaseOrderServices";
import { UpdateOrderModal } from "./UpdateOrderModal";

export const ComponentOrders = (): JSX.Element => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (searchQuery.trim()) params.search = searchQuery;
      if (filterStatus !== "All") params.status = filterStatus;

      const response = await purchaseOrderService.getAllPOs(params);
      
      const data = (response as any).data || response || [];
      const totalItems = (response as any).total || data.length || 0;
      
      setOrders(data);
      setTotal(totalItems);
    } catch (error) {
      console.error("Failed to fetch POs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, filterStatus]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timeoutId);
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

  const handleUpdate = (id: number) => {
    setSelectedUpdateId(id);
  }

  const handleApprove = async (id: number) => {
    if (window.confirm("Are you sure you want to approve this order?")) {
      try {
        await purchaseOrderService.approvePO(id);
        alert("Approved Successfully!");
        fetchOrders();
        setIsModalOpen(false);
      } catch (error: any) {
        alert(error?.response?.data?.message || "Failed to approve.");
      }
    }
  };

  const checkApprove = (id: number) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return alert("User not found!");

    const user = JSON.parse(userStr);
    const hasPermission = user.roles.some(
      (role: { roleId: number; roleName: string }) => 
        role.roleName === "Production Manager" || role.roleName === "System Admin"
    );

    if (hasPermission) {
      handleApprove(id);
    } else {
      alert("You do not have permission to approve orders.");
    }
  }

  const handleSendToSupplier = async (id: number) => {
    if (window.confirm("Send this Purchase Order to the supplier?")) {
      try {
        await purchaseOrderService.sendToSupplier(id);
        alert("Sent to supplier successfully!");
        fetchOrders();
      } catch (error: any) {
        alert(error?.response?.data?.message || "Failed to send to supplier.");
      }
    }
  }

  const handleReceiveGoods = async (_id: number) => {
    alert("Tính năng Nhận Hàng (Receive Goods) yêu cầu chọn kho và số lượng cho từng mã. Vui lòng tạo ReceiveGoodsModal để gọi API.");
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ORDERED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'RECEIVING': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
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
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVING">Receiving</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer">
          <Download className="w-4 h-4" /> Export List
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
           <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
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
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.purchaseOrderId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-blue-600">{order.code}</td>
                      <td className="p-4 font-medium text-gray-900">{order.supplier?.supplierName || "Unknown"}</td>
                      <td className="p-4 text-gray-500">{formatDate(order.orderDate)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-medium text-gray-800">
                        ${Number(order.totalAmount).toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-700">{order.employee?.fullName || "System"}</td>
                      <td className="p-4 flex items-center justify-center gap-1">
                        
                        <button 
                          onClick={() => handleViewDetails(order.purchaseOrderId)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {(order.status === "DRAFT" || order.status === "PENDING") && (
                          <button 
                            onClick={() => handleUpdate(order.purchaseOrderId)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" 
                            title="Edit Order"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        
                        {order.status === 'PENDING' && (
                          <button 
                              onClick={() => checkApprove(order.purchaseOrderId)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer" 
                              title="Approve Order"
                          >
                              <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {order.status === 'APPROVED' && (
                          <button 
                              onClick={() => handleSendToSupplier(order.purchaseOrderId)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer" 
                              title="Send to Supplier"
                          >
                              <Send className="w-4 h-4" />
                          </button>
                        )}

                        {(order.status === 'ORDERED' || order.status === 'RECEIVING') && (
                          <button 
                              onClick={() => handleReceiveGoods(order.purchaseOrderId)}
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors cursor-pointer" 
                              title="Receive Goods"
                          >
                              <PackagePlus className="w-4 h-4" />
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
                        <p>No orders found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500 font-medium">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
              </span>
              <div className="flex items-center gap-2">
                  <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-700 px-2">
                      {page} / {totalPages}
                  </span>
                  <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
          </div>
        )}
      </div>

      {selectedOrder && (
          <OrderDetailModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            order={selectedOrder} 
            onApprove={() => handleApprove(selectedOrder.purchaseOrderId)}
            onUpdateStatus={() => handleReceiveGoods(selectedOrder.purchaseOrderId)}
          />
      )}

      <UpdateOrderModal
          isOpen={selectedUpdateId !== null}
          onClose={() => setSelectedUpdateId(null)}
          orderId={selectedUpdateId}
          onSuccess={() => fetchOrders()}
      />
    </div>
  );
};
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Loader2,
  FileText,
  Edit,
  Send,
  ChevronLeft,
  ChevronRight,
  XCircle,
  AlertTriangle,
  ArrowDownUp
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, type JSX } from "react";
import { OrderDetailModal } from "./OrderDetailModel";
import { purchaseOrderService, type PurchaseOrder } from "../../../services/purchaseOrderServices";
import { UpdateOrderModal } from "./UpdateOrderModal";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { hasPermission } from "../../../lib/auth";

type ConfirmActionType = "SUBMIT" | "APPROVE" | "MARK_ORDERED";

export const ComponentOrders = (): JSX.Element => {
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [originalOrders, setOriginalOrders] = useState<PurchaseOrder[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | "none";
  }>({
    key: null,
    direction: "none"
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: ConfirmActionType | null;
    orderId: number | null;
  }>({ isOpen: false, type: null, orderId: null });
  const [isProcessingConfirm, setIsProcessingConfirm] = useState(false);

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'REJECT' | 'CANCEL';
    orderId: number | null;
  }>({ isOpen: false, type: 'CANCEL', orderId: null });
  const [actionReason, setActionReason] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { page: number; limit: number; search?: string; status?: string } = { 
        page, limit 
      };
      if (searchQuery.trim()) params.search = searchQuery;
      if (filterStatus !== "All") params.status = filterStatus;

      const response = await purchaseOrderService.getAllPOs(params);
      
      setOrders(response.data);
      setOriginalOrders(response.data);
      setTotal(response.total);
      setSortConfig({ key: null, direction: "none" });
      
    } catch (error) {
      console.error("Failed to fetch POs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, filterStatus]);

  const handleSort = (key: string) => {
    let nextDirection: "asc" | "desc" | "none" = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") nextDirection = "desc";
      else if (sortConfig.direction === "desc") nextDirection = "none";
    }
    setSortConfig({ key, direction: nextDirection });

    if (nextDirection === "none") {
      setOrders(originalOrders);
      return;
    }

    const sorted = [...originalOrders].sort((a, b) => {
      let comparison = 0;
      let aVal: any;
      let bVal: any;

      switch (key) {
        case "code":
          aVal = a.code;
          bVal = b.code;
          break;
        case "supplierName":
          aVal = a.supplier?.supplierName;
          bVal = b.supplier?.supplierName;
          break;
        case "orderDate":
          aVal = a.orderDate;
          bVal = b.orderDate;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "totalAmount":
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case "createdBy":
          aVal = a.employee?.fullName;
          bVal = b.employee?.fullName;
          break;
        default:
          aVal = "";
          bVal = "";
      }

      const isNumeric = (val: any) => {
        if (val === null || val === undefined || val === "") return false;
        return !isNaN(Number(val));
      };

      if (isNumeric(aVal) && isNumeric(bVal)) {
        comparison = Number(aVal) - Number(bVal);
      } else if (key === "orderDate") {
        const aDate = aVal ? new Date(aVal).getTime() : 0;
        const bDate = bVal ? new Date(bVal).getTime() : 0;
        comparison = aDate - bDate;
      } else {
        const aStr = aVal?.toString() || "";
        const bStr = bVal?.toString() || "";
        comparison = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: "base" });
      }

      return nextDirection === "asc" ? comparison : -comparison;
    });

    setOrders(sorted);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchOrders]);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage("");
    }, 1200);
  };

  const showWarningNotification = (message: string) => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    setWarningMessage(message);
    setShowWarning(true);
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      setWarningMessage("");
      warningTimeoutRef.current = null;
    }, 2000);
  };

  const handleViewDetails = async (orderId: number) => {
    try {
      const detail = await purchaseOrderService.getPOById(orderId);
      setSelectedOrder(detail);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      showWarningNotification("Failed to load order details.");
    }
  };

  const handleUpdate = (id: number) => setSelectedUpdateId(id);

  const openConfirmAction = (orderId: number, type: ConfirmActionType) => {
    setConfirmAction({ isOpen: true, type, orderId });
  };

  const closeConfirmAction = () => {
    if (isProcessingConfirm) return;
    setConfirmAction({ isOpen: false, type: null, orderId: null });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction.orderId || !confirmAction.type) return;

    setIsProcessingConfirm(true);
    try {
      if (confirmAction.type === "SUBMIT") {
        await purchaseOrderService.submitPO(confirmAction.orderId);
        showSuccessNotification("Order submitted for approval.");
      } else if (confirmAction.type === "APPROVE") {
        await purchaseOrderService.approvePO(confirmAction.orderId);
        showSuccessNotification("Approved successfully!");
        setIsModalOpen(false);
      } else if (confirmAction.type === "MARK_ORDERED") {
        await purchaseOrderService.sendToSupplier(confirmAction.orderId);
        showSuccessNotification("Purchase order marked as ordered.");
      }

      fetchOrders();
      setConfirmAction({ isOpen: false, type: null, orderId: null });
    } catch (error: any) {
      const fallbackMessage =
        confirmAction.type === "SUBMIT"
          ? "Failed to submit."
          : confirmAction.type === "APPROVE"
            ? "Failed to approve."
            : "Failed to update status.";
      setConfirmAction({ isOpen: false, type: null, orderId: null });
      showWarningNotification(error?.response?.data?.message || fallbackMessage);
    } finally {
      setIsProcessingConfirm(false);
    }
  };

  const checkApprove = (id: number) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      showWarningNotification("User not found!");
      return;
    }
    const user = JSON.parse(userStr);
    const hasPermission = user.roles.some(
      (role: { roleId: number; roleName: string }) => 
        role.roleName === "Production Manager" || role.roleName === "System Admin"
    );
    if (hasPermission) {
      openConfirmAction(id, "APPROVE");
    } else {
      showWarningNotification("You do not have permission to approve orders.");
    }
  };

  const openActionModal = (orderId: number, type: 'REJECT' | 'CANCEL') => {
    setActionModal({ isOpen: true, type, orderId });
    setActionReason("");
  };

  const handleConfirmActionWithReason = async () => {
    if (!actionModal.orderId || !actionReason.trim()) return;

    setIsProcessingAction(true);
    try {
      await purchaseOrderService.cancelPO(actionModal.orderId, { note: actionReason });
      showSuccessNotification(`Order ${actionModal.type.toLowerCase()}ed successfully.`);
      
      fetchOrders();
      setActionModal({ isOpen: false, type: 'CANCEL', orderId: null });
    } catch (error: any) {
      setActionModal({ isOpen: false, type: 'CANCEL', orderId: null });
      showWarningNotification(error?.response?.data?.message || "Action failed.");
    } finally {
      setIsProcessingAction(false);
    }
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
  const confirmConfig = (() => {
    switch (confirmAction.type) {
      case "SUBMIT":
        return {
          title: "Submit Purchase Order",
          message: "Submit this order for approval?",
          confirmLabel: "Submit",
          variant: "primary" as const,
        };
      case "APPROVE":
        return {
          title: "Approve Purchase Order",
          message: "Are you sure you want to approve this order?",
          confirmLabel: "Approve",
          variant: "success" as const,
        };
      case "MARK_ORDERED":
        return {
          title: "Mark As Ordered",
          message: "Mark this Purchase Order as Ordered and sent to supplier?",
          confirmLabel: "Mark Ordered",
          variant: "primary" as const,
        };
      default:
        return {
          title: "Confirm Action",
          message: "Are you sure you want to continue?",
          confirmLabel: "Confirm",
          variant: "primary" as const,
        };
    }
  })();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVING">Receiving</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
           <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold select-none">
                <tr>
                  <th 
                    className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-1.5">
                      PO Code
                      <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "code" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("supplierName")}
                  >
                    <div className="flex items-center gap-1.5">
                      Supplier Name
                      <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "supplierName" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("orderDate")}
                  >
                    <div className="flex items-center gap-1.5">
                      Order Date
                      <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "orderDate" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "status" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("totalAmount")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Total Amount
                      <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "totalAmount" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("createdBy")}
                  >
                    <div className="flex items-center gap-1.5">
                      Created By
                      <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "createdBy" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                  </th>
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
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td className="p-4 text-gray-700">{order.employee?.fullName || "System"}</td>
                      <td className="p-4 flex items-center justify-center gap-1.5">
                        
                        <button 
                          onClick={() => handleViewDetails(order.purchaseOrderId)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {order.status === "DRAFT" && (
                          <>
                            {hasPermission("PO_CREATE") && (
                              <button onClick={() => handleUpdate(order.purchaseOrderId)} className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" title="Edit Order">
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission("PO_SUBMIT") && (
                              <button onClick={() => openConfirmAction(order.purchaseOrderId, "SUBMIT")} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="Submit for Approval">
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        
                        {order.status === 'PENDING' && (
                          <>
                            {hasPermission("PO_CREATE") && (
                              <button onClick={() => handleUpdate(order.purchaseOrderId)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="View/Edit Details">
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission("PO_APPROVE") && (
                              <button onClick={() => checkApprove(order.purchaseOrderId)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer" title="Approve Order">
                                  <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission("PO_CANCEL") && (
                              <button onClick={() => openActionModal(order.purchaseOrderId, 'REJECT')} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Reject Order">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {order.status === 'APPROVED' && (
                          <>
                            {hasPermission("PO_RECEIVE") && (
                              <button onClick={() => openConfirmAction(order.purchaseOrderId, "MARK_ORDERED")} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer" title="Mark as Ordered">
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission("PO_CANCEL") && (
                              <button onClick={() => openActionModal(order.purchaseOrderId, 'CANCEL')} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Cancel Order">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
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
                      className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-700 px-2">
                      {page} / {totalPages}
                  </span>
                  <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
            onApprove={() => checkApprove(selectedOrder.purchaseOrderId)}
          />
      )}

      <UpdateOrderModal
          isOpen={selectedUpdateId !== null}
          onClose={() => setSelectedUpdateId(null)}
          orderId={selectedUpdateId}
          onSuccess={() => fetchOrders()}
      />

      {actionModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[500px] p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-full flex-shrink-0 bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Cancel / Reject Order
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to cancel / reject this order? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Please enter the reason (e.g., Supplier out of stock, order canceled due to pricing issues...)"
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() =>
                  setActionModal({
                    isOpen: false,
                    type: 'CANCEL',
                    orderId: null,
                  })
                }
                disabled={isProcessingAction}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleConfirmActionWithReason}
                disabled={isProcessingAction || !actionReason.trim()}
                className="flex items-center gap-2 px-6 py-2 text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm bg-red-600 hover:bg-red-700"
              >
                {isProcessingAction && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <SuccessNotification isVisible={showSuccess} message={successMessage} />
      <ConfirmNotification
        isOpen={confirmAction.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        isProcessing={isProcessingConfirm}
        onConfirm={handleConfirmAction}
        onClose={closeConfirmAction}
      />
      <WarningNotification
        isVisible={showWarning}
        message={warningMessage}
        onClose={() => {
          setShowWarning(false);
          setWarningMessage("");
        }}
      />

    </div>
  );
};

import { 
  Search, 
  Filter, 
  Plus, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";
import { useState, useMemo, type JSX, useEffect, useCallback } from "react";
import { NewSalesOrderModal } from "./NewSalesOrderModal";
import { SalesOrderDetailModal } from "./SalesOrderDetailModal";
import { SalesOrdersServices, type SalesOrderListItem, type SalesOrderDetail } from "../../../services/salesOrdersServices";
import { hasAnyRole } from "../../../lib/auth";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { ReasonConfirmNotification } from "../../Notification/ReasonConfirmNotification";

export const Orders = (): JSX.Element => {
  const [orders, setOrders] = useState<SalesOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDetail | null>(null);

  // Notification States
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Submit Confirm
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [orderToSubmit, setOrderToSubmit] = useState<number | null>(null);

  // Delete Confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  // Approve Confirm
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState<number | null>(null);

  // Reject Reason Confirm
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [orderToReject, setOrderToReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Start Processing Confirm
  const [showStartProcessingConfirm, setShowStartProcessingConfirm] = useState(false);
  const [orderToStartProcessing, setOrderToStartProcessing] = useState<number | null>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage("");
    }, 3000);
  };

  const triggerWarning = (msg: string) => {
    setWarningMessage(msg);
    setShowWarning(true);
    setTimeout(() => {
      setShowWarning(false);
      setWarningMessage("");
    }, 4000);
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const fetchSalesOrders = useCallback(async () => {
    setIsLoading(true);
    try {
        const params: { page: number; limit: number; search?: string } = { 
            page, 
            limit 
        };
        
        if (searchQuery.trim()) {
            params.search = searchQuery;
        }

        const response = await SalesOrdersServices.getAllSalesOrders(params);
        
        setOrders(response.data);
        setTotal(response.total);
    } catch (error) {
        console.error("Failed to get sales orders: ", error);
    } finally {
        setIsLoading(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        fetchSalesOrders();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchSalesOrders]);
  
  const displayedOrders = useMemo(() => {
    if (filterStatus === "All") return orders;
    return orders.filter(o => o.status === filterStatus);
  }, [orders, filterStatus]);

  const handleCreateOrder = () => {
    setIsNewOrderOpen(false);
    fetchSalesOrders();
  };

  const handleSelectedSalesOrder = async (id: number) => {
    try {
        const response = await SalesOrdersServices.getSalesOrderDetail(id);
        setSelectedOrder(response);
    } catch (error) {
        console.error("Failed to get sales order detail: ", error);
        triggerWarning("Failed to load order details.");
    }
  };

  const handleSubmitOrder = (id: number) => {
    if (hasAnyRole(["PROD_MGR"])) {
      triggerWarning("You do not have permission to submit orders.");
      return;
    }
    setOrderToSubmit(id);
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (orderToSubmit === null) return;
    setIsActionLoading(true);
    try {
        await SalesOrdersServices.submitSalesOrder(orderToSubmit);
        fetchSalesOrders();
        triggerSuccess("Sales order submitted for approval successfully!");
    } catch (error: any) {
        triggerWarning(error?.response?.data?.message || "Failed to submit order.");
    } finally {
        setIsActionLoading(false);
        setShowSubmitConfirm(false);
        setOrderToSubmit(null);
    }
  };

  const handleDeleteDraft = (id: number) => {
    if (hasAnyRole(["PROD_MGR"])) {
      triggerWarning("You do not have permission to delete draft orders.");
      return;
    }
    setOrderToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (orderToDelete === null) return;
    setIsActionLoading(true);
    try {
        await SalesOrdersServices.deleteSalesOrder(orderToDelete);
        fetchSalesOrders();
        triggerSuccess("Draft order deleted successfully!");
    } catch (error: any) {
        triggerWarning(error?.response?.data?.message || "Failed to delete order.");
    } finally {
        setIsActionLoading(false);
        setShowDeleteConfirm(false);
        setOrderToDelete(null);
    }
  };

  const handleApproveOrder = (id: number) => {
    setOrderToApprove(id);
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = async () => {
    if (orderToApprove === null) return;
    setIsActionLoading(true);
    try {
        const res = await SalesOrdersServices.approveSalesOrder(orderToApprove);
        const msg = `Order Approved Successfully! Reserved: ${res.reservedCount} units.`;
        if (res.shortage > 0) {
            triggerWarning(`${msg} ALERT: Shortage of ${res.shortage} units detected!`);
        } else {
            triggerSuccess(msg);
        }
        fetchSalesOrders();
    } catch (error: any) {
        triggerWarning(error?.response?.data?.message || "Approval failed.");
    } finally {
        setIsActionLoading(false);
        setShowApproveConfirm(false);
        setOrderToApprove(null);
    }
  };

  const handleRejectOrder = (id: number) => {
    setOrderToReject(id);
    setRejectReason("");
    setShowRejectConfirm(true);
  };

  const handleConfirmReject = async () => {
    if (orderToReject === null || !rejectReason.trim()) return;
    setIsActionLoading(true);
    try {
        await SalesOrdersServices.rejectSalesOrder(orderToReject, rejectReason.trim());
        fetchSalesOrders();
        triggerSuccess("Sales order rejected successfully.");
    } catch (error: any) {
        triggerWarning(error?.response?.data?.message || "Reject failed.");
    } finally {
        setIsActionLoading(false);
        setShowRejectConfirm(false);
        setOrderToReject(null);
        setRejectReason("");
    }
  };

  const handleStartProcessing = (id: number) => {
    if (hasAnyRole(["PROD_MGR"])) {
      triggerWarning("You do not have permission to start processing orders.");
      return;
    }
    setOrderToStartProcessing(id);
    setShowStartProcessingConfirm(true);
  };

  const handleConfirmStartProcessing = async () => {
    if (orderToStartProcessing === null) return;
    setIsActionLoading(true);
    try {
        await SalesOrdersServices.startProcessing(orderToStartProcessing);
        fetchSalesOrders();
        triggerSuccess("Sales order start processing successfully!");
    } catch (error: any) {
        triggerWarning(error?.response?.data?.message || "Failed to start processing.");
    } finally {
        setIsActionLoading(false);
        setShowStartProcessingConfirm(false);
        setOrderToStartProcessing(null);
    }
  };

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

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

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

            {!hasAnyRole(["PROD_MGR"]) && (
                <button 
                    onClick={() => setIsNewOrderOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium 
                    rounded-lg hover:bg-blue-500 transition-colors shadow-sm text-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> New Sales Order
                </button>
            )}
        </div>

        <div className="flex-1 overflow-x-auto min-h-[400px]">
            {isLoading ? (
                <div className="flex h-full min-h-[400px] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
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
                        {displayedOrders.length > 0 ? (
                            displayedOrders.map((order) => (
                                <tr key={order.salesOrderId} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                                    <td className="p-4 font-bold text-blue-600 flex items-center gap-2">
                                        {order.code}
                                        {order.hasShortage && (
                                            <AlertTriangle className="w-4 h-4 text-red-500"/>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">{order.agent?.agentName || "Unknown"}</td>
                                    <td className="p-4 font-medium text-gray-900">{order.employee?.fullName || "Unknown"}</td>
                                    <td className="p-4 text-right font-bold text-gray-900">
                                      ${Number(order.totalAmount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center justify-center gap-1">
                                        
                                        <button 
                                            onClick={() => handleSelectedSalesOrder(order.salesOrderId)}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        {order.status === 'DRAFT' && !hasAnyRole(["PROD_MGR"]) && (
                                            <>
                                                <button onClick={() => handleSubmitOrder(order.salesOrderId)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="Submit Order">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteDraft(order.salesOrderId)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Delete Draft">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}

                                        {order.status === 'PENDING_APPROVAL' && (
                                            <>
                                                <button onClick={() => handleApproveOrder(order.salesOrderId)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer" title="Approve Order">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleRejectOrder(order.salesOrderId)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Reject Order">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}

                                        {order.status === 'APPROVED' && !hasAnyRole(["PROD_MGR"]) && (
                                            <>
                                                <button onClick={() => handleStartProcessing(order.salesOrderId)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors cursor-pointer" title="Start Processing">
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-400">
                                    No orders found matching criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>

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

      <NewSalesOrderModal 
        isOpen={isNewOrderOpen && !hasAnyRole(["PROD_MGR"])} 
        onClose={() => setIsNewOrderOpen(false)} 
        onConfirm={handleCreateOrder} 
      />
      
      <SalesOrderDetailModal 
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      <SuccessNotification isVisible={showSuccess} message={successMessage} />

      <WarningNotification 
        isVisible={showWarning} 
        message={warningMessage} 
        onClose={() => {
          setShowWarning(false);
          setWarningMessage("");
        }}
      />

      <ConfirmNotification
        isOpen={showSubmitConfirm}
        title="Submit Sales Order"
        message="Submit this draft order for approval?"
        confirmLabel="Submit"
        variant="primary"
        isProcessing={isActionLoading}
        onConfirm={handleConfirmSubmit}
        onClose={() => {
          if (!isActionLoading) {
            setShowSubmitConfirm(false);
            setOrderToSubmit(null);
          }
        }}
      />

      <ConfirmNotification
        isOpen={showDeleteConfirm}
        title="Delete Draft Order"
        message="Are you sure you want to delete this draft?"
        confirmLabel="Delete"
        variant="danger"
        isProcessing={isActionLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isActionLoading) {
            setShowDeleteConfirm(false);
            setOrderToDelete(null);
          }
        }}
      />

      <ConfirmNotification
        isOpen={showApproveConfirm}
        title="Approve Sales Order"
        message="Approve this sales order?"
        confirmLabel="Approve"
        variant="success"
        isProcessing={isActionLoading}
        onConfirm={handleConfirmApprove}
        onClose={() => {
          if (!isActionLoading) {
            setShowApproveConfirm(false);
            setOrderToApprove(null);
          }
        }}
      />

      <ReasonConfirmNotification
        isOpen={showRejectConfirm}
        title="Reject Sales Order"
        message="Please enter a reason for rejecting this order:"
        reason={rejectReason}
        reasonPlaceholder="Enter rejection reason..."
        confirmLabel="Reject"
        isProcessing={isActionLoading}
        onReasonChange={setRejectReason}
        onConfirm={handleConfirmReject}
        onClose={() => {
          if (!isActionLoading) {
            setShowRejectConfirm(false);
            setOrderToReject(null);
            setRejectReason("");
          }
        }}
      />

      <ConfirmNotification
        isOpen={showStartProcessingConfirm}
        title="Start Processing"
        message="Start processing/packing this order?"
        confirmLabel="Start"
        variant="primary"
        isProcessing={isActionLoading}
        onConfirm={handleConfirmStartProcessing}
        onClose={() => {
          if (!isActionLoading) {
            setShowStartProcessingConfirm(false);
            setOrderToStartProcessing(null);
          }
        }}
      />

    </div>
  );
};
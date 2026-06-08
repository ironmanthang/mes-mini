import { 
  Search, Filter, Plus, Eye, Edit, Loader2, 
  Package, Calendar, PlayCircle, PackageCheck, AlertCircle, Clock, Play,
  CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { WorkOrderServices, type WorkOrderListItem, type WorkOrderDetail } from "../../../services/workOrderServices";
import { CreateWorkOrderModal } from "./CreateWorkOrderModal";
import { RecordOutputModal } from "./RecordOutputModal";
import { WorkOrderDetailModal } from "./WorkOrderDetailModal";
import { ConfigureWorkOrderModal } from "./ConfigureWorkOrderModal";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { ReasonConfirmNotification } from "../../Notification/ReasonConfirmNotification";
import { WarningNotification } from "../../Notification/WarningNotification";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { hasPermission } from "../../../lib/auth";

export const WorkOrders = (): JSX.Element => {
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrderListItem | null>(null);
  const [selectedWODetail, setSelectedWODetail] = useState<WorkOrderDetail | null>(null);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const [isActionLoading, setIsActionLoading] = useState(false);

  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [woToRelease, setWoToRelease] = useState<WorkOrderListItem | null>(null);

  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [woToStart, setWoToStart] = useState<WorkOrderListItem | null>(null);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelReasonConfirm, setShowCancelReasonConfirm] = useState(false);
  const [woToCancel, setWoToCancel] = useState<WorkOrderListItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const triggerWarning = (msg: string) => {
    setWarningMessage(msg);
    setShowWarning(true);
    setTimeout(() => {
      setShowWarning(false);
      setWarningMessage("");
    }, 3000);
  };

  const handleConfirmRelease = async () => {
    if (!woToRelease) return;
    setIsActionLoading(true);
    try {
      await WorkOrderServices.releaseWorkOrder(woToRelease.workOrderId);
      fetchWorkOrders();
      setMessage("Work Order released successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      triggerWarning(e.response?.data?.message || "Failed to release Work Order");
    } finally {
      setIsActionLoading(false);
      setShowReleaseConfirm(false);
      setWoToRelease(null);
    }
  };

  const handleConfirmStart = async () => {
    if (!woToStart) return;
    setIsActionLoading(true);
    try {
      await WorkOrderServices.startWorkOrder(woToStart.workOrderId);
      fetchWorkOrders();
      setMessage("Production started successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      triggerWarning(e.response?.data?.message || "Failed to start Work Order");
    } finally {
      setIsActionLoading(false);
      setShowStartConfirm(false);
      setWoToStart(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!woToCancel) return;
    setIsActionLoading(true);
    try {
      await WorkOrderServices.cancelWorkOrder(woToCancel.workOrderId, "");
      fetchWorkOrders();
      setMessage("Work Order cancelled successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      triggerWarning(e.response?.data?.message || "Failed to cancel Work Order");
    } finally {
      setIsActionLoading(false);
      setShowCancelConfirm(false);
      setWoToCancel(null);
    }
  };

  const handleConfirmCancelWithReason = async () => {
    if (!woToCancel || !cancelReason.trim()) return;
    setIsActionLoading(true);
    try {
      await WorkOrderServices.cancelWorkOrder(woToCancel.workOrderId, cancelReason.trim());
      fetchWorkOrders();
      setMessage("Work Order cancelled successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      triggerWarning(e.response?.data?.message || "Failed to cancel Work Order");
    } finally {
      setIsActionLoading(false);
      setShowCancelReasonConfirm(false);
      setWoToCancel(null);
      setCancelReason("");
    }
  };

  const fetchWorkOrders = async () => {
    setIsLoading(true);
    try {
      const response = await WorkOrderServices.getAllWorkOrders({ limit: 1000 });
      setWorkOrders(response.data || []);
    } catch (error) {
      console.error("Failed to load work orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [sortConfig, setSortConfig] = useState<{
    key: 'code' | 'product' | 'quantity' | 'startDate' | 'status' | 'materialRequest' | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null,
  });

  const handleSort = (key: 'code' | 'product' | 'quantity' | 'startDate' | 'status' | 'materialRequest') => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: 'code' | 'product' | 'quantity' | 'startDate' | 'status' | 'materialRequest') => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const sortedAndFilteredOrders = useMemo(() => {
    const filtered = workOrders.filter(wo => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        wo.code?.toLowerCase().includes(searchLower) || 
        wo.product?.productName?.toLowerCase().includes(searchLower) ||
        wo.product?.code?.toLowerCase().includes(searchLower);
      
      const matchStatus = filterStatus === "All" || wo.status === filterStatus;
      
      return matchSearch && matchStatus;
    });

    if (!sortConfig.key || !sortConfig.direction) {
      return filtered;
    }

    const { key, direction } = sortConfig;
    const isAsc = direction === 'asc';

    return [...filtered].sort((a, b) => {
      if (key === 'code') {
        const valA = a.code || "";
        const valB = b.code || "";
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (key === 'product') {
        const valA = a.product?.productName || "";
        const valB = b.product?.productName || "";
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (key === 'quantity') {
        const valA = a.quantity || 0;
        const valB = b.quantity || 0;
        return isAsc ? valA - valB : valB - valA;
      }
      if (key === 'startDate') {
        if (!a.startDate && !b.startDate) return 0;
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        const valA = new Date(a.startDate).getTime();
        const valB = new Date(b.startDate).getTime();
        return isAsc ? valA - valB : valB - valA;
      }
      if (key === 'status') {
        const valA = a.status || "";
        const valB = b.status || "";
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (key === 'materialRequest') {
        const valA = a.materialRequest?.status || "";
        const valB = b.materialRequest?.status || "";
        if (!valA && !valB) return 0;
        if (!valA) return 1;
        if (!valB) return -1;
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [workOrders, searchQuery, filterStatus, sortConfig]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wider">Draft</span>;
      case 'RELEASED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">Released</span>;
      case 'IN_PROGRESS': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider"><PlayCircle className="w-3 h-3"/> In Progress</span>;
      case 'COMPLETED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider"><PackageCheck className="w-3 h-3"/> Completed</span>;
      case 'CANCELLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-200 uppercase tracking-wider">Cancelled</span>;
      default: 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-700 uppercase tracking-wider">{status}</span>;
    }
  };

  const renderMRStatus = (status: string | undefined) => {
    switch (status) {
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700 border border-green-200">
            <PackageCheck className="w-2.5 h-2.5" /> ISSUED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
            <AlertCircle className="w-2.5 h-2.5" /> PENDING
          </span>
        );
      default:
        return <span className="text-[10px] text-gray-400 italic">No Request</span>;
    }
  };

  const renderActions = (wo: WorkOrderListItem) => {
    const actions = [];

    // 0. Edit/Configure: DRAFT only
    if (wo.status === 'DRAFT' && hasPermission("WO_UPDATE")) {
      actions.push(
        <button 
          key="edit"
          onClick={() => { 
            setSelectedWO(wo); 
            setIsConfigModalOpen(true); 
          }}
          className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors cursor-pointer"
          title="Configure Work Order"
        >
          <Edit className="w-4 h-4" />
        </button>
      );
    }

    // 1. Release: DRAFT -> RELEASED
    if (wo.status === 'DRAFT' && hasPermission("WO_UPDATE")) {
      actions.push(
        <button 
          key="release"
          onClick={() => {
            setWoToRelease(wo);
            setShowReleaseConfirm(true);
          }}
          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
          title="Release Work Order"
        >
          <Play className="w-4 h-4" />
        </button>
      );
    }

    // 2. Start: RELEASED -> IN_PROGRESS
    if (wo.status === 'RELEASED' && hasPermission("WO_UPDATE")) {
      actions.push(
        <button 
          key="start"
          onClick={() => {
            setWoToStart(wo);
            setShowStartConfirm(true);
          }}
          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
          title="Start Production"
        >
          <PlayCircle className="w-4 h-4" />
        </button>
      );
    }

    // 3. Record Output: IN_PROGRESS -> COMPLETED (only SYS_ADMIN and PROD_MGR)
    if (wo.status === 'IN_PROGRESS' && hasPermission("WO_COMPLETE")) {
      actions.push(
        <button 
          key="output"
          onClick={() => { setSelectedWO(wo); setIsOutputModalOpen(true); }}
          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
          title="Record Output"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      );
    }

    // 4. Cancel: DRAFT, RELEASED, IN_PROGRESS -> CANCELLED
    if (['DRAFT', 'RELEASED', 'IN_PROGRESS'].includes(wo.status) && hasPermission("WO_UPDATE")) {
      actions.push(
        <button 
          key="cancel"
          onClick={() => {
            setWoToCancel(wo);
            if (wo.status === 'IN_PROGRESS') {
              setCancelReason("");
              setShowCancelReasonConfirm(true);
            } else {
              setShowCancelConfirm(true);
            }
          }}
          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" 
          title="Cancel Work Order"
        >
          <XCircle className="w-4 h-4" />
        </button>
      );
    }

    // Always show View Detail (fetches detailed WO data by ID)
    actions.push(
      <button 
        key="view"
        onClick={async () => { 
          try {
            const details = await WorkOrderServices.getWorkOrderById(wo.workOrderId);
            setSelectedWODetail(details); 
            setIsDetailModalOpen(true); 
          } catch (e: any) {
            triggerWarning(e.response?.data?.message || "Failed to load Work Order details");
          }
        }} 
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
    );

    return <div className="flex items-center justify-center gap-2">{actions}</div>;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Work Orders
            </h2>
            <p className="text-sm text-gray-500 mt-1">Schedule production and track active orders on the shop floor.</p>
          </div>
          {hasPermission("WO_CREATE") && (
            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Work Order
            </button>
          )}
        </div>

        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search WO Code, Product..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <Filter className="w-4 h-4 text-gray-500 ml-2" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-sm p-1 outline-none text-gray-700 font-medium cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="DRAFT">Drafts</option>
                <option value="RELEASED">Released</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold sticky top-0">
                <tr>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center gap-1">
                      WO Code
                      {getSortIcon('code')}
                    </div>
                  </th>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group"
                    onClick={() => handleSort('product')}
                  >
                    <div className="flex items-center gap-1">
                      Product
                      {getSortIcon('product')}
                    </div>
                  </th>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group text-center"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Target Qty
                      {getSortIcon('quantity')}
                    </div>
                  </th>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center gap-1">
                      Start Date
                      {getSortIcon('startDate')}
                    </div>
                  </th>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group text-center"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group text-center"
                    onClick={() => handleSort('materialRequest')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Material Request
                      {getSortIcon('materialRequest')}
                    </div>
                  </th>
                  <th className="p-4 border-b border-gray-200 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {sortedAndFilteredOrders.length > 0 ? (
                  sortedAndFilteredOrders.map((wo) => (
                    <tr key={wo.workOrderId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-600">{wo.code}</td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900 block">{wo.product?.productName || 'Unknown Product'}</span>
                        <span className="text-xs text-gray-500">{wo.product?.code}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-medium">
                        {wo.quantity} <span className="text-xs text-gray-400">{wo.product?.unit}</span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(wo.startDate)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {renderStatusBadge(wo.status)}
                      </td>
                      <td className="p-4 text-center">
                        {renderMRStatus(wo.materialRequest?.status)}
                      </td>
                      <td className="p-4">
                        {renderActions(wo)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <Clock className="w-8 h-8 mb-2 opacity-20" />
                        <p>No work orders found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateWorkOrderModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={(msg) => {
          fetchWorkOrders();
          setMessage(msg || "Work Order created successfully!");
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }} 
      />

      {selectedWODetail && (
        <WorkOrderDetailModal 
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setSelectedWODetail(null); }}
          workOrder={selectedWODetail}
        />
      )}

      {selectedWO && (
        <RecordOutputModal
          isOpen={isOutputModalOpen}
          onClose={() => { setIsOutputModalOpen(false); setSelectedWO(null); }}
          onSuccess={() => {
            fetchWorkOrders();
            setMessage("Production output recorded successfully!");
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }}
          workOrder={selectedWO}
        />
      )}

      {selectedWO && (
        <ConfigureWorkOrderModal
          isOpen={isConfigModalOpen}
          onClose={() => { setIsConfigModalOpen(false); setSelectedWO(null); }}
          onSuccess={() => {
            fetchWorkOrders();
            setMessage("Work Order configured successfully!");
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }}
          workOrder={selectedWO}
        />
      )}

      <SuccessNotification isVisible={showSuccess} message={message}/>

      <WarningNotification 
        isVisible={showWarning} 
        message={warningMessage}
        onClose={() => setShowWarning(false)}
      />

      <ConfirmNotification
        isOpen={showReleaseConfirm}
        title="Release Work Order"
        message={`Are you sure you want to release Work Order ${woToRelease?.code}?`}
        confirmLabel="Release"
        variant="primary"
        isProcessing={isActionLoading}
        onConfirm={handleConfirmRelease}
        onClose={() => {
          if (!isActionLoading) {
            setShowReleaseConfirm(false);
            setWoToRelease(null);
          }
        }}
      />

      <ConfirmNotification
        isOpen={showStartConfirm}
        title="Start Production"
        message={`Are you sure you want to start production for Work Order ${woToStart?.code}?`}
        confirmLabel="Start"
        variant="primary"
        isProcessing={isActionLoading}
        onConfirm={handleConfirmStart}
        onClose={() => {
          if (!isActionLoading) {
            setShowStartConfirm(false);
            setWoToStart(null);
          }
        }}
      />

      <ConfirmNotification
        isOpen={showCancelConfirm}
        title="Cancel Work Order"
        message={`Are you sure you want to cancel Work Order ${woToCancel?.code}?`}
        confirmLabel="Cancel Work Order"
        variant="danger"
        isProcessing={isActionLoading}
        onConfirm={handleConfirmCancel}
        onClose={() => {
          if (!isActionLoading) {
            setShowCancelConfirm(false);
            setWoToCancel(null);
          }
        }}
      />

      <ReasonConfirmNotification
        isOpen={showCancelReasonConfirm}
        title="Cancel Work Order"
        message={`Please provide a reason for cancelling the IN_PROGRESS Work Order ${woToCancel?.code}:`}
        reason={cancelReason}
        reasonPlaceholder="Enter cancellation reason..."
        confirmLabel="Cancel Work Order"
        isProcessing={isActionLoading}
        onReasonChange={setCancelReason}
        onConfirm={handleConfirmCancelWithReason}
        onClose={() => {
          if (!isActionLoading) {
            setShowCancelReasonConfirm(false);
            setWoToCancel(null);
            setCancelReason("");
          }
        }}
      />
    </div>
  );
};
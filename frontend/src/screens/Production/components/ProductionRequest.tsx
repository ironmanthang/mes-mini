import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Loader2, 
  Package, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Send,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { ProductionRequestServices, type ProductionRequest } from "../../../services/productionRequestServices";
import { CreateNewProductionRequestModal } from "./CreateNewProductionRequestModal";
import { UpdateProductionRequestModal } from "./UpdateProductionRequestModal";
import { ProductionRequestDetailModal } from "./ProductionRequestDetailModal";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { WarningNotification } from "../../Notification/WarningNotification";
import { hasPermission } from "../../../lib/auth";

export const CreateProductionRequest = (): JSX.Element => {
  const [requests, setRequests] = useState<ProductionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: "submit" | "approve" | null;
    id: number | null;
    title: string;
    message: string;
    variant: "primary" | "success" | "danger";
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: "",
    message: "",
    variant: "primary",
  });
  const [isProcessingConfirm, setIsProcessingConfirm] = useState(false);

  const handleSubmitDraft = (id: number) => {
    setConfirmState({
      isOpen: true,
      type: "submit",
      id,
      title: "Submit Draft",
      message: "Are you sure you want to submit this draft for review?",
      variant: "primary",
    });
  };

  const handleApprove = (id: number) => {
    setConfirmState({
      isOpen: true,
      type: "approve",
      id,
      title: "Approve Request",
      message: "Are you sure you want to approve this production request?",
      variant: "success",
    });
  };

  const handleConfirmAction = async () => {
    if (confirmState.id === null || !confirmState.type) return;
    setIsProcessingConfirm(true);
    try {
      if (confirmState.type === "submit") {
        await ProductionRequestServices.submitProductionRequest(confirmState.id);
        setMessage("Production Request submitted successfully!");
      } else if (confirmState.type === "approve") {
        await ProductionRequestServices.approveProductionRequest(confirmState.id);
        setMessage("Production Request approved!");
      }
      fetchRequests();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setConfirmState({ isOpen: false, type: null, id: null, title: "", message: "", variant: "primary" });
    } catch (error: any) {
      setWarningMessage(error.response?.data?.message || "An error occurred while processing your request.");
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      setConfirmState({ isOpen: false, type: null, id: null, title: "", message: "", variant: "primary" });
    } finally {
      setIsProcessingConfirm(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await ProductionRequestServices.getAllProductionRequests();
      const dataArray = Array.isArray(response) ? response : (response as any).data || [];
      setRequests(dataArray);
    } catch (error) {
      console.error("Failed to load production requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [sortConfig, setSortConfig] = useState<{
    key: 'code' | 'product' | 'quantity' | 'priority' | 'status' | 'dueDate' | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null,
  });

  const handleSort = (key: 'code' | 'product' | 'quantity' | 'priority' | 'status' | 'dueDate') => {
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

  const getSortIcon = (key: 'code' | 'product' | 'quantity' | 'priority' | 'status' | 'dueDate') => {
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
    fetchRequests();
  }, []);

  const sortedAndFilteredRequests = useMemo(() => {
    const filtered = requests.filter(req => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        req.code?.toLowerCase().includes(searchLower) || 
        req.product?.productName?.toLowerCase().includes(searchLower) ||
        req.product?.code?.toLowerCase().includes(searchLower);
      
      const matchStatus = filterStatus === "All" || req.status === filterStatus;
      
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
      if (key === 'priority') {
        const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const valA = priorityWeight[a.priority || ""] || 0;
        const valB = priorityWeight[b.priority || ""] || 0;
        return isAsc ? valA - valB : valB - valA;
      }
      if (key === 'status') {
        const valA = a.status || "";
        const valB = b.status || "";
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (key === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const valA = new Date(a.dueDate).getTime();
        const valB = new Date(b.dueDate).getTime();
        return isAsc ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [requests, searchQuery, filterStatus, sortConfig]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wider">Draft</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 uppercase tracking-wider">Pending</span>;
      case 'APPROVED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3"/> Approved</span>;
      case 'WAITING_MATERIAL': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider"><AlertTriangle className="w-3 h-3"/> Waiting Mat.</span>;
      case 'IN_PROGRESS': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider"><PlayCircle className="w-3 h-3"/> In Progress</span>;
      case 'FULFILLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">Fulfilled</span>;
      case 'CANCELLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-200 uppercase tracking-wider">Cancelled</span>;
      default: 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-700 uppercase tracking-wider">{status}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 font-bold';
      case 'MEDIUM': return 'text-yellow-600 font-bold';
      case 'LOW': return 'text-green-600 font-medium';
      default: return 'text-gray-600 font-medium';
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Production Requests
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage MRP checks, material reservations, and manufacturing queues.</p>
          </div>
          {hasPermission("PR_CREATE") && hasPermission("SO_READ") && (
            <button 
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Request
            </button>
          )}
        </div>

        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search PR Code, Product..." 
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
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="WAITING_MATERIAL">Waiting Material</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="FULFILLED">Fulfilled</option>
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
                      Request Code
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
                  <th className="p-4 border-b border-gray-200">Type</th>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group text-right"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {getSortIcon('quantity')}
                      Quantity
                    </div>
                  </th>
                  <th 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group text-center"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Priority
                      {getSortIcon('priority')}
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
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none transition-colors group"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      Due Date
                      {getSortIcon('dueDate')}
                    </div>
                  </th>
                  <th className="p-4 border-b border-gray-200 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {sortedAndFilteredRequests.length > 0 ? (
                  sortedAndFilteredRequests.map((req) => (
                    <tr key={req.productionRequestId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-blue-600">{req.code}</td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900 block">{req.product?.productName || 'Unknown Product'}</span>
                        <span className="text-xs text-gray-500">{req.product?.code}</span>
                      </td>
                      <td className="p-4">
                        {req.soDetailId ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100">MTO</span>
                        ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded border border-gray-200">MTS</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-medium">{req.quantity} <span className="text-xs text-gray-400">{req.product?.unit}</span></td>
                      <td className={`p-4 text-center ${getPriorityColor(req.priority)}`}>
                        {req.priority}
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(req.dueDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedViewId(req.productionRequestId)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {req.status === 'DRAFT' && (
                            <>
                              {hasPermission("PR_UPDATE") && (
                                <button 
                                onClick={() => setSelectedUpdateId(req.productionRequestId)}
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" 
                                title="Edit Draft"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              )}
                              {hasPermission("PR_UPDATE") && (
                                <button
                                  onClick={() => handleSubmitDraft(req.productionRequestId)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                                  title="Submit Request"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {req.status === 'PENDING' && hasPermission("PR_APPROVE") && (
                            <button 
                              onClick={() => handleApprove(req.productionRequestId)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer" 
                              title="Approve Request"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {req.status !== 'DRAFT' && hasPermission("PR_UPDATE") && (
                            <button 
                              onClick={() => setSelectedUpdateId(req.productionRequestId)}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" 
                              title="Update / Recheck"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <Clock className="w-8 h-8 mb-2 opacity-20" />
                        <p>No production requests found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateNewProductionRequestModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => {
          fetchRequests();
          setShowSuccess(true);
          setMessage("Production Request created successfully!");
          setTimeout(() => {
            setShowSuccess(false);
            setMessage("");
          }, 3000);
        }} 
      />

      <UpdateProductionRequestModal
        isOpen={selectedUpdateId !== null}
        onClose={() => setSelectedUpdateId(null)}
        requestId={selectedUpdateId}
        onSuccess={() => fetchRequests()}
      />

      <ProductionRequestDetailModal
        isOpen={selectedViewId !== null}
        onClose={() => setSelectedViewId(null)}
        requestId={selectedViewId}
      />

      <SuccessNotification isVisible={showSuccess} message={message}/>

      <ConfirmNotification
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        isProcessing={isProcessingConfirm}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmState({ isOpen: false, type: null, id: null, title: "", message: "", variant: "primary" })}
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
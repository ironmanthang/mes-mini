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
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { ProductionRequestServices, type ProductionRequest } from "../../../services/productionRequestServices";
import { CreateNewProductionRequestModal } from "./CreateNewProductionRequestModal";
import { UpdateProductionRequestModal } from "./UpdateProductionRequestModal";
import { ProductionRequestDetailModal } from "./ProductionRequestDetailModal";

export const CreateProductionRequest = (): JSX.Element => {
  const [requests, setRequests] = useState<ProductionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<number | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await ProductionRequestServices.getAllProductionRequests();
      const dataArray = Array.isArray(response) ? response : response.data || [];
      setRequests(dataArray);
    } catch (error) {
      console.error("Failed to load production requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- Filtering ---
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = 
        req.code?.toLowerCase().includes(searchLower) || 
        req.product?.productName?.toLowerCase().includes(searchLower) ||
        req.product?.code?.toLowerCase().includes(searchLower);
      
      const matchStatus = filterStatus === "All" || req.status === filterStatus;
      
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, filterStatus]);

  const handleCreateNew = () => {
    setIsNewModalOpen(true);
  };

  const handleViewDetails = (id: number) => {
    setSelectedViewId(id);
  };

  const handleUpdate = (id: number) => {
    setSelectedUpdateId(id);
  };

  // --- UI Helpers ---
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3"/> Approved</span>;
      case 'WAITING_MATERIAL': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle className="w-3 h-3"/> Waiting Material</span>;
      case 'IN_PROGRESS': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><PlayCircle className="w-3 h-3"/> In Progress</span>;
      case 'FULFILLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">Fulfilled</span>;
      case 'CANCELLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Cancelled</span>;
      default: 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 font-bold';
      case 'MEDIUM': return 'text-yellow-600 font-bold';
      case 'LOW': return 'text-green-600 font-medium';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* --- Header & Toolbar --- */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        
        {/* Title Area */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Production Requests
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage MRP checks, material reservations, and manufacturing queues.</p>
          </div>
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        {/* Filter Area */}
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
                <option value="All">All Statuses</option>
                <option value="APPROVED">Approved (Ready)</option>
                <option value="WAITING_MATERIAL">Waiting Material</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- Table Area --- */}
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold sticky top-0">
                <tr>
                  <th className="p-4 border-b border-gray-200">Request Code</th>
                  <th className="p-4 border-b border-gray-200">Product</th>
                  <th className="p-4 border-b border-gray-200">Type</th>
                  <th className="p-4 border-b border-gray-200 text-right">Quantity</th>
                  <th className="p-4 border-b border-gray-200 text-center">Priority</th>
                  <th className="p-4 border-b border-gray-200 text-center">Status</th>
                  <th className="p-4 border-b border-gray-200">Request Date</th>
                  <th className="p-4 border-b border-gray-200 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
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
                      <td className="p-4 text-gray-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(req.requestDate)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(req.productionRequestId)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdate(req.productionRequestId)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" 
                            title="Update / Recheck"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
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
        onSuccess={() => fetchRequests()} 
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
    </div>
  );
};
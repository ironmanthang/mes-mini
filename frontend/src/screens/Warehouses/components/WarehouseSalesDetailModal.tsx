import { 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Building2, 
  MapPin, 
  Package, 
  Boxes, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Calendar,
  ClipboardList
} from "lucide-react";
import { useState, useEffect, Fragment, type JSX } from "react";
import { WarehouseServices, type WarehouseSalesDetail } from "../../../services/warehouseServices";

interface WarehouseSalesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: number | null;
}

export const WarehouseSalesDetailModal = ({ isOpen, onClose, warehouseId }: WarehouseSalesDetailModalProps): JSX.Element | null => {
  const [detail, setDetail] = useState<WarehouseSalesDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset states when modal is opened for a different warehouse
  useEffect(() => {
    if (isOpen && warehouseId) {
      setSearchQuery("");
      setDebouncedSearch("");
      setPage(1);
      setLimit(10);
      setExpandedProducts(new Set());
      setDetail(null);
    }
  }, [warehouseId, isOpen]);

  // Fetch warehouse details
  useEffect(() => {
    if (!isOpen || !warehouseId) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await WarehouseServices.getWarehouseDetail<WarehouseSalesDetail>(warehouseId, {
          search: debouncedSearch,
          page,
          limit
        });
        setDetail(data);
      } catch (error) {
        console.error("Failed to fetch warehouse sales details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [warehouseId, debouncedSearch, page, limit, isOpen]);

  if (!isOpen || !warehouseId) return null;

  const toggleProductExpand = (productId: number) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider animate-pulse">
            Out of Stock
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
          </span>
        );
      case "OK":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider">
            In Stock
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClass = "px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider";
    switch (type) {
      case "COMPONENT":
        return <span className={`${baseClass} bg-purple-100 text-purple-700 border-purple-200`}>Component</span>;
      case "SALES":
        return <span className={`${baseClass} bg-indigo-100 text-indigo-700 border-indigo-200`}>Sales/Product</span>;
      case "ERROR":
        return <span className={`${baseClass} bg-red-100 text-red-700 border-red-200`}>Error/Defect</span>;
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-700 border-gray-200`}>{type}</span>;
    }
  };

  const formatDate = (dateString: string, includeTime = false) => {
    if (!dateString) return "N/A";
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      };
      if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }
      return new Date(dateString).toLocaleDateString("vi-VN", options);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4">
      <div 
        className="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {detail?.warehouseName || "Warehouse Inventory Detail"}
              </h2>
              {detail && getTypeBadge(detail.warehouseType)}
            </div>
            {detail && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{detail.location || "No location specified"}</span>
                <span className="text-gray-300">|</span>
                <span>ID: WH-{detail.warehouseId}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Total Products</p>
                <h3 className="text-2xl font-black text-indigo-950 mt-1">
                  {isLoading && !detail ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  ) : (
                    detail?.summary.totalProducts ?? 0
                  )}
                </h3>
              </div>
            </div>

            <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">Total Stock Units (Instances)</p>
                <h3 className="text-2xl font-black text-green-950 mt-1">
                  {isLoading && !detail ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  ) : (
                    (detail?.summary.totalInstances ?? 0).toLocaleString()
                  )}
                </h3>
              </div>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Code or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-bold uppercase">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg text-sm p-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-gray-200 rounded-xl overflow-hidden relative min-h-[200px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
            )}

            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-black border-b border-gray-200">
                <tr>
                  <th className="p-4 w-12 text-center">No.</th>
                  <th className="p-4">Product Code</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4 text-center">Unit</th>
                  <th className="p-4 text-right">In Stock Qty</th>
                  <th className="p-4 text-center">Min Stock</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Batches</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200">
                {detail?.data && detail.data.length > 0 ? (
                  detail.data.map((item, index) => {
                    const isExpanded = expandedProducts.has(item.productId);
                    const rowNumber = (page - 1) * limit + index + 1;
                    return (
                      <Fragment key={item.productId}>
                        {/* Parent Row */}
                        <tr 
                          className={`hover:bg-indigo-50/20 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/10' : ''}`}
                          onClick={() => toggleProductExpand(item.productId)}
                        >
                          <td className="p-4 text-center text-gray-400 font-mono">{rowNumber}</td>
                          <td className="p-4 font-mono text-gray-900">{item.productCode}</td>
                          <td className="p-4 font-semibold text-gray-900 font-mono">{item.productName}</td>
                          <td className="p-4 text-center text-gray-500 font-medium">{item.unit}</td>
                          <td className="p-4 text-right font-black font-semibold font-mono">{item.inStockCount.toLocaleString()}</td>
                          <td className="p-4 text-center font-mono text-gray-500">{item.minStockLevel}</td>
                          <td className="p-4 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductExpand(item.productId);
                              }}
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              <span className="font-mono">{item.batches?.length ?? 0}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Batches Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 bg-gray-50/50">
                              <div className="px-12 py-4 border-t border-b border-gray-100">
                                <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> Production Batches breakdown
                                </h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-100 text-[10px] uppercase text-gray-500 font-black border-b border-gray-150">
                                      <tr>
                                        <th className="p-2.5 pl-4">Batch Code</th>
                                        <th className="p-2.5">Work Order Reference</th>
                                        <th className="p-2.5 text-center">Production Date</th>
                                        <th className="p-2.5 text-center">Expiry Date</th>
                                        <th className="p-2.5 text-right pr-4">Quantity</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-xs divide-y divide-gray-100">
                                      {item.batches && item.batches.length > 0 ? (
                                        item.batches.map(batch => (
                                          <tr key={batch.batchCode} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-2.5 pl-4 font-mono font-bold text-gray-800">{batch.batchCode}</td>
                                            <td className="p-2.5 font-semibold text-gray-500 font-mono">{batch.workOrderCode || "N/A"}</td>
                                            <td className="p-2.5 text-center text-gray-500">
                                              <div className="inline-flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                {formatDate(batch.productionDate)}
                                              </div>
                                            </td>
                                            <td className="p-2.5 text-center text-gray-500">
                                              {batch.expiryDate ? (
                                                <div className="inline-flex items-center gap-1">
                                                  <Calendar className="w-3 h-3 text-gray-400" />
                                                  {formatDate(batch.expiryDate)}
                                                </div>
                                              ) : (
                                                <span className="text-gray-400 italic font-medium">No Expiry</span>
                                              )}
                                            </td>
                                            <td className="p-2.5 text-right font-bold text-gray-700 pr-4">{batch.instanceCount.toLocaleString()} {item.unit}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={5} className="p-4 text-center text-gray-400 font-medium italic">
                                            No production batches available for this product in stock.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  !isLoading && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-400">
                        <Boxes className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        No product inventory found in this warehouse.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer (Pagination) */}
        {detail && detail.pagination && (
          <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center flex-shrink-0">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Showing <span className="text-gray-900">{Math.min((page - 1) * limit + 1, detail.pagination.total)}</span> to{" "}
              <span className="text-gray-900">{Math.min(page * limit, detail.pagination.total)}</span> of{" "}
              <span className="text-gray-900">{detail.pagination.total}</span> entries
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold text-gray-700">
                Page {page} / {detail.pagination.totalPages || 1}
              </div>
              <button
                onClick={() => setPage(p => Math.min(detail.pagination.totalPages, p + 1))}
                disabled={page === detail.pagination.totalPages || detail.pagination.totalPages === 0}
                className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

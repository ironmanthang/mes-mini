import { 
  Truck, 
  Search, 
  Plus, 
  Edit, 
  Loader2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ArrowDownUp
} from "lucide-react";
import { useState, useEffect, useCallback, type JSX } from "react";
import { AddSupplierModal } from "./AddSupplierModal";
import { DeleteSupplierModal } from "./DeleteSupplierModal";
import { supplierService, type Supplier } from "../../../services/supplierServices";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { hasPermission } from "../../../lib/auth";

export const SupplierInformation = (): JSX.Element => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<{id: number, name: string} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Supplier | null;
    direction: "asc" | "desc" | "none";
  }>({
    key: null,
    direction: "none",
  });

  const handleSort = (colSelectedToSort: keyof Supplier) => {
    let nextDirection: "asc" | "desc" | "none" = "asc";
    if (sortConfig.key === colSelectedToSort) {
      if (sortConfig.direction === "asc") nextDirection = "desc";
      else if (sortConfig.direction === "desc") nextDirection = "none";
    }
    setSortConfig({ key: colSelectedToSort, direction: nextDirection });
  };



  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await supplierService.getAllSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenAdd = () => {
    if (!hasPermission("SUPPLIER_CREATE")) return;
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    if (!hasPermission("SUPPLIER_UPDATE")) return;
    setSelectedSupplier(sup);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (!hasPermission("SUPPLIER_UPDATE")) return;
    setSupplierToDelete({ id, name });
  };

  const handleSaveSuccess = (msg: string) => {
    setMessage(msg);
    setShowSuccess(true);
    fetchSuppliers();
    setTimeout(() => {
        setMessage("");
        setShowSuccess(false);
    }, 1500);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.code.toLowerCase().includes(term) ||
      s.supplierName.toLowerCase().includes(term) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.phoneNumber && s.phoneNumber.toLowerCase().includes(term)) ||
      (s.address && s.address.toLowerCase().includes(term))
    );
  });

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (!sortConfig.key || sortConfig.direction === "none") return 0;

    const colSelectedToSort = sortConfig.key;
    const nextDirection = sortConfig.direction;

    let comparison = 0;
    const aVal = a[colSelectedToSort];
    const bVal = b[colSelectedToSort];

    const isNumeric = (val: any) => {
      if (val === null || val === undefined || val === "") return false;
      return !isNaN(Number(val));
    };

    if (isNumeric(aVal) && isNumeric(bVal)) {
      comparison = Number(aVal) - Number(bVal);
    } else {
      const aStr = aVal?.toString() || "";
      const bStr = bVal?.toString() || "";
      comparison = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: "base" });
    }
    return nextDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      
      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Suppliers</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {isLoading ? "-" : suppliers.length}
                </h3>
                <p className="text-xs text-green-600 font-medium mt-1">Active accounts</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Truck className="w-6 h-6" />
            </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        
        {/* Actions bar */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-white rounded-t-lg">
            <div className="flex items-center gap-3">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search Code, Name, Contact..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
            </div>

            {hasPermission("SUPPLIER_CREATE") && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Add Supplier
                    </button>
                </div>
            )}
        </div>

        {/* Suppliers table */}
        <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold sticky top-0 select-none">
                            <th 
                              className="p-4 w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => handleSort("code")}
                            >
                              <div className="flex items-center gap-1.5">
                                Supplier Code
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
                              onClick={() => handleSort("email")}
                            >
                              <div className="flex items-center gap-1.5">
                                Email
                                <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "email" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                              </div>
                            </th>
                            <th 
                              className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => handleSort("phoneNumber")}
                            >
                              <div className="flex items-center gap-1.5">
                                Phone
                                <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "phoneNumber" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                              </div>
                            </th>
                            <th 
                              className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => handleSort("address")}
                            >
                              <div className="flex items-center gap-1.5">
                                Address
                                <ArrowDownUp className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === "address" && sortConfig.direction !== "none" ? "text-blue-600" : "text-gray-400"}`} />
                              </div>
                            </th>
                            {hasPermission("SUPPLIER_UPDATE") && <th className="p-4 text-center w-24">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {sortedSuppliers.map((item) => (
                            <tr key={item.supplierId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono font-medium text-gray-500">{item.code}</td>
                                <td className="p-4 font-bold text-gray-900">{item.supplierName}</td>
                                <td className="p-4 text-gray-700">
                                    {item.email ? (
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            {item.email}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 font-italic">No Email</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-700 font-mono">
                                    {item.phoneNumber ? (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            {item.phoneNumber}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 font-italic">No Phone</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-600 truncate max-w-[250px]">
                                    {item.address ? (
                                        <span className="flex items-center gap-1.5" title={item.address}>
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            {item.address}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 font-italic">No Address</span>
                                    )}
                                </td>
                                {hasPermission("SUPPLIER_UPDATE") && (
                                    <td className="p-4 flex items-center justify-center gap-1">
                                        <button 
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded cursor-pointer transition-colors" 
                                            title="Edit Supplier"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.supplierId, item.supplierName)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors" 
                                            title="Delete Supplier"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {sortedSuppliers.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={hasPermission("SUPPLIER_UPDATE") ? 6 : 5} className="text-center py-12 text-gray-500">
                                    <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    No suppliers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      <AddSupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedSupplier}
        onConfirm={handleSaveSuccess} 
      />

      <DeleteSupplierModal
        isOpen={supplierToDelete !== null}
        onClose={() => setSupplierToDelete(null)}
        supplierId={supplierToDelete?.id || null}
        supplierName={supplierToDelete?.name || ""}
        onSuccess={() => {
            handleSaveSuccess("Supplier Deleted Successfully");
            setSupplierToDelete(null);
        }}
      />

      <SuccessNotification isVisible={showSuccess} message={message}/>
    </div>
  );
};

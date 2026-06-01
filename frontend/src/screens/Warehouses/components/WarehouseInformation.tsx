import { 
  Warehouse as WarehouseIcon,
  MapPin, 
  Plus, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, type JSX } from "react";
import { AddWarehouseModal } from "./AddWarehouseModel";
import { WarehouseServices, type Warehouse, type TYPE } from "../../../services/warehouseServices";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { hasAnyRole } from "../../../lib/auth";

export const WarehouseInformation = (): JSX.Element => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  const canEdit = !hasAnyRole(["PROD_MGR"]);

  // Notification States
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    dbId: number | null;
    name: string;
  }>({
    isOpen: false,
    dbId: null,
    name: "",
  });
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  const showWarningNotification = (msg: string) => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    setWarningMessage(msg);
    setShowWarning(true);
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      setWarningMessage("");
      warningTimeoutRef.current = null;
    }, 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!canEdit) return;
    if (confirmDelete.dbId === null) return;
    setIsProcessingDelete(true);
    try {
      await WarehouseServices.deleteWarehouse(confirmDelete.dbId);
      setConfirmDelete({ isOpen: false, dbId: null, name: "" });
      setSuccessMessage("Warehouse deleted successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      fetchWarehouses();
    } catch (error: any) {
      setConfirmDelete({ isOpen: false, dbId: null, name: "" });
      showWarningNotification(error.response?.data?.message || "Failed to delete warehouse");
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = filterType !== "All" ? { type: filterType as TYPE } : {};
      const response = await WarehouseServices.getAllWarehouse(params);
      
      const apiData = Array.isArray(response) ? response : (response as any).data || [];
      
      const mappedData = apiData.map((wh: Warehouse) => ({
        id: wh.code || `WH-${wh.warehouseId}`,
        dbId: wh.warehouseId,
        name: wh.warehouseName || "Unknown",
        location: wh.location || "Not specified",
        type: wh.warehouseType ? wh.warehouseType.charAt(0) + wh.warehouseType.slice(1).toLowerCase() : "Unknown",
      }));

      setWarehouses(mappedData);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleOpenAdd = () => {
    if (!canEdit) return;
    setSelectedWarehouse(null);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (warehouse: any) => {
    if (!canEdit) return;
    setSelectedWarehouse({
        warehouseId: warehouse.dbId,
        warehouseName: warehouse.name,
        location: warehouse.location,
        warehouseType: warehouse.type.toUpperCase()
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mr-auto">
                <WarehouseIcon className="w-5 h-5 text-blue-600" /> Warehouse List
            </h3>

            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                    className="border border-gray-300 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="All">All Types</option>
                    <option value="COMPONENT">Component</option>
                    <option value="SALES">Sales/Product</option>
                    <option value="ERROR">Error/Defect</option>
                </select>
            </div>

            {canEdit && (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Add Warehouse
                    </button>
                </div>
            )}
        </div>

        <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                            <th className="p-4">ID</th>
                            <th className="p-4">Warehouse Name</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {warehouses.length > 0 ? (
                            warehouses.map((item) => {
                                return (
                                    <tr key={item.dbId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{item.id}</td>
                                        <td className="p-4 font-bold text-blue-600">{item.name}</td>
                                        <td className="p-4 text-gray-600 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-gray-400" /> {item.location}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border uppercase tracking-wider ${
                                                item.type === 'Component' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                item.type === 'Sales' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 flex items-center justify-center gap-2">
                                            <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="View Inventory">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {canEdit && (
                                                <>
                                                    <button 
                                                        onClick={() => handleOpenEdit(item)} 
                                                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" title="Edit Info"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setConfirmDelete({
                                                                isOpen: true,
                                                                dbId: item.dbId,
                                                                name: item.name,
                                                            });
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Delete Warehouse"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-gray-400">
                                    <WarehouseIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    No warehouses found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      <AddWarehouseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedWarehouse} 
        onConfirm={async (data) => {
            try {
                if (selectedWarehouse) {
                    await WarehouseServices.updateWarehouse(selectedWarehouse.warehouseId, data);
                    setSuccessMessage("Warehouse updated successfully!");
                } else {
                    await WarehouseServices.createWarehouse(data);
                    setSuccessMessage("Warehouse created successfully!");
                }
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
                fetchWarehouses();
            } catch (error: any) {
                showWarningNotification(error.response?.data?.message || "An error occurred while saving the warehouse");
            }
        }} 
      />

      <SuccessNotification isVisible={showSuccess} message={successMessage} />

      <ConfirmNotification
        isOpen={confirmDelete.isOpen}
        title="Delete Warehouse"
        message={`Are you sure you want to delete warehouse ${confirmDelete.name}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isProcessing={isProcessingDelete}
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirmDelete({ isOpen: false, dbId: null, name: "" })}
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
import { 
  Cpu, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Building,
  ArrowRightLeft,
  ChevronRight,
  PackageCheck
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, type JSX } from "react";
import { supplierService, type Supplier, type SupplierComponent } from "../../../services/supplierServices";
import { componentService, type Component } from "../../../services/componentServices";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { hasPermission } from "../../../lib/auth";

export const SupplierComponents = (): JSX.Element => {
  const canEdit = hasPermission("SUPPLIER_UPDATE");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [assignedComponents, setAssignedComponents] = useState<SupplierComponent[]>([]);
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [targetComponentId, setTargetComponentId] = useState<number | "">("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    componentId: number | null;
    componentName: string;
  }>({
    isOpen: false,
    componentId: null,
    componentName: "",
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
    }, 2000);
  };

  const selectedSupplier = suppliers.find(s => s.supplierId === selectedSupplierId);

  // Fetch all suppliers
  const loadSuppliers = useCallback(async () => {
    setIsLoadingSuppliers(true);
    try {
      const response = await supplierService.getAllSuppliers();
      setSuppliers(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedSupplierId(response.data[0].supplierId);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setIsLoadingSuppliers(false);
    }
  }, []);

  // Fetch components assigned to the selected supplier
  const loadAssignedComponents = useCallback(async (supplierId: number) => {
    setIsLoadingComponents(true);
    try {
      const data = await supplierService.getSupplierComponents(supplierId);
      setAssignedComponents(data || []);
    } catch (err) {
      console.error("Failed to load supplier components:", err);
    } finally {
      setIsLoadingComponents(false);
    }
  }, []);

  // Fetch all components to offer in dropdown
  const loadAllComponents = useCallback(async () => {
    try {
      const res = await componentService.getAllComponents({ limit: 1000 });
      // Depending on API response shape
      const data = (res as any).data || res || [];
      setAllComponents(data);
    } catch (err) {
      console.error("Failed to load components:", err);
    }
  }, []);

  // Run on mount
  useEffect(() => {
    loadSuppliers();
    loadAllComponents();
  }, [loadSuppliers, loadAllComponents]);

  // Load components when selected supplier changes
  useEffect(() => {
    if (selectedSupplierId) {
      loadAssignedComponents(selectedSupplierId);
      setTargetComponentId(""); // Clear assignment selection
    } else {
      setAssignedComponents([]);
    }
  }, [selectedSupplierId, loadAssignedComponents]);

  // Handle assigning a component
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!selectedSupplierId || !targetComponentId) return;

    setIsAssigning(true);
    try {
      await supplierService.assignComponent(selectedSupplierId, Number(targetComponentId));
      setMessage("Component Mapped Successfully");
      setShowSuccess(true);
      
      // Reload mappings
      await loadAssignedComponents(selectedSupplierId);
      setTargetComponentId("");
      
      setTimeout(() => setShowSuccess(false), 1500);
    } catch (err: any) {
      console.error("Failed to assign:", err);
      showWarningNotification(err.response?.data?.message || "Failed to map component to this supplier.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Trigger deletion confirmation modal
  const triggerRemoveConfirmation = (componentId: number, componentName: string) => {
    if (!canEdit) return;
    setConfirmDelete({
      isOpen: true,
      componentId,
      componentName,
    });
  };

  // Handle removing an assigned component after confirmation
  const handleRemove = async () => {
    if (!canEdit) return;
    const { componentId } = confirmDelete;
    if (!selectedSupplierId || componentId === null) return;

    setIsProcessingDelete(true);
    try {
      await supplierService.removeComponent(selectedSupplierId, componentId);
      setMessage("Mapping Removed");
      setShowSuccess(true);
      setConfirmDelete({ isOpen: false, componentId: null, componentName: "" });
      await loadAssignedComponents(selectedSupplierId);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch (err: any) {
      console.error("Failed to remove:", err);
      setConfirmDelete({ isOpen: false, componentId: null, componentName: "" });
      showWarningNotification(err.response?.data?.message || "Failed to remove component mapping.");
    } finally {
      setIsProcessingDelete(false);
    }
  };

  // Calculate which components are NOT assigned to this supplier yet
  const unassignedComponents = allComponents.filter(c => 
    !assignedComponents.some(ac => ac.componentId === c.componentId)
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Supplier Selection list */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-[calc(100vh-270px)] min-h-[500px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 rounded-t-lg">
            <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" /> Select Supplier
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingSuppliers ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : suppliers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No suppliers available.</p>
            ) : (
              suppliers.map((sup) => {
                const isSelected = sup.supplierId === selectedSupplierId;
                return (
                  <button
                    key={sup.supplierId}
                    onClick={() => setSelectedSupplierId(sup.supplierId)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? "bg-blue-50/50 border-blue-200 text-blue-900 shadow-sm" 
                        : "border-transparent hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{sup.supplierName}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{sup.code}</p>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Components Mapping view */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Supplier details panel if selected */}
          {selectedSupplier && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Active Supplier
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1.5">{selectedSupplier.supplierName}</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Code: {selectedSupplier.code}</p>
              </div>
              <div className="text-xs text-gray-500 space-y-1 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-6">
                <p><span className="font-bold">Email:</span> {selectedSupplier.email || "N/A"}</p>
                <p><span className="font-bold">Phone:</span> {selectedSupplier.phoneNumber || "N/A"}</p>
                <p><span className="font-bold">Address:</span> {selectedSupplier.address || "N/A"}</p>
              </div>
            </div>
          )}

          {/* Mapping content */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-[calc(100vh-400px)] min-h-[400px]">
            <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 rounded-t-lg">
              <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" /> Supplied Components
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!selectedSupplierId ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Select a supplier on the left to see their components.
                </div>
              ) : isLoadingComponents ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold sticky top-0">
                      <th className="p-4">Component Code</th>
                      <th className="p-4">Component Name</th>
                      <th className="p-4 text-right">Suggested Cost</th>
                      {canEdit && <th className="p-4 text-center w-24">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {assignedComponents.map((ac) => (
                      <tr key={ac.componentId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-medium text-gray-500">{ac.code || `COMP-${ac.componentId}`}</td>
                        <td className="p-4 font-bold text-gray-900">{ac.name}</td>
                        <td className="p-4 text-right font-mono text-gray-700">
                          {ac.suggestedPrice ? `$${ac.suggestedPrice.toLocaleString('vi-VN')}` : "Not Set"}
                        </td>
                        {canEdit && (
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => triggerRemoveConfirmation(ac.componentId, ac.name)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors" 
                              title="Remove mapping"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {assignedComponents.length === 0 && (
                      <tr>
                        <td colSpan={canEdit ? 4 : 3} className="text-center py-12 text-gray-500">
                          <Cpu className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                          No components mapped to this supplier yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Form to add a component association */}
          {(selectedSupplierId && canEdit) && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-blue-600" /> Link Component to Supplier
              </h3>
              
              <form onSubmit={handleAssign} className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Select Material/Component</label>
                  <select
                    value={targetComponentId}
                    onChange={(e) => setTargetComponentId(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Component --</option>
                    {unassignedComponents.map((comp) => (
                      <option key={comp.componentId} value={comp.componentId}>
                        {comp.code} - {comp.componentName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={isAssigning || !targetComponentId}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Mapping
                </button>
              </form>
              
              {unassignedComponents.length === 0 && allComponents.length > 0 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  All components in the database are already mapped to this supplier.
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      <SuccessNotification isVisible={showSuccess} message={message}/>

      <ConfirmNotification
        isOpen={confirmDelete.isOpen}
        title="Remove Component Mapping"
        message={`Are you sure you want to remove ${confirmDelete.componentName} from this supplier?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        isProcessing={isProcessingDelete}
        onConfirm={handleRemove}
        onClose={() => setConfirmDelete({ isOpen: false, componentId: null, componentName: "" })}
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

import { 
  X, Shield, ShieldAlert, Loader2, ChevronDown, ChevronUp, Search, HelpCircle
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { roleService, type Role, type Permission } from "../../../services/roleServices";
import { PERMISSIONS_META } from "../../../lib/permissionsMeta";
import { WarningNotification } from "../../Notification/WarningNotification";

interface ManageRolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onSuccess: (message?: string) => void;
}

const MODULE_LABELS: Record<string, string> = {
  EMP: "Employee Management",
  ROLE: "Roles & Access Security",
  PO: "Purchasing & Procurement",
  SO: "Sales & Fulfillment",
  PR: "Production Planning (MRP)",
  WO: "Shop Floor Work Orders",
  LINE: "Production Line Layouts",
  QC: "Quality Control Inspections",
  WH: "Warehouse & Stock Control",
  MR: "Shop Floor Material Requests",
  TR: "Warehouse Stock Transfers",
  ATTACH: "Document File Attachments",
  NOTIF: "Alerts & Notifications",
  DASH: "Executive Analytics Dashboard",
  PRODUCT: "Master Product Data",
  COMP: "Master Component Data",
  SUPPLIER: "Supplier Directory",
  AGENT: "Sales Agent Directory",
};

export const ManageRolePermissionsModal = ({
  isOpen,
  onClose,
  role,
  onSuccess,
}: ManageRolePermissionsModalProps): JSX.Element | null => {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedCodes, setAssignedCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPerms, setExpandedPerms] = useState<Record<string, boolean>>({});
  
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const isSysAdmin = role?.roleName === "System Admin" || (role as any)?.roleCode === "SYS_ADMIN";

  // Load permissions when modal opens and role changes
  useEffect(() => {
    if (isOpen && role) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // 1. Fetch full permission catalog
          const catalog = await roleService.getAllPermissions();
          setAllPermissions(catalog || []);
          
          // 2. Fetch assigned permissions for this role
          const rolePerms = await roleService.getRolePermissions(role.roleId);
          setAssignedCodes((rolePerms || []).map(p => p.permCode));
        } catch (error: any) {
          console.error("Failed to load permissions:", error);
          setWarningMessage(error.response?.data?.message || "Failed to load permissions catalog.");
          setShowWarning(true);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
      setSearchQuery("");
      setExpandedPerms({});
    }
  }, [isOpen, role]);

  const togglePermission = (permCode: string) => {
    if (isSysAdmin || isSaving) return;
    setAssignedCodes(prev => 
      prev.includes(permCode) 
        ? prev.filter(code => code !== permCode) 
        : [...prev, permCode]
    );
  };

  const toggleExpand = (permCode: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent checking/unchecking the permission row
    setExpandedPerms(prev => ({
      ...prev,
      [permCode]: !prev[permCode]
    }));
  };

  const handleSelectAllInModule = (_module: string, permCodes: string[]) => {
    if (isSysAdmin || isSaving) return;
    setAssignedCodes(prev => {
      const filtered = prev.filter(code => !permCodes.includes(code));
      return [...filtered, ...permCodes];
    });
  };

  const handleDeselectAllInModule = (_module: string, permCodes: string[]) => {
    if (isSysAdmin || isSaving) return;
    setAssignedCodes(prev => prev.filter(code => !permCodes.includes(code)));
  };

  const handleSave = async () => {
    if (!role || isSysAdmin || isSaving) return;
    setIsSaving(true);
    try {
      await roleService.setRolePermissions(role.roleId, assignedCodes);
      onSuccess("Role permissions updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Failed to save permissions:", error);
      setWarningMessage(error.response?.data?.message || "Failed to save permissions.");
      setShowWarning(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return allPermissions;
    const q = searchQuery.toLowerCase().trim();
    return allPermissions.filter(p => {
      const meta = PERMISSIONS_META[p.permCode];
      return (
        p.permCode.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        (meta && (
          meta.title.toLowerCase().includes(q) ||
          meta.description.toLowerCase().includes(q)
        ))
      );
    });
  }, [allPermissions, searchQuery]);

  // Group filtered permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of filteredPermissions) {
      if (!groups[p.module]) {
        groups[p.module] = [];
      }
      groups[p.module].push(p);
    }
    return groups;
  }, [filteredPermissions]);

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[900px] max-w-[calc(100vw-2rem)] h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-gray-900">Configure Permissions</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {role.roleName}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Select and map role capabilities to system operations</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Admin Safety Banner */}
        {isSysAdmin && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">System Safety Guard Active</p>
              <p className="text-xs text-amber-700 mt-0.5">
                The <strong>System Admin</strong> role automatically possesses all permissions across the entire platform. 
                For security reasons, its permission layout is permanently locked and cannot be modified.
              </p>
            </div>
          </div>
        )}

        {/* Toolbar (Search & Statistics) */}
        {!isSysAdmin && !isLoading && (
          <div className="px-6 py-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search permission code, name, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-shrink-0 text-center sm:text-right">
              Assigned: <span className="text-indigo-600 font-mono font-extrabold">{assignedCodes.length}</span> / {allPermissions.length} Permissions
            </div>
          </div>
        )}

        {/* Modal Body / Scrollable Permissions Panel */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 space-y-8">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
          ) : allPermissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 text-gray-500 bg-white border border-gray-200 rounded-xl">
              <HelpCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-bold text-sm">No permissions found in the database.</p>
              <p className="text-xs text-gray-400 mt-1">Please ensure the backend seeds have been applied correctly.</p>
            </div>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 text-gray-500 bg-white border border-gray-200 rounded-xl">
              <Search className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-bold text-sm">No matching permissions found.</p>
              <p className="text-xs text-gray-400 mt-1">Try broadening your search term.</p>
            </div>
          ) : (
            Object.entries(groupedPermissions).map(([moduleCode, perms]) => {
              const moduleLabel = MODULE_LABELS[moduleCode] || `Module: ${moduleCode}`;
              const modulePermCodes = perms.map(p => p.permCode);
              const checkedInModule = perms.filter(p => assignedCodes.includes(p.permCode));

              return (
                <div key={moduleCode} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  
                  {/* Module Header */}
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                        {moduleLabel}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-gray-200 text-gray-700">
                        {checkedInModule.length}/{perms.length}
                      </span>
                    </div>

                    {!isSysAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectAllInModule(moduleCode, modulePermCodes)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-transparent rounded cursor-pointer transition-colors"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300 text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => handleDeselectAllInModule(moduleCode, modulePermCodes)}
                          className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 border border-transparent rounded cursor-pointer transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Module Permissions Checklist */}
                  <div className="divide-y divide-gray-100">
                    {perms.map((perm) => {
                      const isChecked = assignedCodes.includes(perm.permCode);
                      const meta = PERMISSIONS_META[perm.permCode];
                      const title = meta?.title || perm.permCode;
                      const description = meta?.description || perm.description;
                      const endpoints = meta?.endpoints || [];
                      const isExpanded = !!expandedPerms[perm.permCode];

                      return (
                        <div 
                          key={perm.permCode}
                          onClick={() => togglePermission(perm.permCode)}
                          className={`p-5 transition-colors flex flex-col gap-3 ${
                            isSysAdmin 
                              ? "cursor-default opacity-85" 
                              : "cursor-pointer hover:bg-gray-50/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                              {/* Custom Styled Checkbox */}
                              <div className="flex items-center h-5 mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={isSysAdmin || isChecked}
                                  onChange={() => {}} // Controlled by row onClick
                                  disabled={isSysAdmin || isSaving}
                                  className={`w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer ${
                                    isSysAdmin ? "opacity-50 cursor-default" : ""
                                  }`}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{title}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
                              </div>
                            </div>

                            {/* Collapse Toggle for technical info */}
                            <button
                              type="button"
                              onClick={(e) => toggleExpand(perm.permCode, e)}
                              className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-indigo-600 bg-transparent py-1 px-2 border border-transparent hover:border-gray-200 rounded cursor-pointer transition-all"
                              title="Show Technical Details"
                            >
                              <span>Details</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Collapsible Advanced Info panel */}
                          {isExpanded && (
                            <div className="ml-7 p-3.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                              <div>
                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                                  Permission Code
                                </span>
                                <code className="text-xs text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded font-mono font-semibold">
                                  {perm.permCode}
                                </code>
                              </div>

                              {endpoints.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                                    Affected API Routes
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {endpoints.map((route) => {
                                      const isPost = route.startsWith("POST");
                                      const isPut = route.startsWith("PUT");
                                      const isDelete = route.startsWith("DELETE");
                                      
                                      let methodColor = "bg-blue-50 text-blue-700 border-blue-100";
                                      if (isPost) methodColor = "bg-green-50 text-green-700 border-green-100";
                                      if (isPut) methodColor = "bg-amber-50 text-amber-700 border-amber-100";
                                      if (isDelete) methodColor = "bg-red-50 text-red-700 border-red-100";

                                      return (
                                        <span 
                                          key={route} 
                                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${methodColor}`}
                                        >
                                          {route}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer text-sm"
          >
            Cancel
          </button>
          
          {!isSysAdmin && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer shadow-sm text-sm"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          )}
        </div>

      </div>

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

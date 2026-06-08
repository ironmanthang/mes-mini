import {
  X, Shield, ShieldAlert, Loader2, Search, HelpCircle,
  CheckSquare, Square, ChevronRight,
  TrendingUpIcon, UsersIcon, WrenchIcon, WarehouseIcon, FactoryIcon,
  PackageIcon, TruckIcon, ShoppingCartIcon, ClipboardListIcon, CheckCircle2Icon,
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

const MODULE_META: Record<string, { label: string; icon: React.ElementType }> = {
  DASH:     { label: "Dashboard",         icon: TrendingUpIcon      },
  EMP:      { label: "Human Resources",   icon: UsersIcon           },
  ROLE:     { label: "Roles & Security",  icon: Shield              },
  COMP:     { label: "Components",        icon: WrenchIcon          },
  SUPPLIER: { label: "Suppliers",         icon: TruckIcon           },
  WH:       { label: "Warehouse",         icon: WarehouseIcon       },
  MR:       { label: "Material Requests", icon: ClipboardListIcon   },
  PO:       { label: "Purchase Orders",   icon: ShoppingCartIcon    },
  PR:       { label: "Production Requests (MRP)",  icon: FactoryIcon         },
  WO:       { label: "Work Orders",       icon: FactoryIcon         },
  QC:       { label: "Quality Control",   icon: CheckCircle2Icon    },
  PRODUCT:  { label: "Products & BOM",    icon: PackageIcon         },
};

const getFallbackMeta = (code: string) => ({
  label: `Module: ${code}`,
  icon: Shield,
});

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
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const isSysAdmin =
    role?.roleName === "System Admin" || (role as any)?.roleCode === "SYS_ADMIN";

  const visiblePermissions = useMemo(() => {
    return allPermissions.filter((p) => !!PERMISSIONS_META[p.permCode]);
  }, [allPermissions]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of visiblePermissions) {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    }
    return groups;
  }, [visiblePermissions]);

  const moduleOrder = useMemo(() => Object.keys(groupedPermissions), [groupedPermissions]);

  const activeModulePerms = useMemo(() => {
    if (!selectedModule) return [];
    const perms = groupedPermissions[selectedModule] || [];
    if (!searchQuery.trim()) return perms;
    const q = searchQuery.toLowerCase().trim();
    return perms.filter((p) => {
      const meta = PERMISSIONS_META[p.permCode];
      return (
        p.permCode.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (meta &&
          (meta.title.toLowerCase().includes(q) ||
            meta.description.toLowerCase().includes(q)))
      );
    });
  }, [selectedModule, groupedPermissions, searchQuery]);

  useEffect(() => {
    if (isOpen && role) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const catalog = await roleService.getAllPermissions();
          setAllPermissions(catalog || []);
          const rolePerms = await roleService.getRolePermissions(role.roleId);
          setAssignedCodes((rolePerms || []).map((p) => p.permCode));
        } catch (error: any) {
          setWarningMessage(
            error.response?.data?.message || "Failed to load permissions catalog."
          );
          setShowWarning(true);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
      setSearchQuery("");
      setSelectedModule(null);
    }
  }, [isOpen, role]);

  useEffect(() => {
    if (!isLoading && moduleOrder.length > 0 && !selectedModule) {
      setSelectedModule(moduleOrder[0]);
    }
  }, [isLoading, moduleOrder, selectedModule]);

  const togglePermission = (permCode: string) => {
    if (isSysAdmin || isSaving) return;
    setAssignedCodes((prev) =>
      prev.includes(permCode) ? prev.filter((c) => c !== permCode) : [...prev, permCode]
    );
  };

  const handleSelectAll = (moduleCode: string) => {
    if (isSysAdmin || isSaving) return;
    const codes = (groupedPermissions[moduleCode] || []).map((p) => p.permCode);
    setAssignedCodes((prev) => [...prev.filter((c) => !codes.includes(c)), ...codes]);
  };

  const handleClearAll = (moduleCode: string) => {
    if (isSysAdmin || isSaving) return;
    const codes = (groupedPermissions[moduleCode] || []).map((p) => p.permCode);
    setAssignedCodes((prev) => prev.filter((c) => !codes.includes(c)));
  };

  const handleSave = async () => {
    if (!role || isSysAdmin || isSaving) return;
    setIsSaving(true);
    try {
      await roleService.setRolePermissions(role.roleId, assignedCodes);
      onSuccess("Role permissions updated successfully!");
      onClose();
    } catch (error: any) {
      setWarningMessage(error.response?.data?.message || "Failed to save permissions.");
      setShowWarning(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !role) return null;

  const totalVisible = visiblePermissions.length;
  const totalAssigned = assignedCodes.filter((c) => !!PERMISSIONS_META[c]).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md transition-all duration-300 animate-fade-in">
      <div className="bg-white w-[960px] max-w-[calc(100vw-2rem)] h-[86vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 transform transition-all duration-300 scale-100">

        {/* ── Header ── */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white relative border-b border-slate-100">
          {/* Top subtle red-blue-emerald gradient line */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Configure Permissions</h3>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full shadow-sm">
                  {role.roleName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Select capabilities to grant access to system operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 
              border border-blue-200/60 rounded-full text-xs font-mono 
              font-semibold hidden sm:block shadow-sm">
                {totalAssigned} / {totalVisible} assigned
              </span>
            )}
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── System Admin Banner ── */}
        {isSysAdmin && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50/50 border-b border-red-100 px-6 py-3.5 flex items-start gap-3 flex-shrink-0 animate-fade-in">
            <div className="p-1 bg-red-100 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-800">System Safety Guard Active</p>
              <p className="text-xs text-red-600/90 font-medium mt-0.5 leading-relaxed">
                The <strong>System Admin</strong> role has all permissions and cannot be modified.
              </p>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden bg-slate-50/50">

          {/* ── Left: Module Tabs ── */}
          <aside className="w-[220px] flex-shrink-0 border-r border-slate-200/60 flex flex-col overflow-y-auto bg-slate-50/70 backdrop-blur-sm">
            <div className="px-4 py-3 border-b border-slate-200/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Modules
              </p>
            </div>
            <nav className="flex-1 py-2 px-2 space-y-1">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : (
                moduleOrder.map((moduleCode) => {
                  const meta = MODULE_META[moduleCode] || getFallbackMeta(moduleCode);
                  const Icon = meta.icon;
                  const perms = groupedPermissions[moduleCode] || [];
                  const assignedCount = perms.filter((p) =>
                    assignedCodes.includes(p.permCode)
                  ).length;
                  const isActive = selectedModule === moduleCode;

                  let badgeStyles = "bg-slate-100 text-slate-400 border border-slate-200/40";
                  if (assignedCount > 0) {
                    badgeStyles = "bg-blue-50 text-blue-600 border border-blue-100 font-semibold";
                  }

                  return (
                    <button
                      key={moduleCode}
                      type="button"
                      onClick={() => {
                        setSelectedModule(moduleCode);
                        setSearchQuery("");
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-xl transition-all duration-200 border cursor-pointer ${
                        isActive
                          ? "bg-white border-slate-200 shadow-sm text-blue-700 font-semibold border-l-4 border-l-blue-600"
                          : "border-transparent text-slate-600 hover:bg-white hover:text-slate-800"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="flex-1 text-xs font-medium truncate">
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 
                          rounded-full ${badgeStyles}`}>
                          {assignedCount}/{perms.length}
                        </span>
                        {isActive && <ChevronRight className="w-3 h-3 text-blue-500" />}
                      </div>
                    </button>
                  );
                })
              )}
            </nav>
          </aside>

          {/* ── Right: Permission List ── */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : !selectedModule ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <HelpCircle className="w-10 h-10 text-slate-200 mb-2 animate-pulse" />
                <p className="text-sm font-medium">Select a module from the left</p>
              </div>
            ) : (
              <>
                {/* Panel Header */}
                {(() => {
                  const meta = MODULE_META[selectedModule] || getFallbackMeta(selectedModule);
                  const Icon = meta.icon;
                  const perms = groupedPermissions[selectedModule] || [];
                  const assignedCount = perms.filter((p) =>
                    assignedCodes.includes(p.permCode)
                  ).length;

                  return (
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-shrink-0 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <Icon className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{meta.label}</span>
                        <span className="text-xs text-slate-400 font-mono font-medium">
                          ({assignedCount}/{perms.length} selected)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search permissions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-[170px] transition-all duration-200"
                          />
                        </div>
                        {!isSysAdmin && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectAll(selectedModule)}
                              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 active:bg-blue-100 
                              border border-blue-200/60 rounded-xl cursor-pointer transition-all duration-200 shadow-sm shadow-blue-500/5"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearAll(selectedModule)}
                              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100/80 active:bg-red-100 border border-red-200/60 rounded-xl cursor-pointer transition-all duration-200 shadow-sm shadow-red-500/5"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Permissions */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {activeModulePerms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <div className="p-3 bg-slate-50 rounded-full mb-3">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No matching permissions found</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting your search query</p>
                    </div>
                  ) : (
                    activeModulePerms.map((perm) => {
                      const isChecked = isSysAdmin || assignedCodes.includes(perm.permCode);
                      const meta = PERMISSIONS_META[perm.permCode];
                      const title = meta?.title || perm.permCode;
                      const description = meta?.description || perm.description;

                      return (
                        <div
                          key={perm.permCode}
                          onClick={() => togglePermission(perm.permCode)}
                          className={`flex items-start gap-4 px-6 py-4 transition-all duration-200 border-l-4 ${
                            isSysAdmin
                              ? "cursor-default opacity-85"
                              : "cursor-pointer"
                          } ${
                            isChecked
                              ? "bg-blue-50/20 border-l-blue-500 hover:bg-blue-50/30"
                              : "bg-white border-l-transparent hover:bg-slate-50/60"
                          }`}
                        >
                          {/* Checkbox icon */}
                          <div className="mt-0.5 flex-shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-blue-600 transition-all 
                              duration-200 transform scale-105" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 hover:text-slate-400 
                              hover:scale-105 transition-all duration-200" />
                            )}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-bold leading-none 
                                ${isChecked ? "text-slate-800" : "text-slate-600"}`}>
                                {title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600 font-medium mt-1.5 leading-relaxed">
                              {description}
                            </p>
                            <div className="mt-2.5">
                              <code className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-semibold ${
                                isChecked
                                  ? "bg-blue-50 text-blue-700 border-blue-100/50"
                                  : "bg-slate-50 text-slate-500 border-slate-100"
                              }`}>
                                {perm.permCode}
                              </code>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4.5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4.5 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-sm shadow-slate-100"
          >
            Cancel
          </button>
          {!isSysAdmin && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

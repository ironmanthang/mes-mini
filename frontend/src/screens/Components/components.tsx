import { Cpu, ShoppingCart, PackagePlus, ClipboardCheck, QrCode } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { hasAnyRole } from "../../lib/auth";

export const Components = () => {
  const allTabs = [
    { 
      id: "info", 
      label: "Component Information", 
      icon: Cpu,
      to: "/components/info",
      description: "Manage items, stock & specs",
      allowedRoles: ["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"]
    },
    { 
      id: "create-order", 
      label: "Create Component Orders", 
      icon: PackagePlus,
      to: "/components/create-order",
      description: "Import materials & components",
      allowedRoles: ["SYS_ADMIN", "PROD_MGR"]
    },
    { 
      id: "orders",
      label: "Component Orders", 
      icon: ShoppingCart,
      to: "/components/orders",
      description: "Purchase Orders & Tracking",
      allowedRoles: ["SYS_ADMIN", "WH_STAFF"]
    },
    { 
      id: "receipts", 
      label: "Component Receipts", 
      icon: ClipboardCheck,
      to: "/components/receipts",
      description: "Verify and store incoming goods",
      allowedRoles: ["SYS_ADMIN", "WH_STAFF"]
    },
    { 
      id: "barcodes", 
      label: "Component Barcodes", 
      icon: QrCode,
      to: "/components/barcodes",
      description: "Print component tray barcodes",
      allowedRoles: ["SYS_ADMIN", "LINE_LEADER"]
    },
  ];

  // Lọc tab: chỉ hiển thị những tab người dùng có quyền truy cập
  const visibleTabs = allTabs.filter(tab => !tab.allowedRoles || hasAnyRole(tab.allowedRoles));

  return (
    <div className="p-8 pb-24 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">COMPONENTS MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Centralized database for all raw materials, sub-assemblies, and standard parts.
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-1.5 p-1 bg-gray-50 border border-gray-200 rounded-xl mb-8 w-full overflow-x-auto no-scrollbar">
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.to}
            title={tab.description}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200/50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Outlet />
      </div>
    </div>
  );
};
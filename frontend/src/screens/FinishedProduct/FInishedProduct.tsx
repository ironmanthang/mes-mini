import { type JSX } from "react";
import { 
  Info, 
  ClipboardCheck, 
  ClipboardList,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { hasAnyPermission } from "../../lib/auth";

export const FinishedProduct = (): JSX.Element => {
  const allTabs = [
    { 
      id: "information", 
      label: "Information", 
      icon: Info, 
      to: "/finished-products/info",
      description: "Batch details & serial numbers",
      allowedPermissions: ["PRODUCT_READ", "PRODUCT_CREATE", "PRODUCT_UPDATE"],
    },
    { 
      id: "quality", 
      label: "Quality Checks", 
      icon: ClipboardCheck, 
      to: "/finished-products/quality",
      description: "QA/QC inspections & logs",
      allowedPermissions: ["QC_READ"]
    },
    { 
      id: "checklists", 
      label: "QC Checklists", 
      icon: ClipboardList, 
      to: "/finished-products/checklists",
      description: "Manage QC templates & parameters",
      allowedPermissions: ["QC_CREATE", "QC_READ"],
    },
  ];

  // Lọc tab: chỉ hiển thị những tab người dùng có quyền truy cập
  const visibleTabs = allTabs.filter(tab => !tab.allowedPermissions || hasAnyPermission(tab.allowedPermissions));

  return (
    <div className="p-8 pb-24 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">FINISHED PRODUCTS MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Manage production output, track serial numbers, and ensure product quality.
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
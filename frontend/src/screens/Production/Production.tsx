import { ClipboardList, Settings, Factory, PackageSearch } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { hasAnyPermission } from "../../lib/auth";

export const Production = () => {
  const allTabs = [
    { 
      id: "production-requests",
      label: "Production Requests", 
      icon: Factory,
      to: "/production/requests",
      description: "Create new manufacturing requests",
      allowedPermissions: ["PR_READ"]
    },
    { 
      id: "work-orders",
      label: "Work Orders", 
      icon: ClipboardList,
      to: "/production/work-orders",
      description: "Schedule and track manufacturing orders",
      allowedPermisions: ["WO_READ"]
    },
    {
      id: "material-requests",
      label: "Material Requests",
      icon: PackageSearch,
      to: "/production/material-requests",
      description: "Request components for work orders",
      allowedPermissions: ["MR_READ"]
    },
    { 
      id: "configure-lots",
      label: "Configure Lots", 
      icon: Settings,
      to: "/production/configure-lots",
      description: "Setup batches & instances",
      allowedPermissions: ["LINE_READ"]
    },
  ];

  // Lọc tab: chỉ hiển thị những tab người dùng có quyền truy cập
  const visibleTabs = allTabs.filter(tab => !tab.allowedPermissions || hasAnyPermission(tab.allowedPermissions));

  return (
    <div className="p-8 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PRODUCTION MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Manage supply chain, manufacturing processes, and quality assurance.
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
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent"
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
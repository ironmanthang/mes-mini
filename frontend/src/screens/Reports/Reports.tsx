import { BarChart3, Box, TrendingUp } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { hasAnyPermission } from "../../lib/auth";

export const Reports = () => {
  const allTabs = [
    {
      id: "performance",
      label: "Line Performance",
      icon: BarChart3,
      to: "/reports/performance",
      description: "Analyze production line efficiency, yield, and output",
      allowedPermissions: ["ABC"]
    },
    {
      id: "inventory",
      label: "Inventory Summary",
      icon: Box,
      to: "/reports/inventory",
      description: "View real-time stock levels for components and finished products across warehouses",
      allowedPermissions: ["ABC"]
    },
    {
      id: "costs",
      label: "Cost & Financials",
      icon: TrendingUp,
      to: "/reports/costs",
      description: "Track procurement spend, manufacturing costs, and labor/overhead distribution",
      allowedPermissions: ["ABC"]
    },
  ];

  // Lọc tab: chỉ hiển thị những tab người dùng có quyền truy cập
  const visibleTabs = allTabs.filter(tab => !tab.allowedPermissions || hasAnyPermission(tab.allowedPermissions));

  return (
    <div className="p-8 pb-24 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ANALYSICS & REPORTS</h1>
        <p className="text-sm text-gray-500">
          Advanced production telemetry and workforce efficiency tracking.
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-1.5 p-1 bg-gray-50 border border-gray-200 rounded-xl mb-8 w-full overflow-x-auto no-scrollbar">
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.to}
            title={tab.description}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer flex-shrink-0 ${isActive
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

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
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

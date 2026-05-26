import { Warehouse as WarehouseIcon, PackageCheck, QrCode } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

export const Warehouse = () => {
  const tabs = [
    { 
      id: "info", 
      label: "Warehouse Information", 
      icon: WarehouseIcon,
      to: "/warehouse/info",
      description: "Manage locations, capacity & status"
    },
    { 
      id: "induction",
      label: "Product Induction",
      icon: QrCode,
      to: "/warehouse/induction",
      description: "Scan & receive finished goods from production"
    },
    { 
      id: "material-issuing",
      label: "Material Issuing",
      icon: PackageCheck,
      to: "/warehouse/material-issuing",
      description: "Approve & issue materials to production"
    }
  ];

  return (
    <div className="p-8 pb-24 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WAREHOUSE MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Centralized control for storage locations, inventory auditing, and goods movement.
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-1.5 p-1 bg-gray-50 border border-gray-200 rounded-xl mb-8 w-full overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
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
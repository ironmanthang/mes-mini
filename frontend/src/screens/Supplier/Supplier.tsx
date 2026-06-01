import { Truck, Cpu } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import type { JSX } from "react";

export const Supplier = (): JSX.Element => {
  const tabs = [
    { 
      id: "info", 
      label: "Supplier Directory", 
      icon: Truck,
      to: "/supplier/info",
      description: "Manage suppliers, address & contact information"
    },
    { 
      id: "components", 
      label: "Supplier-Component Mapping", 
      icon: Cpu,
      to: "/supplier/components",
      description: "Manage components supplied by each supplier"
    },
  ];

  return (
    <div className="p-8 pb-24 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SUPPLIERS MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Centralized database for supplier information and supplier-component associations.
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

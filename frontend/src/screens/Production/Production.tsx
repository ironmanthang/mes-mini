import { ClipboardList, Settings, Factory, PackageSearch, DollarSign } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

export const Production = () => {
  const tabs = [
    { 
      id: "production-requests",
      label: "Production Requests", 
      icon: Factory,
      to: "/production/requests",
      description: "Create new manufacturing requests"
    },
    { 
      id: "work-orders",
      label: "Work Orders", 
      icon: ClipboardList,
      to: "/production/work-orders",
      description: "Schedule and track manufacturing orders"
    },
    { 
      id: "material-requests",
      label: "Material Requests",
      icon: PackageSearch,
      to: "/production/material-requests",
      description: "Request components for work orders"
    },
    { 
      id: "configure-lots",
      label: "Configure Lots", 
      icon: Settings,
      to: "/production/configure-lots",
      description: "Setup batches & instances"
    },
    { 
      id: "product-costs",
      label: "Product Costs", 
      icon: DollarSign,
      to: "/production/product-costs",
      description: "Analyze manufacturing costs and absorption"
    },
  ];

  return (
    <div className="p-8 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PRODUCTION MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Manage supply chain, manufacturing processes, and quality assurance.
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-1.5 p-1 bg-gray-50 border border-gray-200 rounded-xl mb-8 w-full overflow-x-auto scrollbar-hide no-scrollbar">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.to}
            title={tab.description}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer flex-shrink-0 ${
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
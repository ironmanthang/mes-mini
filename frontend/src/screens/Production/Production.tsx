import { useState } from "react";
import { PackagePlus, ClipboardList, Settings, Factory } from "lucide-react";

import { CreateComponentOrder } from "./components/CreateComponentOrder";
import { CreateProductionRequest } from "./components/CreateProductionRequest";
import { CreateWorkOrder } from "./components/CreateWorkOrder";
import { ConfigureProductionLots } from "./components/ConfigureProductionLots";

type ProductionTab = "create-order" | "production-requests" | "work-orders" | "configure-lots";

export const Production = () => {
  const [activeTab, setActiveTab] = useState<ProductionTab>("create-order");

  const tabs = [
    { 
      id: "create-order", 
      label: "Create Component Orders", 
      icon: PackagePlus,
      description: "Import materials & components"
    },
    { 
      id: "production-requests",
      label: "Production Requests", 
      icon: Factory,
      description: "Create new manufacturing requests"
    },
    { 
      id: "work-orders",
      label: "Work Orders", 
      icon: ClipboardList,
      description: "Assign requests to production lines"
    },
    { 
      id: "configure-lots",
      label: "Configure Production Lots", 
      icon: Settings,
      description: "Setup batches & instances"
    },
  ];

  return (
    <div className="p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PRODUCTION MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Manage supply chain, manufacturing processes, and quality assurance.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8 max-w-7xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProductionTab)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer hover:shadow-md ${
                isActive 
                  ? "bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500" 
                  : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className={`p-2 rounded-lg mb-3 ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <h3 className={`font-bold text-sm mb-1 ${isActive ? "text-blue-900" : "text-gray-900"}`}>
                {tab.label}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1">
                {tab.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "create-order" && <CreateComponentOrder />}
        
        {activeTab === "production-requests" && <CreateProductionRequest/>}

        {activeTab === "work-orders" && <CreateWorkOrder/>}

        {activeTab === "configure-lots" && <ConfigureProductionLots/>}
      </div>
    </div>
  );
};
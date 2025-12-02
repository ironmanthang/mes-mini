import { useState } from "react";
import { Warehouse as WarehouseIcon, ClipboardCheck, ArrowRightLeft, Truck } from "lucide-react";

import { WarehouseInformation } from "./components/WarehouseInfomation";
import { Stocktaking } from "./components/Stocktaking";
import { ImportExport } from "./components/ImportExport";
import { TransferStock } from "./components/TransferStock";

type WarehouseTab = "info" | "stocktaking" | "import-export" | "transfer-stock";

export const Warehouse = () => {
  const [activeTab, setActiveTab] = useState<WarehouseTab>("info");

  const tabs = [
    { 
      id: "info", 
      label: "Warehouse Information", 
      icon: WarehouseIcon,
      description: "Manage locations, capacity & status"
    },
    { 
      id: "stocktaking", 
      label: "Stocktaking", 
      icon: ClipboardCheck,
      description: "Inventory audit & discrepancies"
    },
    { 
      id: "import-export", 
      label: "Import / Export", 
      icon: ArrowRightLeft,
      description: "Track incoming & outgoing goods"
    },
    { 
      id: "transfer-stock",
      label: "Transfer Stock", 
      icon: Truck,
      description: "Internal warehouse transfer"
    },
  ];

  return (
    <div className="p-8 pb-24 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WAREHOUSE MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Centralized control for storage locations, inventory auditing, and goods movement.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8 max-w-7xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as WarehouseTab)}
              className={`flex flex-col items-start p-5 rounded-xl border transition-all duration-200 text-left cursor-pointer hover:shadow-md ${
                isActive 
                  ? "bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500" 
                  : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className={`p-2.5 rounded-lg mb-3 ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                <tab.icon className="w-6 h-6" />
              </div>
              <h3 className={`font-bold text-base mb-1 ${isActive ? "text-blue-900" : "text-gray-900"}`}>
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
        {activeTab === "info" && <WarehouseInformation />}
        {activeTab === "stocktaking" && <Stocktaking />}
        {activeTab === "import-export" && <ImportExport />}
        {activeTab === "transfer-stock" && <TransferStock />}
      </div>
    </div>
  );
};
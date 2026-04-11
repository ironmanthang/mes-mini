import { useState } from "react";
import { Cpu, ShoppingCart, ScanBarcode , PackagePlus, ClipboardCheck } from "lucide-react";

import { ComponentInformation } from "./Components/ComponentInformation";
import { ComponentOrders } from "./Components/ComponentOrders";
import { ComponentBarcodes } from "./Components/ComponentBarcodes";
import { CreateComponentOrder } from "./Components/CreateComponentOrder";
import { ComponentReceipts } from "./Components/ComponentReceipts";

type ComponentTab = "info" | "orders" | "barcodes" | "create-order" | "receipts";

export const Components = () => {
  const [activeTab, setActiveTab] = useState<ComponentTab>("info");

  const tabs = [
    { 
      id: "info", 
      label: "Component Information", 
      icon: Cpu,
      description: "Manage items, stock & specs"
    },
    { 
      id: "create-order", 
      label: "Create Component Orders", 
      icon: PackagePlus,
      description: "Import materials & components"
    },
    { 
      id: "orders",
      label: "Component Orders", 
      icon: ShoppingCart,
      description: "Purchase Orders & Tracking"
    },
    { 
      id: "receipts", 
      label: "Component Receipts", 
      icon: ClipboardCheck,
      description: "Verify and store incoming goods" 
    },
    { 
      id: "barcodes",
      label: "Component Barcodes", 
      icon: ScanBarcode,
      description: "Generate & Print Labels"
    },
  ];

  return (
    <div className="p-8 pb-24 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">COMPONENTS MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Centralized database for all raw materials, sub-assemblies, and standard parts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl mb-8 w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ComponentTab)}
              title={tab.description}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200/50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "info" && <ComponentInformation />}

        {activeTab === "create-order" && <CreateComponentOrder/>}

        {activeTab === "orders" && <ComponentOrders/>}

        {activeTab === "receipts" && <ComponentReceipts/>}

        {activeTab === "barcodes" && <ComponentBarcodes/>}
      </div>
    </div>
  );
};
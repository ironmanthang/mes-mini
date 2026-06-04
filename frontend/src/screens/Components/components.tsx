import { useState } from "react";
import { Cpu, ShoppingCart, ScanBarcode, Receipt } from "lucide-react";

import { ComponentInformation } from "./Components/ComponentInformation";
import { ComponentOrders } from "./Components/ComponentOrders";
import { ComponentBarcodes } from "./Components/ComponentBarcodes";
import { ComponentReceipts } from "./Components/ComponentReceipts";

type ComponentTab = "info" | "orders" | "barcodes" | "receipts";

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
      id: "orders",
      label: "Create Component Orders", 
      icon: ShoppingCart,
      description: "Purchase Orders & Tracking"
    },
    { 
      id: "barcodes",
      label: "Component Barcodes", 
      icon: ScanBarcode,
      description: "Generate & Print Labels"
    },
    { 
      id: "receipts",
      label: "Component Receipts", 
      icon: Receipt,
      description: "View & Manage Receipts"
    }
  ];

  return (
    <div className="p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">COMPONENTS MANAGEMENT</h1>
        <p className="text-sm text-gray-500">
          Centralized database for all raw materials, sub-assemblies, and standard parts.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8 max-w-7xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ComponentTab)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all 
                duration-200 text-left cursor-pointer hover:shadow-md ${
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
              <p className="text-xs text-gray-500">
                {tab.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {activeTab === "info" && <ComponentInformation />}

        {activeTab === "orders" && <ComponentOrders/>}

        {activeTab === "barcodes" && <ComponentBarcodes/>}

        {activeTab === "receipts" && <ComponentReceipts/>}
      </div>
    </div>
  );
};
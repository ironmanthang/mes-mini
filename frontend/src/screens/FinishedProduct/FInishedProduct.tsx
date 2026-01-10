import { useState, type JSX } from "react";
import { 
  Info, 
  ScanBarcode, 
  ClipboardCheck, 
  ShoppingCart,
} from "lucide-react";
import { Information } from "./components/Infomation";
import { Barcodes } from "./components/Barcodes";
import { QualityChecks } from "./components/QualityChecks";
import { Orders } from "./components/Orders";



type FinishedProductTab = "information" | "barcodes" | "quality" | "orders";

export const FinishedProduct = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<FinishedProductTab>("information");

  const tabs = [
    { 
      id: "information", 
      label: "Information", 
      icon: Info, 
      description: "Batch details & serial numbers" 
    },
    { 
      id: "barcodes", 
      label: "Barcodes", 
      icon: ScanBarcode, 
      description: "Print & manage item labels" 
    },
    { 
      id: "quality", 
      label: "Quality Checks", 
      icon: ClipboardCheck, 
      description: "QA/QC inspections & logs" 
    },
    { 
      id: "orders", 
      label: "Orders", 
      icon: ShoppingCart, 
      description: "Manage sales & shipping" 
    },
  ];

  return (
    <div className="p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            FINISHED PRODUCTS
        </h1>
        <p className="text-sm text-gray-500">
          Manage production output, track serial numbers, and ensure product quality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 max-w-7xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinishedProductTab)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all 
                duration-200 text-left cursor-pointer hover:shadow-md ${
                isActive 
                  ? "bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500" 
                  : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className={`p-2 rounded-lg mb-3 ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                <Icon className="w-5 h-5" />
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
        {activeTab === "information" && <Information />}
        {activeTab === "barcodes" && <Barcodes />}
        {activeTab === "quality" && <QualityChecks />}
        {activeTab === "orders" && <Orders />}
      </div>
    </div>
  );
};
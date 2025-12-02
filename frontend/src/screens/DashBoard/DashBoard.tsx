import type { JSX } from "react";
import { ArrowUpRightIcon } from "lucide-react";

const workstationItems = [
  { title: "Reports", bgColor: "bg-gray-100" },
  { title: "Production", bgColor: "bg-gray-100" },
  { title: "Components", bgColor: "bg-gray-100" },
];

const shortcuts = [
  { name: "BOM", icon: ArrowUpRightIcon },
  { name: "Production Plan", icon: ArrowUpRightIcon },
  { name: "Work Order", icon: ArrowUpRightIcon },
  { name: "Forecasting", icon: ArrowUpRightIcon },
  { name: "BOM Stock Report", icon: ArrowUpRightIcon },
  { name: "Production Planning Report", icon: ArrowUpRightIcon },
];

export const Dashboard = (): JSX.Element => {
  return (
        <div className="flex-1 p-8 overflow-auto">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Workstation
            </h2>

            <div className="grid grid-cols-3 gap-6">
              {workstationItems.map((item, index) => (
                <div
                  key={index}
                  className={`${item.bgColor} rounded-lg p-8 flex items-center justify-center min-h-[120px] hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <h3 className="text-lg font-medium text-gray-700">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Shortcuts
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {shortcuts.map((shortcut, index) => (
                <button
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <span className="text-sm text-gray-700">{shortcut.name}</span>
                  <shortcut.icon className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </section>
        </div>
  );
};

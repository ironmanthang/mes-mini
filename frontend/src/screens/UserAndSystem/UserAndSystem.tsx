import { useState, type JSX } from "react";

import { UserManagement } from "./components/UserManagement";
import { AccountSettings } from "./components/AccountSettings";

export const UserAndSystem = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<"management" | "settings">("management");

  return (
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                USER AND SYSTEM
              </h1>
              <p className="text-sm text-gray-500">
                Centralized Control Hub for User Management and System Security
              </p>
            </div>

            <div className="mb-6 flex items-center gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("management")}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === "management"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                User Management
              </button>
              
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === "settings"
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                Account Settings
              </button>
            </div>

            <div className="animate-in fade-in zoom-in duration-300">
              {activeTab === "management" ? (
                <UserManagement />
              ) : (
                <AccountSettings />
              )}
            </div>
          </div>
        </div>
  );
};
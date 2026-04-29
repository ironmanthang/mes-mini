import { type JSX } from "react";
import { NavLink, Outlet } from "react-router-dom";

export const UserAndSystem = (): JSX.Element => {
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
          <NavLink
            to="/user-system/management"
            className={({ isActive }) =>
              `px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`
            }
          >
            User Management
          </NavLink>
          
          <NavLink
            to="/user-system/settings"
            className={({ isActive }) =>
              `px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900"
              }`
            }
          >
            Account Settings
          </NavLink>
        </div>

        <div className="animate-in fade-in zoom-in duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
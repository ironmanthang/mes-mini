import { type JSX } from "react";
import { NavLink, Outlet } from "react-router-dom";

export const HumanResources = (): JSX.Element => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          HUMAN RESOURCES
        </h1>
        <p className="text-sm text-gray-500">
          Manage staff information, roles, and access permissions across the system
        </p>
      </div>

      <div className="mb-6 flex items-center gap-2 border-b border-gray-200">
        <NavLink
          to="/human-resources/employees"
          className={({ isActive }) =>
            `px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              isActive
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`
          }
        >
          Human Resources Management
        </NavLink>
        
        <NavLink
          to="/human-resources/roles"
          className={({ isActive }) =>
            `px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              isActive
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`
          }
        >
          Roles
        </NavLink>
      </div>

      <div className="animate-in fade-in zoom-in duration-300">
        <Outlet />
      </div>
    </div>
  );
};
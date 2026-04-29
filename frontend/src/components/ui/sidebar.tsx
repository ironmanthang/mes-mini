import {
  LayoutDashboardIcon,
  UserIcon,
  TrendingUpIcon,
  UsersIcon,
  FolderIcon,
  WrenchIcon,
  WarehouseIcon,
  FactoryIcon,
  PackageIcon,
  MenuIcon,
} from "lucide-react";
import type { JSX } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboardIcon, label: "Dashboard",        to: "/dashboard" },
  { icon: UserIcon,            label: "User & System",    to: "/user-system" },
  { icon: TrendingUpIcon,      label: "Reports",          to: "/reports" },
  { icon: UsersIcon,           label: "Human Resources",  to: "/human-resources" },
  { icon: FolderIcon,          label: "Categories",       to: "/categories" },
  { icon: WrenchIcon,          label: "Components",       to: "/components" },
  { icon: WarehouseIcon,       label: "Warehouse",        to: "/warehouse" },
  { icon: FactoryIcon,         label: "Production",       to: "/production" },
  { icon: PackageIcon,         label: "Finished Products",to: "/finished-products" },
];

export const Sidebar = (): JSX.Element => {
  return (
    <aside className="w-[200px] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">P</span>
        </div>
        <span className="font-bold text-sm">ProdOpsX</span>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <MenuIcon className="w-4 h-4" />
          <span className="font-medium">Menu</span>
        </div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors cursor-pointer ${
                isActive
                  ? "text-blue-600 bg-blue-50 border-l-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50 border-l-2 border-transparent"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
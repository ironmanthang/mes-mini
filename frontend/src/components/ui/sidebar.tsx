import {
  LayoutDashboardIcon,
  TrendingUpIcon,
  UsersIcon,
  WrenchIcon,
  WarehouseIcon,
  FactoryIcon,
  PackageIcon,
  MenuIcon,
  TruckIcon,
} from "lucide-react";
import type { JSX } from "react";
import { NavLink } from "react-router-dom";
import { hasAnyRole } from "../../lib/auth";

const menuItems = [
  { icon: LayoutDashboardIcon, label: "Dashboard", to: "/dashboard" },
  {
    icon: TrendingUpIcon,
    label: "Reports",
    to: "/reports",
    allowedRoles: ["SYS_ADMIN", "PROD_MGR", "LINE_LEADER"]
  },
  {
    icon: UsersIcon,
    label: "Human Resources",
    to: "/human-resources",
    allowedRoles: ["SYS_ADMIN"]
  },
  {
    icon: WrenchIcon,
    label: "Components",
    to: "/components",
    allowedRoles: ["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"]
  },
  {
    icon: TruckIcon,
    label: "Suppliers",
    to: "/supplier",
    allowedRoles: ["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF"]
  },
  {
    icon: WarehouseIcon,
    label: "Warehouse",
    to: "/warehouse",
    allowedRoles: ["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"]
  },
  {
    icon: FactoryIcon,
    label: "Production",
    to: "/production",
    allowedRoles: ["SYS_ADMIN", "PROD_MGR", "LINE_LEADER", "PROD_WORKER"]
  },
  { icon: PackageIcon, label: "Finished Products", to: "/finished-products" },
];

export const Sidebar = (): JSX.Element => {
  // Lọc danh sách menu: chỉ hiển thị các mục mà người dùng có quyền truy cập
  const visibleMenuItems = menuItems.filter(
    item => !item.allowedRoles || hasAnyRole(item.allowedRoles)
  );

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
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors cursor-pointer ${isActive
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

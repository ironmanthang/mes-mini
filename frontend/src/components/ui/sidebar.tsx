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

interface SidebarProps {
  activePage: string;
  onNavigate: (pageName: string) => void; 
}

const menuItems = [
  { icon: LayoutDashboardIcon, label: "Dashboard" },
  { icon: UserIcon, label: "User & System" },
  { icon: TrendingUpIcon, label: "Reports" },
  { icon: UsersIcon, label: "Human Resources" },
  { icon: FolderIcon, label: "Categories" },
  { icon: WrenchIcon, label: "Components" },
  { icon: WarehouseIcon, label: "Warehouse" },
  { icon: FactoryIcon, label: "Production" },
  { icon: PackageIcon, label: "Finished Products" },
];

export const Sidebar = ({ activePage, onNavigate }: SidebarProps): JSX.Element => {
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
        {menuItems.map((item, index) => {
          const isActive = item.label === activePage;
          return (
            <button
              key={index}
              onClick={() => onNavigate(item.label)} 
              className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors cursor-pointer ${
                isActive
                  ? "text-blue-600 bg-blue-50 border-l-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
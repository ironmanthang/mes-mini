import { BellIcon } from "lucide-react";
import type { JSX } from "react";

export const Header = (): JSX.Element => {
  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-end px-6 gap-4 bg-white">
      <button className="relative cursor-pointer">
        <BellIcon className="w-5 h-5 text-gray-600" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
          2
        </span>
      </button>

      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 text-xs font-medium">L</span>
        </div>
        <span className="text-sm text-gray-700">Lam Phan Phuc</span>
      </div>
    </header>
  );
};
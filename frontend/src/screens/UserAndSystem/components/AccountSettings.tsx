import { FilePenLine } from "lucide-react";
import type { JSX } from "react";

export const AccountSettings = (): JSX.Element => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
      <div className="flex gap-8">
        <div className="pt-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <FilePenLine className="w-6 h-6 text-gray-800" />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-2 col-span-1">
            <label className="text-xs font-bold text-gray-900">ID</label>
            <div className="w-full bg-gray-50 rounded p-3 text-sm text-gray-800 font-medium">
              EMP0010
            </div>
          </div>
          
          <div className="hidden md:block"></div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900">Full Name</label>
            <div className="w-full bg-gray-50 rounded p-3 text-sm text-gray-800">
              Tran Van A
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900">Phone number</label>
            <div className="w-full bg-gray-50 rounded p-3 text-sm text-gray-800">
              0123456789
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900">Username</label>
            <div className="w-full bg-gray-50 rounded p-3 text-sm text-gray-800">
              tranvana@prodopsx.com
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900">Date</label>
            <div className="w-full bg-gray-50 rounded p-3 text-sm text-gray-800">
              01/01/2000
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900">Role</label>
            <div className="w-full bg-gray-50 rounded p-3 text-sm text-gray-800">
              Component Manager
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900">Address</label>
            <div className="w-full bg-gray-50 rounded p-3 text-sm text-gray-800">
              Thu Duc, TP. Ho Chi Minh
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
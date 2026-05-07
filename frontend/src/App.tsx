import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/ui/sidebar";
import { Header } from "./components/ui/header";

import { Dashboard } from "./screens/DashBoard";
import { UserAndSystem } from "./screens/UserAndSystem";
import { HumanResources } from "./screens/HumanResources";
import { Production } from "./screens/Production";
import { Warehouse } from "./screens/Warehouses";
import { Components } from "./screens/Components";
import { FinishedProduct } from "./screens/FinishedProduct";

import { ComponentInformation } from "./screens/Components/Components/ComponentInformation";
import { CreateComponentOrder } from "./screens/Components/Components/CreateComponentOrder";
import { ComponentOrders } from "./screens/Components/Components/ComponentOrders";
import { ComponentReceipts } from "./screens/Components/Components/ComponentReceipts";
import { ComponentBarcodes } from "./screens/Components/Components/ComponentBarcodes";

import { CreateProductionRequest } from "./screens/Production/components/CreateProductionRequest";
import { CreateWorkOrder } from "./screens/Production/components/CreateWorkOrder";
import { MaterialRequests } from "./screens/Production/components/MaterialRequests";
import { ConfigureProductionLots } from "./screens/Production/components/ConfigureProductionLots";
import { ProductCosts } from "./screens/Production/components/ProductCosts";

import { WarehouseInformation } from "./screens/Warehouses/components/WarehouseInformation";
import { MaterialIssuing } from "./screens/Warehouses/components/MaterialIssuing";
import { Stocktaking } from "./screens/Warehouses/components/Stocktaking";
import { ImportExport } from "./screens/Warehouses/components/ImportExport";
import { TransferStock } from "./screens/Warehouses/components/TransferStock";
import { ProductInduction } from "./screens/Warehouses/components/ProductInduction";

import { Employees } from "./screens/HumanResources/components/Employees";
import { Roles } from "./screens/HumanResources/components/Roles";

import { UserManagement } from "./screens/UserAndSystem/components/UserManagement";
import { AccountSettings } from "./screens/UserAndSystem/components/AccountSettings";

import { Information as FinishedProductInformation } from "./screens/FinishedProduct/components/Infomation";
import { Barcodes as FinishedProductBarcodes } from "./screens/FinishedProduct/components/Barcodes";
import { QualityChecks as FinishedProductQuality } from "./screens/FinishedProduct/components/QualityChecks";
import { Orders as FinishedProductOrders } from "./screens/FinishedProduct/components/Orders";
import { ProductionExecution as FinishedProductExecution } from "./screens/Production/components/ProductionExecution";
import { InboundRequests as FinishedProductInbound } from "./screens/FinishedProduct/components/InboundRequests";
import { ProductionMonitor as FinishedProductMonitor } from "./screens/Production/components/ProductionMonitor";
import { InventoryReport } from "./screens/Warehouses/components/InventoryReport";
import { Reports } from "./screens/Reports";
import { Performance } from "./screens/Reports/components/Performance";
import { ProductLookup } from "./screens/PublicPortal/ProductLookup";

export default function App() {
  return (
    <Routes>
      {/* ── Public Portal (no sidebar) ── */}
      <Route path="/product-lookup" element={<ProductLookup />} />
      <Route path="/product-lookup/:serialNumber" element={<ProductLookup />} />

      {/* ── Authenticated shell ── */}
      <Route path="/*" element={
      <div className="bg-white w-full min-h-screen flex [font-family:'Zen_Kaku_Gothic_Antique',Helvetica]">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <div className="flex-1 overflow-auto bg-white">
          <Routes>
            {/* Default redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />

            {/* User & System */}
            <Route path="/user-system" element={<UserAndSystem />}>
              <Route index element={<Navigate to="management" replace />} />
              <Route path="management" element={<UserManagement />} />
              <Route path="settings" element={<AccountSettings />} />
            </Route>

            {/* Human Resources */}
            <Route path="/human-resources" element={<HumanResources />}>
              <Route index element={<Navigate to="employees" replace />} />
              <Route path="employees" element={<Employees />} />
              <Route path="roles" element={<Roles />} />
            </Route>

            {/* Components */}
            <Route path="/components" element={<Components />}>
              <Route index element={<Navigate to="info" replace />} />
              <Route path="info" element={<ComponentInformation />} />
              <Route path="create-order" element={<CreateComponentOrder />} />
              <Route path="orders" element={<ComponentOrders />} />
              <Route path="receipts" element={<ComponentReceipts />} />
              <Route path="barcodes" element={<ComponentBarcodes />} />
            </Route>

            {/* Warehouse */}
            <Route path="/warehouse" element={<Warehouse />}>
              <Route index element={<Navigate to="info" replace />} />
              <Route path="info" element={<WarehouseInformation />} />
              <Route path="induction" element={<ProductInduction />} />
              <Route path="material-issuing" element={<MaterialIssuing />} />
              <Route path="stocktaking" element={<Stocktaking />} />
              <Route path="import-export" element={<ImportExport />} />
              <Route path="transfer-stock" element={<TransferStock />} />
              <Route path="inventory-report" element={<InventoryReport />} />
            </Route>

            {/* Production */}
            <Route path="/production" element={<Production />}>
              <Route index element={<Navigate to="requests" replace />} />
              <Route path="requests" element={<CreateProductionRequest />} />
              <Route path="monitor" element={<FinishedProductMonitor />} />
              <Route path="product-costs" element={<ProductCosts />} />
              <Route path="work-orders" element={<CreateWorkOrder />} />
              <Route path="material-requests" element={<MaterialRequests />} />
              <Route path="configure-lots" element={<ConfigureProductionLots />} />
              <Route path="execution" element={<FinishedProductExecution />} />
            </Route>

            {/* Finished Products */}
            <Route path="/finished-products" element={<FinishedProduct />}>
              <Route index element={<Navigate to="info" replace />} />
              <Route path="info" element={<FinishedProductInformation />} />
              <Route path="barcodes" element={<FinishedProductBarcodes />} />
              <Route path="quality" element={<FinishedProductQuality />} />
              <Route path="inbound" element={<FinishedProductInbound />} />
              <Route path="orders" element={<FinishedProductOrders />} />
            </Route>

            {/* Reports */}
            <Route path="/reports" element={<Reports />}>
              <Route index element={<Navigate to="performance" replace />} />
              <Route path="performance" element={<Performance />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
    } />
    </Routes>
  );
}
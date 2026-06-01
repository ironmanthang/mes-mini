import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/ui/sidebar";
import { Header } from "./components/ui/header";

import { Dashboard } from "./screens/DashBoard";
import { HumanResources } from "./screens/HumanResources";
import { Production } from "./screens/Production";
import { Warehouse } from "./screens/Warehouses";
import { Components } from "./screens/Components";
import { FinishedProduct } from "./screens/FinishedProduct";
import { Supplier } from "./screens/Supplier";

import { ComponentInformation } from "./screens/Components/Components/ComponentInformation";
import { CreateComponentOrder } from "./screens/Components/Components/CreateComponentOrder";
import { ComponentOrders } from "./screens/Components/Components/ComponentOrders";
import { ComponentReceipts } from "./screens/Components/Components/ComponentReceipts";
import { ComponentBarcodes } from "./screens/Components/Components/ComponentBarcodes";

import { SupplierInformation } from "./screens/Supplier/components/SupplierInformation";
import { SupplierComponents } from "./screens/Supplier/components/SupplierComponents";

import { CreateProductionRequest } from "./screens/Production/components/ProductionRequest";
import { WorkOrders } from "./screens/Production/components/WorkOrders";
import { MaterialRequests } from "./screens/Production/components/MaterialRequests";
import { ConfigureProductionLots } from "./screens/Production/components/ConfigureProductionLots";

import { WarehouseInformation } from "./screens/Warehouses/components/WarehouseInformation";
import { MaterialIssuing } from "./screens/Warehouses/components/MaterialIssuing";
import { ProductInduction } from "./screens/Warehouses/components/ProductInduction";

import { Employees } from "./screens/HumanResources/components/Employees";
import { Roles } from "./screens/HumanResources/components/Roles";

import { AccountSettings } from "./screens/UserAndSystem/components/AccountSettings";

import { Information as FinishedProductInformation } from "./screens/FinishedProduct/components/Infomation";
import { QualityChecks as FinishedProductQuality } from "./screens/FinishedProduct/components/QualityChecks";
import { Orders as FinishedProductOrders } from "./screens/FinishedProduct/components/Orders";
import { QualityChecklists as FinishedProductChecklists } from "./screens/FinishedProduct/components/QualityChecklists";

import { InventoryReport } from "./screens/Warehouses/components/InventoryReport";
import { Reports } from "./screens/Reports";
import { Performance } from "./screens/Reports/components/Performance";
import { CostReport } from "./screens/Reports/components/CostReport";
import { ProductLookup } from "./screens/PublicPortal/ProductLookup";

import { ProtectedRouteWithRole } from "./components/ProtectedRouteWithRole";
import { hasAnyRole } from "./lib/auth";

interface TabConfig {
  to: string;
  allowedRoles?: string[];
}

const getFirstAllowedTab = (tabs: TabConfig[], defaultTab: string): string => {
  const allowed = tabs.find(tab => !tab.allowedRoles || hasAnyRole(tab.allowedRoles));
  return allowed ? allowed.to : defaultTab;
};

const HumanResourcesIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "employees", allowedRoles: ["SYS_ADMIN"] },
    { to: "roles", allowedRoles: ["SYS_ADMIN"] }
  ], "employees");
  return <Navigate to={allowed} replace />;
};

const ComponentsIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "info", allowedRoles: ["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"] },
    { to: "create-order", allowedRoles: ["SYS_ADMIN", "PROD_MGR"] },
    { to: "orders", allowedRoles: ["SYS_ADMIN", "WH_STAFF"] },
    { to: "receipts", allowedRoles: ["SYS_ADMIN", "WH_STAFF"] },
    { to: "barcodes", allowedRoles: ["SYS_ADMIN"] }
  ], "info");
  return <Navigate to={allowed} replace />;
};

const WarehouseIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "info", allowedRoles: ["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"] },
    { to: "induction", allowedRoles: ["SYS_ADMIN", "WH_STAFF", "PROD_MGR"] },
    { to: "material-issuing", allowedRoles: ["SYS_ADMIN", "WH_STAFF"] }
  ], "info");
  return <Navigate to={allowed} replace />;
};

const ProductionIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "requests", allowedRoles: ["SYS_ADMIN", "PROD_MGR", "LINE_LEADER"] },
    { to: "work-orders", allowedRoles: ["SYS_ADMIN", "PROD_MGR", "LINE_LEADER", "PROD_WORKER"] },
    { to: "material-requests", allowedRoles: ["SYS_ADMIN", "LINE_LEADER"] },
    { to: "configure-lots", allowedRoles: ["SYS_ADMIN", "PROD_MGR"] }
  ], "work-orders");
  return <Navigate to={allowed} replace />;
};

const FinishedProductIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "info" },
    { to: "quality", allowedRoles: ["SYS_ADMIN", "WH_STAFF"] },
    { to: "checklists" },
    { to: "orders", allowedRoles: ["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"] }
  ], "info");
  return <Navigate to={allowed} replace />;
};

const ReportsIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "performance", allowedRoles: ["SYS_ADMIN", "PROD_MGR", "LINE_LEADER"] },
    { to: "inventory", allowedRoles: ["SYS_ADMIN", "PROD_MGR"] },
    { to: "costs", allowedRoles: ["SYS_ADMIN", "PROD_MGR", "LINE_LEADER"] }
  ], "performance");
  return <Navigate to={allowed} replace />;
};

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
                <Route path="/settings" element={
                  <div className="p-8">
                    <AccountSettings />
                  </div>
                } />

                {/* Human Resources */}
                <Route path="/human-resources" element={
                  <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN"]}>
                    <HumanResources />
                  </ProtectedRouteWithRole>
                }>
                  <Route index element={<HumanResourcesIndexRedirect />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="roles" element={<Roles />} />
                </Route>

                {/* Components */}
                <Route path="/components" element={<Components />}>
                  <Route index element={<ComponentsIndexRedirect />} />
                  <Route path="info" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"]}>
                      <ComponentInformation />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="create-order" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR"]}>
                      <CreateComponentOrder />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="orders" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "WH_STAFF"]}>
                      <ComponentOrders />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="receipts" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "WH_STAFF"]}>
                      <ComponentReceipts />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="barcodes" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN"]}>
                      <ComponentBarcodes />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Suppliers */}
                <Route path="/supplier" element={
                  <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF"]}>
                    <Supplier />
                  </ProtectedRouteWithRole>
                }>
                  <Route index element={<Navigate to="info" replace />} />
                  <Route path="info" element={<SupplierInformation />} />
                  <Route path="components" element={<SupplierComponents />} />
                </Route>

                {/* Warehouse */}
                <Route path="/warehouse" element={<Warehouse />}>
                  <Route index element={<WarehouseIndexRedirect />} />
                  <Route path="info" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"]}>
                      <WarehouseInformation />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="induction" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "WH_STAFF", "PROD_MGR"]}>
                      <ProductInduction />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="material-issuing" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "WH_STAFF"]}>
                      <MaterialIssuing />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Production */}
                <Route path="/production" element={<Production />}>
                  <Route index element={<ProductionIndexRedirect />} />
                  <Route path="requests" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR", "LINE_LEADER"]}>
                      <CreateProductionRequest />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="work-orders" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR", "LINE_LEADER", "PROD_WORKER"]}>
                      <WorkOrders />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="material-requests" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "LINE_LEADER"]}>
                      <MaterialRequests />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="configure-lots" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR"]}>
                      <ConfigureProductionLots />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Finished Products */}
                <Route path="/finished-products" element={<FinishedProduct />}>
                  <Route index element={<FinishedProductIndexRedirect />} />
                  <Route path="info" element={<FinishedProductInformation />} />
                  <Route path="quality" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "WH_STAFF"]}>
                      <FinishedProductQuality />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="checklists" element={<FinishedProductChecklists />} />
                  <Route path="orders" element={
                    <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR", "WH_STAFF", "PURCH_STAFF", "QC_INSPECTOR", "SALES_STAFF"]}>
                      <FinishedProductOrders />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Reports */}
                <Route path="/reports" element={
                  <ProtectedRouteWithRole allowedRoles={["SYS_ADMIN", "PROD_MGR", "LINE_LEADER"]}>
                    <Reports />
                  </ProtectedRouteWithRole>
                }>
                  <Route index element={<ReportsIndexRedirect />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="inventory" element={<InventoryReport />} />
                  <Route path="costs" element={<CostReport />} />
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

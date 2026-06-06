import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/ui/sidebar";
import { Header } from "./components/ui/header";

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
import { QualityChecklists as FinishedProductChecklists } from "./screens/FinishedProduct/components/QualityChecklists";

import { InventoryReport } from "./screens/Warehouses/components/InventoryReport";
import { Reports } from "./screens/Reports";
import { Performance } from "./screens/Reports/components/Performance";
import { CostReport } from "./screens/Reports/components/CostReport";
import { ProductLookup } from "./screens/PublicPortal/ProductLookup";

import { ProtectedRouteWithRole } from "./components/ProtectedRouteWithRole";
import { hasPermission } from "./lib/auth";

interface TabConfig {
  to: string;
  allowedPermissions?: string[];
}

const getFirstAllowedTab = (tabs: TabConfig[], defaultTab: string): string => {
  const allowed = tabs.find(tab => !tab.allowedPermissions || tab.allowedPermissions.some(p => hasPermission(p)));
  return allowed ? allowed.to : defaultTab;
};

const HumanResourcesIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "employees", allowedPermissions: ["EMP_READ"] },
    { to: "roles", allowedPermissions: ["ROLE_MANAGE"] }
  ], "employees");
  return <Navigate to={allowed} replace />;
};

const ComponentsIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "info", allowedPermissions: ["COMP_READ"] },
    { to: "create-order", allowedPermissions: ["PO_CREATE"] },
    { to: "orders", allowedPermissions: ["PO_READ"] },
    { to: "receipts", allowedPermissions: ["PO_RECEIVE"] },
    { to: "barcodes", allowedPermissions: ["COMP_READ"] }
  ], "info");
  return <Navigate to={allowed} replace />;
};

const WarehouseIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "info", allowedPermissions: ["WH_STOCK_READ", "WH_MANAGE"] },
    { to: "induction", allowedPermissions: ["WH_INDUCT"] },
    { to: "material-issuing", allowedPermissions: ["MR_APPROVE"] }
  ], "info");
  return <Navigate to={allowed} replace />;
};

const ProductionIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "requests", allowedPermissions: ["PR_READ"] },
    { to: "work-orders", allowedPermissions: ["WO_READ"] },
    { to: "material-requests", allowedPermissions: ["MR_READ"] },
    { to: "configure-lots", allowedPermissions: ["LINE_READ"] }
  ], "work-orders");
  return <Navigate to={allowed} replace />;
};

const FinishedProductIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "info" },
    { to: "quality", allowedPermissions: ["QC_READ", "QC_CREATE"] },
    { to: "checklists" },
    { to: "orders", allowedPermissions: ["SO_READ"] }
  ], "info");
  return <Navigate to={allowed} replace />;
};

const ReportsIndexRedirect = () => {
  const allowed = getFirstAllowedTab([
    { to: "performance", allowedPermissions: ["WO_READ"] },
    { to: "inventory", allowedPermissions: ["WH_STOCK_READ"] },
    { to: "costs", allowedPermissions: ["WO_READ"] }
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
                <Route index element={<Navigate to="/reports" replace />} />

                <Route path="/settings" element={
                  <div className="p-8">
                    <AccountSettings />
                  </div>
                } />

                {/* Human Resources */}
                <Route path="/human-resources" element={
                  <ProtectedRouteWithRole allowedPermissions={["EMP_READ", "ROLE_MANAGE"]}>
                    <HumanResources />
                  </ProtectedRouteWithRole>
                }>
                  <Route index element={<HumanResourcesIndexRedirect />} />
                  <Route path="employees" element={
                    <ProtectedRouteWithRole allowedPermissions={["EMP_READ"]}>
                      <Employees />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="roles" element={
                    <ProtectedRouteWithRole allowedPermissions={["ROLE_MANAGE"]}>
                      <Roles />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Components */}
                <Route path="/components" element={<Components />}>
                  <Route index element={<ComponentsIndexRedirect />} />
                  <Route path="info" element={
                    <ProtectedRouteWithRole allowedPermissions={["COMP_READ"]}>
                      <ComponentInformation />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="create-order" element={
                    <ProtectedRouteWithRole allowedPermissions={["PO_CREATE"]}>
                      <CreateComponentOrder />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="orders" element={
                    <ProtectedRouteWithRole allowedPermissions={["PO_READ"]}>
                      <ComponentOrders />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="receipts" element={
                    <ProtectedRouteWithRole allowedPermissions={["PO_RECEIVE"]}>
                      <ComponentReceipts />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="barcodes" element={
                    <ProtectedRouteWithRole allowedPermissions={["COMP_READ"]}>
                      <ComponentBarcodes />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Suppliers */}
                <Route path="/supplier" element={
                  <ProtectedRouteWithRole allowedPermissions={["SUPPLIER_READ"]}>
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
                    <ProtectedRouteWithRole allowedPermissions={["WH_STOCK_READ", "WH_MANAGE"]}>
                      <WarehouseInformation />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="induction" element={
                    <ProtectedRouteWithRole allowedPermissions={["WH_INDUCT"]}>
                      <ProductInduction />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="material-issuing" element={
                    <ProtectedRouteWithRole allowedPermissions={["MR_APPROVE"]}>
                      <MaterialIssuing />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Production */}
                <Route path="/production" element={<Production />}>
                  <Route index element={<ProductionIndexRedirect />} />
                  <Route path="requests" element={
                    <ProtectedRouteWithRole allowedPermissions={["PR_READ"]}>
                      <CreateProductionRequest />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="work-orders" element={
                    <ProtectedRouteWithRole allowedPermissions={["WO_READ"]}>
                      <WorkOrders />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="material-requests" element={
                    <ProtectedRouteWithRole allowedPermissions={["MR_READ"]}>
                      <MaterialRequests />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="configure-lots" element={
                    <ProtectedRouteWithRole allowedPermissions={["LINE_READ"]}>
                      <ConfigureProductionLots />
                    </ProtectedRouteWithRole>
                  } />
                </Route>

                {/* Finished Products */}
                <Route path="/finished-products" element={<FinishedProduct />}>
                  <Route index element={<FinishedProductIndexRedirect />} />
                  <Route path="info" element={<FinishedProductInformation />} />
                  <Route path="quality" element={
                    <ProtectedRouteWithRole allowedPermissions={["QC_READ", "QC_CREATE"]}>
                      <FinishedProductQuality />
                    </ProtectedRouteWithRole>
                  } />
                  <Route path="checklists" element={<FinishedProductChecklists />} />
                </Route>

                {/* Reports */}
                <Route path="/reports" element={
                  <ProtectedRouteWithRole allowedPermissions={["WO_READ", "WH_STOCK_READ"]}>
                    <Reports />
                  </ProtectedRouteWithRole>
                }>
                  <Route index element={<ReportsIndexRedirect />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="inventory" element={<InventoryReport />} />
                  <Route path="costs" element={<CostReport />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/reports" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      } />
    </Routes>
  );
}

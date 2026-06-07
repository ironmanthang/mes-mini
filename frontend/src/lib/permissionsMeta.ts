export interface PermissionMeta {
  title: string;
  description: string;
  endpoints: string[];
}

export const PERMISSIONS_META: Record<string, PermissionMeta> = {
  // --- Employee Management ---
  EMP_READ: {
    title: "View Employees",
    description: "Access the employee directory, view details, and browse profiles.",
    endpoints: ["GET /api/employees", "GET /api/employees/:id"],
  },
  EMP_CREATE: {
    title: "Create Employees",
    description: "Add new employee records to the HR database.",
    endpoints: ["POST /api/employees"],
  },
  EMP_UPDATE: {
    title: "Edit Employees",
    description: "Modify existing employee profiles, contact details, and hiring info.",
    endpoints: ["PUT /api/employees/:id"],
  },
  EMP_STATUS: {
    title: "Manage Employee Status",
    description: "Activate/deactivate employee accounts and force terminate active sessions.",
    endpoints: ["PATCH /api/employees/:id/status", "PATCH /api/employees/:id/force-logout"],
  },

  // --- Role Management ---
  ROLE_MANAGE: {
    title: "Manage System Roles & Permissions",
    description: "Full permissions configuration, including role creation, editing, deletion, and assignment overrides.",
    endpoints: [
      "GET /api/roles",
      "POST /api/roles",
      "PUT /api/roles/:id",
      "DELETE /api/roles/:id",
      "GET /api/roles/permissions",
      "GET /api/roles/:id/permissions",
      "PUT /api/roles/:id/permissions"
    ],
  },

  // --- Purchase Orders ---
  PO_READ: {
    title: "View Purchase Orders",
    description: "Browse component procurement requests, history, and status updates.",
    endpoints: [
      "GET /api/purchase-orders",
      "GET /api/purchase-orders/:id",
      "GET /api/purchase-orders/:id/receive",
      "GET /api/purchase-orders/:id/attachments"
    ],
  },
  PO_CREATE: {
    title: "Create Draft POs",
    description: "Initialize and edit draft purchase orders for raw materials.",
    endpoints: ["POST /api/purchase-orders", "PUT /api/purchase-orders/:id", "POST /api/purchase-orders/:id/items"],
  },
  PO_SUBMIT: {
    title: "Submit POs for Approval",
    description: "Push draft purchase orders to the approval queue.",
    endpoints: ["PUT /api/purchase-orders/:id/submit"],
  },
  PO_APPROVE: {
    title: "Approve Purchase Orders",
    description: "Review, approve, or reject pending purchase orders.",
    endpoints: ["PUT /api/purchase-orders/:id/approve", "PUT /api/purchase-orders/:id/reject"],
  },
  PO_SEND: {
    title: "Send POs to Supplier",
    description: "Mark approved purchase orders as sent to the supplier.",
    endpoints: ["PUT /api/purchase-orders/:id/send"],
  },
  PO_RECEIVE: {
    title: "Receive Procurement Goods",
    description: "Log goods receipts against purchase orders, generating component lots.",
    endpoints: ["POST /api/purchase-orders/:id/receive"],
  },
  PO_CANCEL: {
    title: "Cancel Purchase Orders",
    description: "Void and cancel draft, pending, or approved purchase orders.",
    endpoints: ["PUT /api/purchase-orders/:id/cancel"],
  },

  /*
  // --- Sales Orders ---
  SO_READ: {
    title: "View Sales Orders",
    description: "Browse client sales orders, order items, and shipping status.",
    endpoints: ["GET /api/sales-orders", "GET /api/sales-orders/:id", "GET /api/sales-orders/:id/feasibility"],
  },
  SO_CREATE: {
    title: "Create Draft SOs",
    description: "Create new sales orders, modify existing drafts, or delete drafts.",
    endpoints: ["POST /api/sales-orders", "PUT /api/sales-orders/:id", "DELETE /api/sales-orders/:id"],
  },
  SO_SUBMIT: {
    title: "Submit SOs for Approval",
    description: "Send sales order drafts to managers for approval.",
    endpoints: ["PUT /api/sales-orders/:id/submit"],
  },
  SO_APPROVE: {
    title: "Approve Sales Orders",
    description: "Review and approve/reject pending sales orders.",
    endpoints: ["PUT /api/sales-orders/:id/approve", "PUT /api/sales-orders/:id/reject"],
  },
  SO_SHIP: {
    title: "Ship & Fulfill SOs",
    description: "Log shipments and deduct stock by matching serial numbers to client orders.",
    endpoints: [
      "POST /api/sales-orders/:id/ship",
      "GET /api/sales-orders/:id/pick-list",
      "PUT /api/sales-orders/:id/process"
    ],
  },
  SO_CANCEL: {
    title: "Cancel Sales Orders",
    description: "Cancel active or draft sales orders with reason logging.",
    endpoints: ["PUT /api/sales-orders/:id/cancel"],
  },
  */

  // --- Production Requests ---
  PR_READ: {
    title: "View Production Requests",
    description: "Examine product assembly requests and check shortage statuses.",
    endpoints: [
      "GET /api/production-requests",
      "GET /api/production-requests/:id",
      "GET /api/production-requests/:id/requirements"
    ],
  },
  PR_CREATE: {
    title: "Create Production Requests",
    description: "Submit new requests to manufacture product batches.",
    endpoints: ["POST /api/production-requests"],
  },
  PR_UPDATE: {
    title: "Edit Production Requests",
    description: "Modify quantities, notes, or priorities on pending requests.",
    endpoints: [
      "PUT /api/production-requests/:id",
      "PUT /api/production-requests/:id/recheck",
      "PUT /api/production-requests/:id/submit"
    ],
  },
  PR_CANCEL: {
    title: "Cancel Production Requests",
    description: "Decline and cancel unfulfilled production requests.",
    endpoints: ["PUT /api/production-requests/:id/cancel"],
  },
  PR_LINK_PO: {
    title: "Link Procurement to PR",
    description: "Associate a component purchase order with an active production request.",
    endpoints: ["GET /api/production-requests/:id/draft-purchase-order"],
  },
  PR_APPROVE: {
    title: "Approve Production Requests",
    description: "Review and release pending production requests (two-man safety rule).",
    endpoints: ["PUT /api/production-requests/:id/approve"],
  },

  // --- Work Orders ---
  WO_READ: {
    title: "View Work Orders",
    description: "Track shop floor manufacturing jobs, lot configurations, and allocations.",
    endpoints: ["GET /api/work-orders", "GET /api/work-orders/:id"],
  },
  WO_CREATE: {
    title: "Plan Work Orders",
    description: "Create draft manufacturing work orders based on approved requests.",
    endpoints: ["POST /api/work-orders"],
  },
  WO_UPDATE: {
    title: "Edit, Release & Cancel Work Orders",
    description: "Release draft orders, start execution, update details, or cancel Work Orders.",
    endpoints: [
      "PUT /api/work-orders/:id",
      "PUT /api/work-orders/:id/release",
      "PUT /api/work-orders/:id/start",
      "PUT /api/work-orders/:id/cancel"
    ],
  },
  WO_COMPLETE: {
    title: "Complete Work Orders",
    description: "Log completed products, ending the execution flow and creating batches.",
    endpoints: ["PUT /api/work-orders/:id/complete"],
  },

  /*
  // --- Production Lines ---
  LINE_READ: {
    title: "View Production Lines",
    description: "View available manufacturing assembly lines and locations.",
    endpoints: ["GET /api/production-lines", "GET /api/production-lines/:id"],
  },
  LINE_CREATE: {
    title: "Create Production Lines",
    description: "Register new physical assembly lines in the layout registry.",
    endpoints: ["POST /api/production-lines"],
  },
  LINE_UPDATE: {
    title: "Modify Production Lines",
    description: "Rename assembly lines or change location descriptions.",
    endpoints: ["PUT /api/production-lines/:id"],
  },
  LINE_DELETE: {
    title: "Delete Production Lines",
    description: "Permanently delete inactive production lines.",
    endpoints: ["DELETE /api/production-lines/:id"],
  },
  */

  // --- Quality Control ---
  QC_READ: {
    title: "View Quality Inspections",
    description: "Inspect completed tests, failed criteria, and product serial number results.",
    endpoints: ["GET /api/quality-checks", "GET /api/quality-checks/:id"],
  },
  QC_CREATE: {
    title: "Perform Quality Check",
    description: "Submit barcode scans and measurements for finished products (Pass/Fail).",
    endpoints: ["POST /api/quality-checks"],
  },

  // --- Warehouse & Inventory ---
  WH_STOCK_READ: {
    title: "View Stock Levels",
    description: "Track real-time inventory balances, storage locations, and component lots.",
    endpoints: [
      "GET /api/warehouse-ops/inventory/status",
      "GET /api/warehouse-ops/inventory/low-stock-details",
      "GET /api/warehouse-ops/inventory/stock-status",
      "GET /api/warehouses"
    ],
  },
  // WH_STOCK_ADJUST: {
  //   title: "Adjust Stock Balances",
  //   description: "Manually overwrite stock quantities with audit logs (Not implemented on backend).",
  //   endpoints: [],
  // },
  WH_MANAGE: {
    title: "Manage Warehouses",
    description: "Register, modify, or delete warehouse locations (Sales, Component, Error).",
    endpoints: ["POST /api/warehouses", "PUT /api/warehouses/:id", "DELETE /api/warehouses/:id"],
  },
  WH_INDUCT: {
    title: "Induct Finished Products",
    description: "Scan PASSED_QC products into the Sales Warehouse for fulfillment.",
    endpoints: ["POST /api/warehouse/induct"],
  },

  // --- Material Requests ---
  MR_READ: {
    title: "View Material Requests",
    description: "Examine component export bills requested by line leaders.",
    endpoints: ["GET /api/material-requests", "GET /api/material-requests/:id"],
  },
  MR_CREATE: {
    title: "Create Material Requests",
    description: "Request raw components from the warehouse based on Work Order BOM.",
    endpoints: ["POST /api/material-requests"],
  },
  MR_APPROVE: {
    title: "Approve & Issue Materials",
    description: "Complete requests and deduct component lots from stock for production.",
    endpoints: [
      "PUT /api/warehouse-ops/material-requests/:id/validate",
      "PUT /api/warehouse-ops/material-requests/:id/complete"
    ],
  },

  /*
  // --- Transfer Requests ---
  TR_READ: {
    title: "View Stock Transfers",
    description: "Track relocation requests between different warehouse units.",
    endpoints: ["GET /api/transfers", "GET /api/transfers/:id"],
  },
  TR_MANAGE: {
    title: "Execute Stock Transfers",
    description: "Initialize and complete warehouse-to-warehouse stock transfers.",
    endpoints: ["POST /api/transfers", "PUT /api/transfers/:id/complete"],
  },
  */

  /*
  // --- Attachments ---
  ATTACH_UPLOAD: {
    title: "Upload Attachments",
    description: "Add contractual docs, invoices, or inspection sheets to system records.",
    endpoints: [
      "POST /api/purchase-orders/:id/attachments/request-upload",
      "POST /api/purchase-orders/:id/attachments/confirm"
    ],
  },
  ATTACH_DELETE_ANY: {
    title: "Override Attachment Deletion",
    description: "Permanently delete any uploaded attachment (Administrator only).",
    endpoints: ["DELETE /api/purchase-orders/:id/attachments/:attachmentId"],
  },
  */

  /*
  // --- Notifications ---
  NOTIF_READ: {
    title: "Read Notifications",
    description: "Access alerts and check critical supply warnings. (Unchecked at route-level in backend).",
    endpoints: [
      "GET /api/notifications",
      "GET /api/notifications/unread",
      "PUT /api/notifications/:id/read",
      "PUT /api/notifications/read-all"
    ],
  },
  */

  // --- Dashboard ---
  DASH_READ: {
    title: "View Analytics Dashboard",
    description: "Access executive charts, stock statistics, and performance stats.",
    endpoints: [
      "GET /api/warehouse-ops/dashboard",
      "GET /api/sales/dashboard",
      "GET /api/production/dashboard",
      "GET /api/production/reports/line-performance",
      "GET /api/costs/materials",
      "GET /api/costs/products"
    ],
  },

  // --- Master Data: Products ---
  PRODUCT_READ: {
    title: "View Products & BOMs",
    description: "Examine catalog models, units, and Bill of Material details.",
    endpoints: ["GET /api/products", "GET /api/products/:id"],
  },
  PRODUCT_CREATE: {
    title: "Create Products",
    description: "Register new catalog products and specify default checklists.",
    endpoints: ["POST /api/products"],
  },
  PRODUCT_UPDATE: {
    title: "Edit Products & BOM",
    description: "Update product properties, change BOM, checklists, or delete products.",
    endpoints: [
      "PUT /api/products/:id",
      "DELETE /api/products/:id",
      "POST /api/products/:id/bom",
      "PUT /api/products/:id/bom/:componentId",
      "DELETE /api/products/:id/bom/:componentId",
      "POST /api/checklists",
      "PUT /api/checklists/:id",
      "DELETE /api/checklists/:id",
      "POST /api/checklists/:id/points",
      "PUT /api/checklists/points/:pointId",
      "DELETE /api/checklists/points/:pointId"
    ],
  },

  // --- Master Data: Components ---
  COMP_READ: {
    title: "View Components Catalog",
    description: "View registered components, raw material descriptions, and standard costs.",
    endpoints: ["GET /api/components", "GET /api/components/:id"],
  },
  COMP_CREATE: {
    title: "Create Components",
    description: "Register new raw materials or component items in the master catalog.",
    endpoints: ["POST /api/components"],
  },
  COMP_UPDATE: {
    title: "Edit Components",
    description: "Modify component details, units, minimum stock alerts, or delete components.",
    endpoints: ["PUT /api/components/:id", "DELETE /api/components/:id"],
  },

  // --- Master Data: Suppliers ---
  SUPPLIER_READ: {
    title: "View Suppliers Directory",
    description: "Examine supplier profiles and supplier-to-component mappings.",
    endpoints: ["GET /api/suppliers", "GET /api/suppliers/:id"],
  },
  SUPPLIER_CREATE: {
    title: "Register Suppliers",
    description: "Create profile entries for new component vendors.",
    endpoints: ["POST /api/suppliers"],
  },
  SUPPLIER_UPDATE: {
    title: "Edit Supplier Details",
    description: "Update contact details, vendor address, mapping associations, or delete suppliers.",
    endpoints: ["PUT /api/suppliers/:id", "DELETE /api/suppliers/:id"],
  },

  /*
  // --- Master Data: Agents ---
  AGENT_READ: {
    title: "View Agents Directory",
    description: "Browse registered distributors and customer service agents.",
    endpoints: ["GET /api/agents", "GET /api/agents/:id"],
  },
  AGENT_CREATE: {
    title: "Register Agents",
    description: "Add new agents to the customer sales channel registry.",
    endpoints: ["POST /api/agents"],
  },
  AGENT_UPDATE: {
    title: "Edit Agent Details",
    description: "Modify agent contact details, address, or delete agents.",
    endpoints: ["PUT /api/agents/:id", "DELETE /api/agents/:id"],
  },
  */
};

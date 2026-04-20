/**
 * permissions.ts — Single source of truth for all permission codes.
 *
 * WHY a const object instead of raw strings?
 *   A typo like authorize('PO_RAED') compiles silently and fails at runtime.
 *   Using authorize(PERM.PO_READ) makes every typo a compile-time TypeScript error.
 *   This is a zero-cost abstraction — the const is inlined by the compiler.
 *
 * NAMING CONVENTION: MODULE_ACTION (e.g., PO_APPROVE, EMP_READ)
 *   - Alphabetical grouping aids UI dropdowns and audit logs.
 *   - permCodes are IMMUTABLE. Never rename a deployed code — add a new one and deprecate.
 */
export const PERM = {
    // ── Employee Management ───────────────────────────────────────────────────
    EMP_READ:             'EMP_READ',           // View employee list & details
    EMP_CREATE:           'EMP_CREATE',          // Create new employees
    EMP_UPDATE:           'EMP_UPDATE',          // Edit employee details
    EMP_STATUS:           'EMP_STATUS',          // Activate/deactivate employees + force-logout

    // ── Role & Permission Management ──────────────────────────────────────────
    ROLE_MANAGE:          'ROLE_MANAGE',         // Full CRUD on roles & permission assignments

    // ── Purchase Orders ───────────────────────────────────────────────────────
    PO_READ:              'PO_READ',             // View Purchase Orders
    PO_CREATE:            'PO_CREATE',           // Create & edit draft POs
    PO_SUBMIT:            'PO_SUBMIT',           // Submit POs for approval
    PO_APPROVE:           'PO_APPROVE',          // Approve pending POs
    PO_SEND:              'PO_SEND',             // Send approved POs to supplier
    PO_RECEIVE:           'PO_RECEIVE',          // Receive goods against POs
    PO_CANCEL:            'PO_CANCEL',           // Cancel POs

    // ── Sales Orders ──────────────────────────────────────────────────────────
    SO_READ:              'SO_READ',             // View Sales Orders
    SO_CREATE:            'SO_CREATE',           // Create & edit draft SOs
    SO_SUBMIT:            'SO_SUBMIT',           // Submit SOs for approval
    SO_APPROVE:           'SO_APPROVE',          // Approve pending SOs
    SO_SHIP:              'SO_SHIP',             // Ship/fulfill SOs
    SO_CANCEL:            'SO_CANCEL',           // Cancel SOs

    // ── Production Requests ───────────────────────────────────────────────────
    PR_READ:              'PR_READ',             // View Production Requests
    PR_CREATE:            'PR_CREATE',           // Create Production Requests
    PR_UPDATE:            'PR_UPDATE',           // Edit production requests
    PR_CANCEL:            'PR_CANCEL',           // Cancel production requests
    PR_LINK_PO:           'PR_LINK_PO',          // Link PR to a Purchase Order
    PR_APPROVE:           'PR_APPROVE',          // Approve production requests (two-man rule)

    // ── Work Orders ───────────────────────────────────────────────────────────
    WO_READ:              'WO_READ',             // View Work Orders
    WO_CREATE:            'WO_CREATE',           // Create Work Orders
    WO_UPDATE:            'WO_UPDATE',           // Edit & transition Work Orders
    WO_COMPLETE:          'WO_COMPLETE',         // Mark Work Orders as completed

    // ── Production Lines ──────────────────────────────────────────────────────
    LINE_READ:            'LINE_READ',           // View production lines
    LINE_CREATE:          'LINE_CREATE',         // Create production lines
    LINE_UPDATE:          'LINE_UPDATE',         // Edit production lines
    LINE_DELETE:          'LINE_DELETE',         // Delete production lines

    // ── Quality Control ───────────────────────────────────────────────────────
    QC_READ:              'QC_READ',             // View quality checks
    QC_CREATE:            'QC_CREATE',           // Perform quality checks

    // ── Warehouse & Inventory ─────────────────────────────────────────────────
    WH_STOCK_READ:        'WH_STOCK_READ',       // View inventory/stock levels
    WH_STOCK_ADJUST:      'WH_STOCK_ADJUST',     // Adjust inventory balances
    WH_MANAGE:            'WH_MANAGE',           // Full CRUD on warehouse entities

    // ── Material Requests ─────────────────────────────────────────────────────
    MR_READ:              'MR_READ',             // View material export requests
    MR_CREATE:            'MR_CREATE',           // Create material requests
    MR_APPROVE:           'MR_APPROVE',          // Approve/process material requests

    // ── Stocktake ─────────────────────────────────────────────────────────────
    ST_READ:              'ST_READ',             // View stocktakes
    ST_CREATE:            'ST_CREATE',           // Create stocktakes
    ST_COMPLETE:          'ST_COMPLETE',         // Complete/approve stocktakes

    // ── Attachments ───────────────────────────────────────────────────────────
    ATTACH_UPLOAD:        'ATTACH_UPLOAD',       // Upload attachments
    ATTACH_DELETE_ANY:    'ATTACH_DELETE_ANY',   // Delete any user's attachments (admin override)

    // ── Notifications ─────────────────────────────────────────────────────────
    NOTIF_READ:           'NOTIF_READ',          // Read own notifications

    // ── Dashboard ─────────────────────────────────────────────────────────────
    DASH_READ:            'DASH_READ',           // View dashboard metrics

    // ── Master Data: Products ─────────────────────────────────────────────────
    PRODUCT_READ:         'PRODUCT_READ',        // View product list & details
    PRODUCT_CREATE:       'PRODUCT_CREATE',      // Create products
    PRODUCT_UPDATE:       'PRODUCT_UPDATE',      // Edit products & BOM

    // ── Master Data: Components ───────────────────────────────────────────────
    COMP_READ:            'COMP_READ',           // View component list & details
    COMP_CREATE:          'COMP_CREATE',         // Create components
    COMP_UPDATE:          'COMP_UPDATE',         // Edit components

    // ── Master Data: Suppliers ────────────────────────────────────────────────
    SUPPLIER_READ:        'SUPPLIER_READ',       // View supplier list & details
    SUPPLIER_CREATE:      'SUPPLIER_CREATE',     // Create suppliers
    SUPPLIER_UPDATE:      'SUPPLIER_UPDATE',     // Edit suppliers

    // ── Master Data: Agents ───────────────────────────────────────────────────
    AGENT_READ:           'AGENT_READ',          // View agent list & details
    AGENT_CREATE:         'AGENT_CREATE',        // Create agents
    AGENT_UPDATE:         'AGENT_UPDATE',        // Edit agents
} as const;

/**
 * PermCode — union type of all valid permission code strings.
 * Every authorize() call must accept PermCode[], not raw string[].
 * This guarantees compile-time safety across the entire codebase.
 */
export type PermCode = typeof PERM[keyof typeof PERM];

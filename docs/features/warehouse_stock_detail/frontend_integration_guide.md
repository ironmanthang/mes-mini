# Frontend Integration Guide — Warehouse Stock Detail

> **Audience**: Frontend developer integrating the `GET /api/warehouses/:id/stock` endpoint.
> **Prerequisite**: Backend is running. The `warehouseServices.ts` file already exists at `frontend/src/services/warehouseServices.ts` — **extend it, do not create a new file**.

---

## 1. What the API Does

When the user clicks the **Eye (👁) button** on a warehouse row or directly on the name of thw warehouse in `WarehouseInformation.tsx`, call this endpoint to show what's inside that specific warehouse.

```
GET /api/warehouses/:id/stock
```

The response shape is **polymorphic** — it changes based on `warehouseType`:

| Warehouse Type | Groups by | Nested detail |
|---|---|---|
| `COMPONENT` | Component | Lots with PO traceability |
| `SALES` | Product | Batches with Work Order + FIFO dates |
| `ERROR` | Product | Batches + Production Line (for root-cause) |

---

## 2. Query Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Filter by name/code/lot code |
| `page` | number | 1 | Pagination (at component/product level) |
| `limit` | number | 20 | Items per page |

---

## 3. Response Shapes

### 3A — COMPONENT Warehouse

```json
{
  "warehouseId": 1,
  "warehouseName": "Main Warehouse (Materials)",
  "warehouseType": "COMPONENT",
  "location": "Building A",
  "summary": {
    "totalComponents": 5,
    "totalLots": 12,
    "totalQuantity": 3400
  },
  "data": [
    {
      "componentId": 1,
      "componentCode": "CMP-001",
      "componentName": "Steel Rod 10mm",
      "unit": "pcs",
      "totalCurrentQuantity": 800,
      "minStockLevel": 500,
      "status": "OK",
      "lotCount": 3,
      "lots": [
        {
          "componentLotId": 10,
          "lotCode": "LOT-2026-001",
          "initialQuantity": 500,
          "currentQuantity": 300,
          "receivedAt": "2026-05-15T10:00:00Z",
          "poCode": "PO-2026-042"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Status badge logic**: `status: "OK"` | `"LOW_STOCK"` (already computed by backend — just render it)

---

### 3B — SALES Warehouse

```json
{
  "warehouseId": 3,
  "warehouseName": "Sales Warehouse",
  "warehouseType": "SALES",
  "location": null,
  "summary": {
    "totalProducts": 3,
    "totalInstances": 150
  },
  "data": [
    {
      "productId": 1,
      "productCode": "PRD-001",
      "productName": "Electric Motor A200",
      "unit": "unit",
      "inStockCount": 75,
      "minStockLevel": 50,
      "status": "OK",
      "oldestReceivedAt": "2026-04-10T08:00:00Z",
      "newestReceivedAt": "2026-06-05T16:30:00Z",
      "batches": [
        {
          "batchCode": "BATCH-2026-015",
          "productionDate": "2026-06-01T00:00:00Z",
          "expiryDate": "2027-06-01T00:00:00Z",
          "instanceCount": 30,
          "workOrderCode": "WO-2026-010"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

**Status badge logic**: `"OK"` | `"LOW_STOCK"` | `"OUT_OF_STOCK"`

---

### 3C — ERROR Warehouse

```json
{
  "warehouseId": 4,
  "warehouseName": "Error Warehouse",
  "warehouseType": "ERROR",
  "location": null,
  "summary": {
    "totalProducts": 2,
    "totalDefectiveInstances": 18
  },
  "data": [
    {
      "productId": 1,
      "productCode": "PRD-001",
      "productName": "Electric Motor A200",
      "unit": "unit",
      "defectiveCount": 12,
      "batches": [
        {
          "batchCode": "BATCH-2026-015",
          "productionDate": "2026-06-01T00:00:00Z",
          "instanceCount": 8,
          "workOrderCode": "WO-2026-010",
          "productionLineName": "Line A"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```

> Note: ERROR type has **no `status` or `minStockLevel`** — not meaningful for defective stock.

---

## 4. Step 1 — Add to `warehouseServices.ts`

File: `frontend/src/services/warehouseServices.ts`

**Add these types and the service method to the existing file:**

```typescript
// ─── Stock Detail Types ────────────────────────────────────────────────────

export interface StockQuery {
    page?: number;
    limit?: number;
    search?: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// COMPONENT
export interface ComponentLotDetail {
    componentLotId: number;
    lotCode: string;
    initialQuantity: number;
    currentQuantity: number;
    receivedAt: string;
    poCode: string | null;
}

export interface ComponentStockItem {
    componentId: number;
    componentCode: string;
    componentName: string;
    unit: string;
    totalCurrentQuantity: number;
    minStockLevel: number;
    status: 'OK' | 'LOW_STOCK';
    lotCount: number;
    lots: ComponentLotDetail[];
}

export interface ComponentStockResponse {
    warehouseId: number;
    warehouseName: string;
    warehouseType: 'COMPONENT';
    location: string | null;
    summary: { totalComponents: number; totalLots: number; totalQuantity: number };
    data: ComponentStockItem[];
    pagination: PaginationMeta;
}

// SALES
export interface BatchDetail {
    batchCode: string;
    productionDate: string;
    expiryDate: string | null;
    instanceCount: number;
    workOrderCode: string;
}

export interface SalesStockItem {
    productId: number;
    productCode: string;
    productName: string;
    unit: string;
    inStockCount: number;
    minStockLevel: number;
    status: 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    oldestReceivedAt: string | null;
    newestReceivedAt: string | null;
    batches: BatchDetail[];
}

export interface SalesStockResponse {
    warehouseId: number;
    warehouseName: string;
    warehouseType: 'SALES';
    location: string | null;
    summary: { totalProducts: number; totalInstances: number };
    data: SalesStockItem[];
    pagination: PaginationMeta;
}

// ERROR
export interface ErrorBatchDetail {
    batchCode: string;
    productionDate: string;
    instanceCount: number;
    workOrderCode: string;
    productionLineName: string | null;
}

export interface ErrorStockItem {
    productId: number;
    productCode: string;
    productName: string;
    unit: string;
    defectiveCount: number;
    batches: ErrorBatchDetail[];
}

export interface ErrorStockResponse {
    warehouseId: number;
    warehouseName: string;
    warehouseType: 'ERROR';
    location: string | null;
    summary: { totalProducts: number; totalDefectiveInstances: number };
    data: ErrorStockItem[];
    pagination: PaginationMeta;
}

export type WarehouseStockResponse = ComponentStockResponse | SalesStockResponse | ErrorStockResponse;

// ─── Add this method inside the existing WarehouseServices object ──────────

// getWarehouseStock: async (id: number, params?: StockQuery) => {
//     const response = await api.get<WarehouseStockResponse>(`/warehouses/${id}/stock`, { params });
//     return response.data;
// },
```

**Final `WarehouseServices` object after adding the method:**

```typescript
export const WarehouseServices = {
    getAllWarehouse: async (params?: { type?: TYPE; search?: string }) => {
        const response = await api.get<Warehouse>(`/warehouses`, { params });
        return response.data;
    },

    getWarehouseStock: async (id: number, params?: StockQuery) => {
        const response = await api.get<WarehouseStockResponse>(`/warehouses/${id}/stock`, { params });
        return response.data;
    },

    createWarehouse: async (data: { warehouseName: string; location?: string; warehouseType: string }) => {
        const response = await api.post<Warehouse>(`/warehouses`, data);
        return response.data;
    },

    updateWarehouse: async (id: number, data: { warehouseName: string; location?: string }) => {
        const response = await api.put<Warehouse>(`/warehouses/${id}`, data);
        return response.data;
    },

    deleteWarehouse: async (id: number) => {
        const response = await api.delete(`/warehouses/${id}`);
        return response.data;
    }
}
```

---

## 5. Step 2 — Wire Up the Eye Button in `WarehouseInformation.tsx`

The **Eye button** on line 204 currently does nothing. Connect it to open a stock detail modal:

```tsx
// 1. Add state at the top of WarehouseInformation component
const [stockModal, setStockModal] = useState<{ isOpen: boolean; warehouseId: number | null; warehouseName: string }>({
    isOpen: false,
    warehouseId: null,
    warehouseName: ''
});

// 2. Replace the Eye button's onClick (currently no handler):
<button
    onClick={() => setStockModal({ isOpen: true, warehouseId: item.dbId, warehouseName: item.name })}
    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
    title="View Stock Detail"
>
    <Eye className="w-4 h-4" />
</button>

// 3. Render the modal at the bottom of the JSX (alongside AddWarehouseModal)
{stockModal.isOpen && stockModal.warehouseId && (
    <WarehouseStockModal
        warehouseId={stockModal.warehouseId}
        warehouseName={stockModal.warehouseName}
        onClose={() => setStockModal({ isOpen: false, warehouseId: null, warehouseName: '' })}
    />
)}
```

---

## 6. Step 3 — Create `WarehouseStockModal.tsx`

File: `frontend/src/screens/Warehouses/components/WarehouseStockModal.tsx`

**Suggested structure:**

```
WarehouseStockModal
├── Header (warehouseName, warehouseType badge, location, summary cards)
├── Search input + pagination controls
└── Type-specific content:
    ├── COMPONENT → ComponentStockTable (accordion rows: component → lots)
    ├── SALES     → SalesStockTable (accordion rows: product → batches)
    └── ERROR     → ErrorStockTable (accordion rows: product → batches with line name)
```

**Skeleton implementation:**

```tsx
import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Search } from "lucide-react";
import { WarehouseServices, type WarehouseStockResponse } from "../../../services/warehouseServices";

interface Props {
    warehouseId: number;
    warehouseName: string;
    onClose: () => void;
}

export const WarehouseStockModal = ({ warehouseId, warehouseName, onClose }: Props) => {
    const [data, setData] = useState<WarehouseStockResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const fetchStock = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await WarehouseServices.getWarehouseStock(warehouseId, {
                search: search || undefined,
                page,
                limit: 20
            });
            setData(result);
        } catch (err) {
            console.error("Failed to load warehouse stock:", err);
        } finally {
            setIsLoading(false);
        }
    }, [warehouseId, search, page]);

    // Reset page when search changes
    useEffect(() => { setPage(1); }, [search]);

    useEffect(() => { fetchStock(); }, [fetchStock]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{warehouseName}</h2>
                        {data && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                data.warehouseType === 'COMPONENT' ? 'bg-purple-100 text-purple-700' :
                                data.warehouseType === 'SALES'     ? 'bg-indigo-100 text-indigo-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {data.warehouseType}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Cards */}
                {data && <SummaryCards data={data} />}

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, code, lot..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : !data || data.data.length === 0 ? (
                        <p className="text-center text-gray-400 py-12">No stock found in this warehouse.</p>
                    ) : data.warehouseType === 'COMPONENT' ? (
                        <ComponentStockTable items={data.data} />
                    ) : data.warehouseType === 'SALES' ? (
                        <SalesStockTable items={data.data} />
                    ) : (
                        <ErrorStockTable items={data.data} />
                    )}
                </div>

                {/* Pagination Footer */}
                {data && data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-sm text-gray-600">
                        <span>
                            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page >= data.pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
```

---

## 7. Sub-Component Suggestions

### `SummaryCards` (shared by all types)

Show the `summary` object as 2–3 stat cards at the top of the modal:

| COMPONENT | SALES | ERROR |
|---|---|---|
| Total Components | Total Products | Total Products |
| Total Lots | Total Instances | Total Defective Instances |
| Total Quantity | — | — |

---

### `ComponentStockTable`

Use **accordion rows** — each component row expands to show its lots:

```
▶ Steel Rod 10mm   CMP-001   800 pcs   [OK]
  └ LOT-2026-001   500 initial / 300 current   Received 2026-05-15   PO: PO-2026-042
  └ LOT-2026-002   ...
```

Key render notes:
- `status === 'LOW_STOCK'` → show badge in red/orange
- `poCode` may be `null` — show `—` instead

---

### `SalesStockTable`

```
▶ Electric Motor A200   PRD-001   75 units   [OK]
    Oldest: 2026-04-10  |  Newest: 2026-06-05
    └ BATCH-2026-015   30 units   WO: WO-2026-010   Prod: 2026-06-01   Expiry: 2027-06-01
```

Key render notes:
- `expiryDate` may be `null` — show `—`
- `status` can be `OUT_OF_STOCK` (show in red)

---

### `ErrorStockTable`

```
▶ Electric Motor A200   PRD-001   12 defective units
    └ BATCH-2026-015   8 units   WO: WO-2026-010   Line: Line A
```

Key render notes:
- No `status` badge — this is a defect warehouse
- `productionLineName` may be `null` — show `—`
- Use red tones to visually signal defective goods

---

## 8. Existing Drill-Down for Serial Numbers (Already Works)

For SALES/ERROR warehouses, if the user wants to see **individual serial numbers**, the existing endpoint already handles it — no new API needed:

```typescript
// Already in productInstanceServices.ts:
ProductInstanceServices.getProductInstances({
    warehouseId: warehouseId,
    status: 'IN_STOCK_SALES',   // or 'IN_STOCK_ERROR'
    productId: productId,        // optional filter
    page: 1,
    limit: 50
})
```

You can add a "View Serials" button inside the batch row to open a second modal with this data.

---

## 9. Error Handling

Follow the same pattern as `WarehouseInformation.tsx`:

```typescript
} catch (error: any) {
    const msg = error.response?.data?.message || "Failed to load warehouse stock";
    // show your WarningNotification component
}
```

| HTTP Status | Cause | User message |
|---|---|---|
| `400` | Non-numeric ID | "Invalid warehouse ID" |
| `404` | Warehouse deleted between list load and click | "Warehouse not found" |
| `403` | User lost `WH_STOCK_READ` permission | Handled by `api.ts` interceptor (auto-logout if 401, otherwise surface the 403 message) |

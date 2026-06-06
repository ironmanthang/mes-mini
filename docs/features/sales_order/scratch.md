# Sales Order Page Deletion - Implementation Plan

## Overview
This document provides a complete implementation plan for removing the sales order page from the frontend while preserving the backend API.

## Files to Read (Context)

### Frontend Components to Modify
1. `frontend/src/screens/FinishedProduct/components/NewSalesOrderModal.tsx`
2. `frontend/src/screens/FinishedProduct/components/SalesOrderDetailModal.tsx`
3. `frontend/src/screens/FinishedProduct/components/Orders.tsx`
4. `frontend/src/services/salesOrdersServices.ts`

### Documentation Files to Create
1. `docs/features/sales_order/IMPLEMENTATION_PLAN.md` (this file)
2. `docs/features/sales_order/01_logic.md`
3. `docs/features/sales_order/02_frontend_guide.md`

## Files to Edit

### 1. NewSalesOrderModal.tsx
**Location:** `frontend/src/screens/FinishedProduct/components/NewSalesOrderModal.tsx`

**Changes:**
- Remove all imports from `salesOrdersServices`
- Remove `SalesOrdersServices` import
- Remove modal JSX content (entire modal structure)
- Remove `NewSalesOrderModal` import from `Orders.tsx`
- Remove `NewSalesOrderModal` import from `salesOrdersServices.ts`

### 2. SalesOrderDetailModal.tsx
**Location:** `frontend/src/screens/FinishedProduct/components/SalesOrderDetailModal.tsx`

**Changes:**
- Remove all imports from `salesOrdersServices`
- Remove `SalesOrdersServices` import
- Remove `SalesOrderDetailModal` import from `Orders.tsx`
- Remove `SalesOrderDetailModal` import from `salesOrdersServices.ts`
- Remove modal JSX content (entire modal structure)

### 3. Orders.tsx
**Location:** `frontend/src/screens/FinishedProduct/components/Orders.tsx`

**Changes:**
- Remove `SalesOrderDetailModal` import
- Remove `NewSalesOrderModal` import
- Remove `SalesOrdersServices` import
- Remove all order-related JSX (table, buttons, modal references)
- Remove `handleSelectedSalesOrder` function
- Remove `handleEditOrder` function
- Remove `handleSubmitOrder` function
- Remove `handleDeleteDraft` function
- Remove `handleApproveOrder` function
- Remove `handleRejectOrder` function
- Remove `handleStartProcessing` function
- Remove `handleShipOrder` function
- Remove `getStatusColor` function
- Remove `totalPages` calculation
- Remove loading state
- Remove empty state
- Remove modal render section

### 4. salesOrdersServices.ts
**Location:** `frontend/src/services/salesOrdersServices.ts`

**Changes:**
- Remove all type definitions:
  - `SalesOrderListItem`
  - `PaginatedSalesOrders`
  - `SalesOrderDetail`
- Remove all service methods:
  - `getAllSalesOrders`
  - `getSalesOrderDetail`
  - `deleteSalesOrder`
  - `submitSalesOrder`
  - `approveSalesOrder`
  - `rejectSalesOrder`
  - `startProcessing`
  - `createNewSalesOrder`
  - `shipOrder`
  - `getSalesOrderDetail`
- Remove `SalesOrdersServices` export

## Files to Leave Untouched

### Backend API
- `backend/src/sales/salesOrders/salesOrderService.ts`
- `backend/src/sales/salesOrders/salesOrderController.ts`
- `backend/src/sales/salesOrders/salesOrderRoutes.ts`
- `backend/prisma/schema.prisma`
- All backend migrations

### Other Frontend Components
- `frontend/src/screens/FinishedProduct/components/Orders.tsx` (already listed)
- `frontend/src/services/salesOrdersServices.ts` (already listed)
- `frontend/src/screens/FinishedProduct/components/NewSalesOrderModal.tsx` (already listed)
- `frontend/src/screens/FinishedProduct/components/SalesOrderDetailModal.tsx` (already listed)

## Implementation Steps

### Step 1: Create Documentation Files
1. Create `docs/features/sales_order/IMPLEMENTATION_PLAN.md`
2. Create `docs/features/sales_order/01_logic.md`
3. Create `docs/features/sales_order/02_frontend_guide.md`

### Step 2: Implement NewSalesOrderModal.tsx
1. Remove all imports from `salesOrdersServices`
2. Remove `SalesOrdersServices` import
3. Remove modal JSX content
4. Remove `NewSalesOrderModal` import from `Orders.tsx`
5. Remove `NewSalesOrderModal` import from `salesOrdersServices.ts`

### Step 3: Implement SalesOrderDetailModal.tsx
1. Remove all imports from `salesOrdersServices`
2. Remove `SalesOrdersServices` import
3. Remove `SalesOrderDetailModal` import from `Orders.tsx`
4. Remove `SalesOrderDetailModal` import from `salesOrdersServices.ts`
5. Remove modal JSX content

### Step 4: Implement Orders.tsx
1. Remove `SalesOrderDetailModal` import
2. Remove `NewSalesOrderModal` import
3. Remove `SalesOrdersServices` import
4. Remove all order-related JSX
5. Remove all order-related functions
6. Remove `getStatusColor` function
7. Remove `totalPages` calculation
8. Remove loading state
9. Remove empty state
10. Remove modal render section

### Step 5: Implement salesOrdersServices.ts
1. Remove all type definitions
2. Remove all service methods
3. Remove `SalesOrdersServices` export

## Testing Checklist

- [ ] NewSalesOrderModal.tsx compiles without errors
- [ ] SalesOrderDetailModal.tsx compiles without errors
- [ ] Orders.tsx compiles without errors
- [ ] salesOrdersServices.ts compiles without errors
- [ ] No TypeScript errors in frontend
- [ ] No runtime errors in frontend
- [ ] Backend API remains unchanged
- [ ] No database schema changes required

## Notes
- Backend API will be preserved as requested
- Only frontend components are being modified
- No database schema changes required
- No migrations needed
- Documentation files created for future reference

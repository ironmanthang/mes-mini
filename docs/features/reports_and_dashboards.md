# Reports and Dashboards Hub

The Reports and Dashboards Hub provides real-time, dynamic analytics across manufacturing throughput, component and finished goods inventory levels, and financial procurement/production expenditures.

## Architecture and Integration

The hub is divided into three key analytical modules, each directly integrated with live backend services rather than relying on mocked data.

### Line Performance Analytics
- **Purpose**: Displays the real-time throughput and pass rate (yield) of the active manufacturing lines.
- **Source Endpoint**: Connected directly to `/api/production/reports/line-performance`.
- **Key Features**:
  - **Dynamic Filters**: Slices data by Start Date, End Date, Production Line, and target Product.
  - **Telemetry Widgets**: Tracks Total Output volume, Overall Pass Rate (with yield status alerting), Top Line Identification, and Quality Control Defect Rate.
  - **Yield Breakdown**: Uses a Recharts stacked bar chart to show passed versus failed units on each line.
  - **Performance Leaderboard**: Provides a location-aware tabular yield rank of active lines.
  - **Product Breakdown**: Grouped Recharts pie chart highlighting the share of manufacturing volume per product.

### Inventory Summary
- **Purpose**: Displays consolidated component and serialized finished goods stock levels across all physical warehouses.
- **Source Endpoints**:
  - **Components**: Consumed from `/api/warehouse-ops/inventory/status`.
  - **Finished Products**: Consumed from `/api/product-instances`.
  - **Warehouse Metadata**: Filter selector populated dynamically from `/api/warehouses`.
- **Key Features**:
  - **Component Inventory Report**: Real-time available component quantity, minimum stock thresholds, and low stock warnings.
  - **Finished Goods Inventory Report**: Serialized counts of product instances grouped dynamically by product catalog type.

### Cost and Financial Reports
- **Purpose**: Tracks operational expenditures across direct material procurement and production conversions.
- **Source Endpoints**:
  - **Material Spend**: Consumed from `/api/costs/materials`.
  - **Production Yield Costs**: Consumed from `/api/costs/products`.
- **Key Features**:
  - **Telemetry Cards**: Direct material spend, total quantity received, average unit cost, absorbed material spend, factory labor/overhead, and absorbed per-unit averages.
  - **Procurement Timeline**: Recharts bar chart showing daily procurement spends.
  - **Manufacturing Trends**: Recharts line chart mapping total production costs, material absorption, and conversion expenses.
  - **Breakdown Tables**: Supplier spend distribution, component-wise ingestion costs, and product manufacturing cost absorption tables.

## Safety and Extraction Protocols

### Defensive Array Parsing
- **The Constraint**: Frontend services might specify simple typed model returns (e.g., `Product[]`), but backend middleware wraps the return values in paginated envelopes (e.g., `{ data: Product[], total: number }`).
- **The Protocol**: To prevent runtime exceptions like `TypeError: products.map is not a function` resulting in blank white screens, all components consuming master data or reports APIs must parse response envelopes defensively:
  ```typescript
  const dataArray = Array.isArray(apiRes) ? apiRes : (apiRes as any).data || [];
  ```
- **Aesthetic standard**: All charts and loading components use fallback loaders and empty states to prevent layout shifts.

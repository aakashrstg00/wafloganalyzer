# WAF Log Analyzer

A modern React web application to analyze WAF log entries.

## Features

- **File Upload**: Support for NDJSON (Newline Delimited JSON) log files.
- **Filtering**: Create complex filters based on any field (including nested ones).
- **Grouping**: Group logs by any field to see counts and drill down.
- **Sorting**: Sort by any column.
- **Column Selection**: Toggle visibility of any field found in the logs.
- **Deep Inspection**: Expand rows to see the full JSON source.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`.

## Usage

1. **Upload**: Drag and drop your `.json` or `.log` file containing WAF logs.
2. **Analyze**:
   - Use the **Columns** button to show/hide fields like `httprequest.clientip` or `action`.
   - Use **Filters** to narrow down traffic (e.g., `action` equals `BLOCK`).
   - Use **Group By** to aggregate data (e.g., group by `httprequest.country`).

import React, { useState, useEffect, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import LogTable from './components/LogTable';
import Controls from './components/Controls';
import { getAllPaths, filterLogs, sortLogs, enrichLogs } from './utils/logHelpers';
import { Shield, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [rawLogs, setRawLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [allPaths, setAllPaths] = useState([]);

  const [filters, setFilters] = useState([]);
  const [groupBy, setGroupBy] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'timestamp', direction: 'desc' });
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [useHumanTime, setUseHumanTime] = useState(false);
  const [customHeaders, setCustomHeaders] = useState([]);
  const [pendingHeader, setPendingHeader] = useState(null);

  const handleFileUpload = (uploadedLogs, name) => {
    setRawLogs(uploadedLogs);
    setFileName(name);
    // Initial processing will be triggered by useEffect or we do it here
    processLogs(uploadedLogs, customHeaders);
  };

  const processLogs = (sourceLogs, headers) => {
    const enrichedLogs = enrichLogs(sourceLogs, headers);
    setLogs(enrichedLogs);

    // Extract paths from enriched logs
    const paths = getAllPaths(enrichedLogs);
    setAllPaths(paths);

    // Default visible columns (try to pick meaningful ones)
    const defaultCols = ['timestamp', 'action', 'httpRequest.clientIp', 'httpRequest.country', 'httpRequest.uri', 'header.Host', 'header.User-Agent'];

    // Select default columns in order if they exist
    const initialDefaults = defaultCols.filter(col => paths.includes(col));
    // Add other top-level fields not in defaultCols
    const excludedColumns = ['formatVersion', 'httpSourceId', 'httpSourceName', 'webaclId'];
    const otherTopLevel = paths.filter(p => !p.includes('.') && !defaultCols.includes(p)).filter(p => !excludedColumns.includes(p));

    // Only set visible columns if it's the first load (empty)
    if (visibleColumns.length === 0) {
      setVisibleColumns([...initialDefaults, ...otherTopLevel]);
    }
  };

  // Re-process when customHeaders changes
  useEffect(() => {
    if (rawLogs.length > 0) {
      const enrichedLogs = enrichLogs(rawLogs, customHeaders);
      setLogs(enrichedLogs);
      const paths = getAllPaths(enrichedLogs);
      setAllPaths(paths);
    }
  }, [customHeaders, rawLogs]);

  // Auto-add pending header to visible columns once paths are updated
  useEffect(() => {
    if (pendingHeader && allPaths.length > 0) {
      // Find the path that matches the pending header (case-insensitive)
      // The path should look like header.HeaderName
      const normalizedPending = pendingHeader.toLowerCase();
      const matchingPath = allPaths.find(p => {
        if (p.toLowerCase() === `header.${normalizedPending}`) return true;
        // Also check if it's just the header name if strictly flattened (though our logic puts it in header object)
        return false;
      });

      if (matchingPath && !visibleColumns.includes(matchingPath)) {
        setVisibleColumns(prev => [...prev, matchingPath]);
        setPendingHeader(null);
      }
    }
  }, [allPaths, pendingHeader, visibleColumns]);

  const addCustomHeader = (headerName) => {
    if (headerName && !customHeaders.includes(headerName)) {
      setCustomHeaders([...customHeaders, headerName]);
      setPendingHeader(headerName);
    }
  };

  const processedLogs = useMemo(() => {
    let result = filterLogs(logs, filters);

    if (sortConfig.field) {
      result = sortLogs(result, sortConfig.field, sortConfig.direction);
    }

    return result;
  }, [logs, filters, sortConfig]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container header-content">
          <div className="logo">
            <Shield size={32} className="logo-icon" />
            <h1>WAF Log Analyzer</h1>
          </div>
          {fileName && (
            <div className="file-info badge">
              <Activity size={14} />
              {fileName} ({logs.length} entries)
            </div>
          )}
        </div>
      </header>

      <main className="container main-content">
        {logs.length === 0 ? (
          <FileUpload onFileUpload={handleFileUpload} />
        ) : (
          <div className="dashboard animate-fade-in">
            <Controls
              allPaths={allPaths}
              filters={filters}
              setFilters={setFilters}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              useHumanTime={useHumanTime}
              setUseHumanTime={setUseHumanTime}
              onAddCustomHeader={addCustomHeader}
            />

            <LogTable
              logs={processedLogs}
              visibleColumns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSort}
              groupBy={groupBy}
              useHumanTime={useHumanTime}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

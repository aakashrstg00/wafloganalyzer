import React, { useState, useEffect, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import LogTable from './components/LogTable';
import Controls from './components/Controls';
import Shortcuts from './components/Shortcuts';
import { getAllPaths, filterLogs, sortLogs, enrichLogs } from './utils/logHelpers';
import { Shield, Activity, Sun, Moon } from 'lucide-react';
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
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });
  const [theme, setTheme] = useState('dark');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
        // Insert right after timestamp column
        setVisibleColumns(prev => {
          const timestampIndex = prev.indexOf('timestamp');
          if (timestampIndex !== -1) {
            // Insert after timestamp
            const newColumns = [...prev];
            newColumns.splice(timestampIndex + 1, 0, matchingPath);
            return newColumns;
          } else {
            // If no timestamp, add at the beginning
            return [matchingPath, ...prev];
          }
        });
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

  const removeCustomHeader = (headerName) => {
    setCustomHeaders(customHeaders.filter(h => h !== headerName));
  };

  const handleApplyShortcut = (shortcut) => {
    // Apply the groupBy
    setGroupBy(shortcut.groupBy);

    // Apply filters if any
    if (shortcut.filters && shortcut.filters.length > 0) {
      setFilters(shortcut.filters);
    } else {
      setFilters([]);
    }

    // Note: The limit is handled by the grouping display in LogTable
    // We could add a separate limit state if needed
  };

  const processedLogs = useMemo(() => {
    let result = filterLogs(logs, filters);

    // Apply time range filter
    if (timeRange.start || timeRange.end) {
      result = result.filter(log => {
        const timestamp = log.timestamp;
        if (!timestamp) return true; // Keep logs without timestamp

        // Convert timestamp to milliseconds if needed
        let ts = Number(timestamp);
        // If timestamp is in seconds (10 digits or less), convert to milliseconds
        if (ts < 10000000000) ts *= 1000;

        if (timeRange.start) {
          // Parse the datetime-local input as UTC
          const startDateUTC = new Date(timeRange.start + 'Z'); // Append 'Z' to treat as UTC
          const startTime = startDateUTC.getTime();
          if (ts < startTime) return false;
        }

        if (timeRange.end) {
          // Parse the datetime-local input as UTC
          const endDateUTC = new Date(timeRange.end + 'Z'); // Append 'Z' to treat as UTC
          const endTime = endDateUTC.getTime();
          if (ts > endTime) return false;
        }

        return true;
      });
    }

    if (sortConfig.field) {
      result = sortLogs(result, sortConfig.field, sortConfig.direction);
    }

    return result;
  }, [logs, filters, sortConfig, timeRange]);

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
          <div className="header-actions">
            {fileName && (
              <div className="file-info badge">
                <Activity size={14} />
                {fileName} ({logs.length} entries)
              </div>
            )}
            <button
              className="btn btn-secondary btn-icon-only"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">
        {logs.length === 0 ? (
          <FileUpload onFileUpload={handleFileUpload} />
        ) : (
          <div className="dashboard animate-fade-in">
            <Shortcuts
              allPaths={allPaths}
              onApplyShortcut={handleApplyShortcut}
            />

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
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              customHeaders={customHeaders}
              onRemoveCustomHeader={removeCustomHeader}
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

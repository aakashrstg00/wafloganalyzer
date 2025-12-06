import React, { useState, useEffect, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import LogTable from './components/LogTable';
import Controls from './components/Controls';
import Shortcuts from './components/Shortcuts';
import { Shield, Activity, Sun, Moon } from 'lucide-react';
import LogWorker from './workers/logProcessor.worker?worker';
import './App.css';

function App() {
  const [rawLogs, setRawLogs] = useState([]);
  const [logs, setLogs] = useState([]); // Enriched logs (full set)
  const [displayLogs, setDisplayLogs] = useState([]); // Filtered and sorted logs for display
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
  const [isProcessing, setIsProcessing] = useState(false);

  const workerRef = React.useRef(null);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new LogWorker();

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === 'LOGS_PROCESSED') {
        setLogs(payload.logs);
        setAllPaths(payload.paths);

        // Initial column setup logic (moved from processLogs)
        const paths = payload.paths;
        const defaultCols = ['timestamp', 'action', 'httpRequest.clientIp', 'httpRequest.country', 'httpRequest.uri', 'header.Host', 'header.User-Agent'];
        const initialDefaults = defaultCols.filter(col => paths.includes(col));
        const excludedColumns = ['formatVersion', 'httpSourceId', 'httpSourceName', 'webaclId'];
        const otherTopLevel = paths.filter(p => !p.includes('.') && !defaultCols.includes(p)).filter(p => !excludedColumns.includes(p));

        setVisibleColumns(prev => {
          if (prev.length === 0) {
            return [...initialDefaults, ...otherTopLevel];
          }
          return prev;
        });
        setIsProcessing(false);
      }
      else if (type === 'FILTER_SORT_COMPLETE') {
        setDisplayLogs(payload.logs);
        setIsProcessing(false);
      }
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

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
    setIsProcessing(true);
    workerRef.current.postMessage({
      type: 'PROCESS_LOGS',
      payload: { rawLogs: uploadedLogs, customHeaders }
    });
  };

  // Re-process when customHeaders changes
  useEffect(() => {
    if (rawLogs.length > 0) {
      setIsProcessing(true);
      workerRef.current.postMessage({
        type: 'PROCESS_LOGS',
        payload: { rawLogs, customHeaders }
      });
    }
  }, [customHeaders, rawLogs]);

  // Filter and Sort when dependencies change
  useEffect(() => {
    if (logs.length > 0) {
      // setIsProcessing(true); // Optional: might cause flicker for fast updates
      workerRef.current.postMessage({
        type: 'FILTER_AND_SORT',
        payload: { logs, filters, sortConfig, timeRange }
      });
    } else {
      setDisplayLogs([]);
    }
  }, [logs, filters, sortConfig, timeRange]);

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
  };

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
              logs={displayLogs}
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

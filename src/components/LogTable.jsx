import React, { useState } from 'react';
import _ from 'lodash';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import './LogTable.css';

const LogTable = ({ logs, visibleColumns, sortConfig, onSort, groupBy, useHumanTime }) => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedRows, setExpandedRows] = useState({});
    const [page, setPage] = useState(1);
    const pageSize = 50;

    // Check if there are no results
    if (!logs || logs.length === 0) {
        return (
            <div className="log-table-container card">
                <div className="no-results">
                    <div className="no-results-icon">📊</div>
                    <h3 className="no-results-title">No Results Found</h3>
                    <p className="no-results-message">
                        No log entries match the current filters or search criteria.
                        Try adjusting your filters or uploading a different log file.
                    </p>
                </div>
            </div>
        );
    }

    // Pagination for flat list
    const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(logs.length / pageSize);

    const toggleGroup = (groupKey) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const toggleRow = (rowId) => {
        setExpandedRows(prev => ({
            ...prev,
            [rowId]: !prev[rowId]
        }));
    };

    const renderCell = (log, column) => {
        const value = _.get(log, column);

        if (value === undefined || value === null || value === '') {
            return '-';
        }

        if (column === 'timestamp' && useHumanTime) {
            try {
                // Assuming timestamp is in milliseconds. If it's seconds (10 digits), multiply by 1000.
                // WAF logs are usually milliseconds (13 digits).
                let ts = Number(value);
                if (ts < 10000000000) ts *= 1000; // Heuristic for seconds
                return new Date(ts).toISOString().replace('T', ' ').replace('Z', ' UTC');
            } catch (e) {
                return String(value);
            }
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    const renderSortIcon = (column) => {
        if (sortConfig.field !== column) return null;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    if (groupBy) {
        // Grouped View
        // logs is already an object { groupKey: [logs] } if grouped in parent?
        // Wait, parent passes grouped logs? No, parent passes filtered logs.
        // I should handle grouping here or expect parent to pass grouped structure.
        // The helper `groupLogs` returns an object.
        // Let's assume `logs` passed here is the raw array (filtered and sorted), 
        // and we do grouping here if `groupBy` is set.

        // Actually, sorting should happen before grouping usually, or sort groups?
        // Let's group here.
        const grouped = _.groupBy(logs, (log) => _.get(log, groupBy) || 'Undefined');

        // Sort group keys by count (descending) instead of alphabetically
        const groupKeys = Object.keys(grouped).sort((a, b) => {
            return grouped[b].length - grouped[a].length;
        });

        return (
            <div className="log-table-container">
                <div className="groups-list">
                    {groupKeys.map(key => (
                        <div key={key} className="group-item card">
                            <div
                                className="group-header"
                                onClick={() => toggleGroup(key)}
                            >
                                {expandedGroups[key] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <span className="group-title">
                                    <span className="group-key">{groupBy}:</span>
                                    <span className="group-value">{key}</span>
                                </span>
                                <span className="group-count badge">{grouped[key].length}</span>
                            </div>

                            {expandedGroups[key] && (
                                <div className="group-content">
                                    <Table
                                        logs={grouped[key]}
                                        visibleColumns={visibleColumns}
                                        sortConfig={sortConfig}
                                        onSort={onSort}
                                        renderCell={renderCell}
                                        renderSortIcon={renderSortIcon}
                                        toggleRow={toggleRow}
                                        expandedRows={expandedRows}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="log-table-container card">
            <Table
                logs={paginatedLogs}
                visibleColumns={visibleColumns}
                sortConfig={sortConfig}
                onSort={onSort}
                renderCell={renderCell}
                renderSortIcon={renderSortIcon}
                toggleRow={toggleRow}
                expandedRows={expandedRows}
            />

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {page} of {totalPages} ({logs.length} entries)
                    </span>
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

const Table = ({ logs, visibleColumns, sortConfig, onSort, renderCell, renderSortIcon, toggleRow, expandedRows }) => (
    <div className="table-wrapper">
        <table className="log-table">
            <thead>
                <tr>
                    <th className="w-10"></th>
                    {visibleColumns.map(col => (
                        <th key={col} onClick={() => onSort(col)} className="sortable-header">
                            <div className="th-content">
                                {col} {renderSortIcon(col)}
                            </div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {logs.map((log, idx) => {
                    // Use a unique ID if available, else index
                    const rowId = log.requestid || idx;
                    return (
                        <React.Fragment key={rowId}>
                            <tr className={expandedRows[rowId] ? 'expanded' : ''}>
                                <td className="toggle-cell" onClick={() => toggleRow(rowId)}>
                                    {expandedRows[rowId] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </td>
                                {visibleColumns.map(col => (
                                    <td key={col} title={renderCell(log, col)}>
                                        {renderCell(log, col)}
                                    </td>
                                ))}
                            </tr>
                            {expandedRows[rowId] && (
                                <tr className="detail-row">
                                    <td colSpan={visibleColumns.length + 1}>
                                        <pre className="json-detail">
                                            {JSON.stringify(log, null, 2)}
                                        </pre>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default LogTable;

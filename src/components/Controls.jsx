import React, { useState } from 'react';
import { Filter, Settings, Layers, X, Plus, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import './Controls.css';

const Controls = ({
    allPaths,
    filters,
    setFilters,
    groupBy,
    setGroupBy,
    visibleColumns,
    setVisibleColumns,
    useHumanTime,
    setUseHumanTime,
    onAddCustomHeader,
    timeRange,
    setTimeRange,
    customHeaders,
    onRemoveCustomHeader
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [showColumns, setShowColumns] = useState(false);
    const [showTimeRange, setShowTimeRange] = useState(false);

    const addFilter = () => {
        setFilters([...filters, { field: allPaths[0], operator: 'equals', value: '' }]);
    };

    const removeFilter = (index) => {
        const newFilters = [...filters];
        newFilters.splice(index, 1);
        setFilters(newFilters);
    };

    const updateFilter = (index, key, val) => {
        const newFilters = [...filters];
        newFilters[index][key] = val;
        setFilters(newFilters);
    };

    const toggleColumn = (column) => {
        if (visibleColumns.includes(column)) {
            setVisibleColumns(visibleColumns.filter(c => c !== column));
        } else {
            if (column === 'timestamp') {
                setVisibleColumns(['timestamp', ...visibleColumns]);
            } else {
                setVisibleColumns(['timestamp', ...[...visibleColumns, column].sort().filter(c => c !== 'timestamp')]);
            }
        }
    };

    const [customHeader, setCustomHeader] = useState('');

    const handleAddHeader = () => {
        if (customHeader.trim()) {
            onAddCustomHeader(customHeader.trim());
            setCustomHeader('');
        }
    };

    return (
        <div>
            <div className="controls-container card">
                <div className="controls-header">
                    <div className="controls-actions">
                        <div className="left-controls">
                            <button
                                className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={16} /> Filters ({filters.length})
                            </button>

                            <button
                                className={`btn ${showColumns ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setShowColumns(!showColumns)}
                            >
                                <Settings size={16} /> Columns
                            </button>

                            <button
                                className={`btn ${showTimeRange ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setShowTimeRange(!showTimeRange)}
                            >
                                <Clock size={16} /> Time Range
                            </button>

                            <button
                                className={`btn ${useHumanTime ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setUseHumanTime(!useHumanTime)}
                                title="Toggle Human Readable Time (UTC)"
                            >
                                <Clock size={16} /> {useHumanTime ? 'UTC Time' : 'Epoch Time'}
                            </button>

                            <div className="group-by-control">
                                <span className="label-inline"><Layers size={16} /> Group By:</span>
                                <select
                                    className="input select-inline"
                                    value={groupBy || ''}
                                    onChange={(e) => setGroupBy(e.target.value || null)}
                                >
                                    <option value="">None</option>
                                    {allPaths.filter(p => !p.includes('.headers[')).map(path => (
                                        <option key={path} value={path}>{path}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            className="btn btn-secondary clear-all-btn"
                            onClick={() => {
                                setFilters([]);
                                setGroupBy(null);
                            }}
                            title="Clear all filters and grouping"
                        >
                            <X size={16} /> Clear filters
                        </button>
                    </div>
                </div>


                {showFilters && (
                    <div className="filters-panel animate-fade-in">
                        {filters.map((filter, index) => (
                            <div key={index} className="filter-row">
                                <select
                                    className="input"
                                    value={filter.field}
                                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                                >
                                    {allPaths.filter(p => !p.includes('.headers[')).map(path => (
                                        <option key={path} value={path}>{path}</option>
                                    ))}
                                </select>

                                <select
                                    className="input"
                                    value={filter.operator}
                                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                                >
                                    <option value="equals">Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="startsWith">Starts With</option>
                                    <option value="endsWith">Ends With</option>
                                    <option value="gt">Greater Than</option>
                                    <option value="lt">Less Than</option>
                                    <option value="exists">Exists</option>
                                    <option value="isNotEmpty">Is Not Empty</option>
                                </select>

                                {filter.operator !== 'exists' && filter.operator !== 'isNotEmpty' && (
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Value"
                                        value={filter.value}
                                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                    />
                                )}

                                <button className="btn-icon" onClick={() => removeFilter(index)}>
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <button className="btn btn-secondary btn-sm" onClick={addFilter}>
                            <Plus size={14} /> Add Filter
                        </button>
                    </div>
                )}

                {showColumns && (
                    <div className="columns-panel animate-fade-in">
                        <div className="columns-grid">
                            {allPaths.filter(p => !p.includes('.headers[')).map(path => (
                                <label key={path} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(path)}
                                        onChange={() => toggleColumn(path)}
                                    />
                                    {path}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {showTimeRange && (
                    <div className="time-range-panel animate-fade-in">
                        <div className="time-range-inputs">
                            <div className="time-input-group">
                                <label className="label">Start Time</label>
                                <input
                                    type="datetime-local"
                                    className="input"
                                    value={timeRange.start || ''}
                                    onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                                />
                            </div>
                            <div className="time-input-group">
                                <label className="label">End Time</label>
                                <input
                                    type="datetime-local"
                                    className="input"
                                    value={timeRange.end || ''}
                                    onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                                />
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setTimeRange({ start: '', end: '' })}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="controls-container card">
                <div className="controls-header">
                    <div className="custom-header-control">
                        <input
                            type="text"
                            className="input"
                            placeholder="Add Header (e.g. X-Request-ID)"
                            value={customHeader}
                            onChange={(e) => setCustomHeader(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddHeader()}
                        />
                        <button className="btn btn-secondary" onClick={handleAddHeader}>
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {customHeaders && customHeaders.length > 0 && (
                    <div className="custom-headers-list">
                        {/* <div className="custom-headers-label">Custom Headers:</div> */}
                        <div className="custom-headers-tags">
                            {customHeaders.map((header, index) => (
                                <span key={index} className="custom-header-tag">
                                    header.{header}
                                    <button
                                        className="remove-header-btn"
                                        onClick={() => onRemoveCustomHeader(header)}
                                        title="Remove header"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Controls;

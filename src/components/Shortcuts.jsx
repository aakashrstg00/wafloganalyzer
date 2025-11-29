import React, { useState } from 'react';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import './Shortcuts.css';

const Shortcuts = ({ allPaths, onApplyShortcut }) => {
    const [showShortcuts, setShowShortcuts] = useState(false);

    const shortcuts = [
        {
            id: 'top-100-ips',
            name: 'Top 100 IPs',
            description: 'Group by client IP and show top 100',
            field: 'httpRequest.clientIp'
        },
        {
            id: 'top-100-countries',
            name: 'Top 100 Countries',
            description: 'Group by country and show top 100',
            field: 'httpRequest.country'
        },
        {
            id: 'top-100-user-agents',
            name: 'Top 100 User-Agents',
            description: 'Group by User-Agent and show top 100',
            field: 'header.User-Agent'
        },
        {
            id: 'top-100-uris',
            name: 'Top 100 URIs',
            description: 'Group by URI path and show top 100',
            field: 'httpRequest.uri'
        },
        {
            id: 'top-100-referers',
            name: 'Top 100 Referers',
            description: 'Group by Referer header and show top 100',
            field: 'header.Referer'
        },
        {
            id: 'top-100-hosts',
            name: 'Top 100 Hosts',
            description: 'Group by Host header and show top 100',
            field: 'header.Host'
        },
        {
            id: 'blocked-ips',
            name: 'IPs Causing Blocks',
            description: 'Filter by BLOCK action and group by IP',
            field: 'httpRequest.clientIp',
            filter: { field: 'action', operator: 'equals', value: 'BLOCK' }
        },
        {
            id: 'blocked-countries',
            name: 'Countries Causing Blocks',
            description: 'Filter by BLOCK action and group by country',
            field: 'httpRequest.country',
            filter: { field: 'action', operator: 'equals', value: 'BLOCK' }
        }
    ];

    const handleShortcutClick = (shortcut) => {
        // Check if the field exists in the logs
        if (!allPaths.includes(shortcut.field)) {
            alert(`Field "${shortcut.field}" not found in logs. Make sure the data contains this field.`);
            return;
        }

        onApplyShortcut({
            groupBy: shortcut.field,
            filters: shortcut.filter ? [shortcut.filter] : [],
            limit: 100
        });
    };

    return (
        <div className="shortcuts-container card">
            <div className="shortcuts-header" onClick={() => setShowShortcuts(!showShortcuts)}>
                <div className="shortcuts-title">
                    <Zap size={18} className="shortcuts-icon" />
                    <span>Quick Analysis Shortcuts</span>
                </div>
                {showShortcuts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {showShortcuts && (
                <div className="shortcuts-grid animate-fade-in">
                    {shortcuts.map(shortcut => (
                        <button
                            key={shortcut.id}
                            className="shortcut-btn"
                            onClick={() => handleShortcutClick(shortcut)}
                            title={shortcut.description}
                        >
                            <div className="shortcut-name">{shortcut.name}</div>
                            <div className="shortcut-desc">{shortcut.description}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Shortcuts;

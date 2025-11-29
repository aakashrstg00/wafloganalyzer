import _ from 'lodash';

/**
 * Flattens a nested object into a single level object with dot notation keys.
 * Arrays are indexed.
 */
export const flattenObject = (obj, prefix = '', res = {}) => {
    if (_.isPlainObject(obj)) {
        _.forOwn(obj, (value, key) => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            flattenObject(value, newKey, res);
        });
    } else if (Array.isArray(obj) && obj.length > 0) {
        // For arrays of objects, we might want to expose them as indexed keys
        // But for log analysis, sometimes we just want the array itself or a summary.
        // Let's index them for now to allow precise access.
        obj.forEach((item, index) => {
            const newKey = prefix ? `${prefix}[${index}]` : `[${index}]`;
            flattenObject(item, newKey, res);
        });
    } else {
        res[prefix] = obj;
    }
    return res;
};

/**
 * Extract all unique paths (keys) from a list of objects.
 * Uses a sample to avoid performance hit on huge datasets, 
 * but for complete coverage we might need to scan all.
 */
export const getAllPaths = (logs, sampleSize = 5000) => {
    const paths = new Set();
    const totalLogs = logs.length;

    // If logs are fewer than sampleSize, scan all
    if (totalLogs <= sampleSize) {
        for (let i = 0; i < totalLogs; i++) {
            const flat = flattenObject(logs[i]);
            Object.keys(flat).forEach(key => paths.add(key));
        }
    } else {
        // Random sampling
        const indices = new Set();
        while (indices.size < sampleSize) {
            indices.add(Math.floor(Math.random() * totalLogs));
        }

        indices.forEach(index => {
            const flat = flattenObject(logs[index]);
            Object.keys(flat).forEach(key => paths.add(key));
        });
    }

    return Array.from(paths).sort();
};

/**
 * Enrich logs with extracted headers for easier access.
 */
export const enrichLogs = (logs, customHeaders = []) => {
    const defaultHeaders = ['host', 'user-agent', 'referer', 'x-forwarded-for'];
    const headersToExtract = [...defaultHeaders, ...customHeaders.map(h => h.toLowerCase())];

    return logs.map(log => {
        const newLog = { ...log };
        const headers = _.get(log, 'httpRequest.headers', []);

        if (Array.isArray(headers)) {
            const extractedHeaders = {};
            headers.forEach(h => {
                if (h.name && h.value) {
                    const name = h.name.toLowerCase();
                    if (headersToExtract.includes(name)) {
                        // Capitalize for display (or keep original casing if we knew it, but here we reconstruct)
                        // For custom headers, we might want to preserve the user's casing if possible, 
                        // but we only have the lowercase version in the list.
                        // Let's try to format it nicely.
                        const displayName = h.name; // Use the actual header name from the log
                        extractedHeaders[displayName] = h.value;
                    }
                }
            });

            if (Object.keys(extractedHeaders).length > 0) {
                newLog.header = extractedHeaders;
            }
        }
        return newLog;
    });
};

/**
 * Filter logs based on a set of filters.
 * Filters: [{ field, operator, value }]
 */
export const filterLogs = (logs, filters) => {
    if (!filters || filters.length === 0) return logs;

    return logs.filter(log => {
        return filters.every(filter => {
            const { field, operator, value } = filter;
            const logValue = _.get(log, field);

            // Handle undefined
            if (logValue === undefined) return false;

            const strLogValue = String(logValue).toLowerCase();
            const strValue = String(value).toLowerCase();

            switch (operator) {
                case 'equals':
                    return strLogValue === strValue;
                case 'contains':
                    return strLogValue.includes(strValue);
                case 'startsWith':
                    return strLogValue.startsWith(strValue);
                case 'endsWith':
                    return strLogValue.endsWith(strValue);
                case 'gt':
                    return Number(logValue) > Number(value);
                case 'lt':
                    return Number(logValue) < Number(value);
                case 'exists':
                    return logValue !== undefined && logValue !== null;
                default:
                    return true;
            }
        });
    });
};

/**
 * Group logs by a specific field.
 */
export const groupLogs = (logs, field) => {
    return _.groupBy(logs, (log) => _.get(log, field) || 'Undefined');
};

/**
 * Sort logs.
 */
export const sortLogs = (logs, field, direction = 'asc') => {
    return _.orderBy(logs, [(log) => _.get(log, field)], [direction]);
};

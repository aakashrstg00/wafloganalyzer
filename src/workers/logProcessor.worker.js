/* eslint-disable no-restricted-globals */
import { filterLogs, sortLogs, enrichLogs, getAllPaths } from '../utils/logHelpers';

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'PROCESS_LOGS':
            const { rawLogs, customHeaders } = payload;
            const enrichedLogs = enrichLogs(rawLogs, customHeaders);
            const paths = getAllPaths(enrichedLogs);
            self.postMessage({ type: 'LOGS_PROCESSED', payload: { logs: enrichedLogs, paths } });
            break;

        case 'FILTER_AND_SORT':
            const { logs, filters, sortConfig, timeRange } = payload;
            let result = filterLogs(logs, filters);

            // Apply time range filter (duplicating logic here or moving it to helper)
            if (timeRange && (timeRange.start || timeRange.end)) {
                result = result.filter(log => {
                    const timestamp = log.timestamp;
                    if (!timestamp) return true;

                    let ts = Number(timestamp);
                    if (ts < 10000000000) ts *= 1000;

                    if (timeRange.start) {
                        const startDateUTC = new Date(timeRange.start + 'Z');
                        if (ts < startDateUTC.getTime()) return false;
                    }

                    if (timeRange.end) {
                        const endDateUTC = new Date(timeRange.end + 'Z');
                        if (ts > endDateUTC.getTime()) return false;
                    }

                    return true;
                });
            }

            if (sortConfig && sortConfig.field) {
                result = sortLogs(result, sortConfig.field, sortConfig.direction);
            }

            self.postMessage({ type: 'FILTER_SORT_COMPLETE', payload: { logs: result } });
            break;

        default:
            break;
    }
};

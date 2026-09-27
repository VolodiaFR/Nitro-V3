const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "5d 12h 3m" — compact uptime display for the dashboard. We don't
 * use the existing `friendlyTime` helper because that one is tuned
 * for "how long ago" (past tense, single-unit), while uptime needs
 * multi-unit forward-looking output and to handle seconds-only
 * fresh-boot cases.
 */
export const formatUptime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '-';
    if (seconds < MINUTE) return `${Math.floor(seconds)}s`;

    const d = Math.floor(seconds / DAY);
    const h = Math.floor((seconds % DAY) / HOUR);
    const m = Math.floor((seconds % HOUR) / MINUTE);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;

    return `${m}m`;
};

/**
 * "5m ago", "2h ago", "3d ago" — past-tense relative formatter for
 * audit-log timestamps. Anything older than a day rolls to a fixed
 * date string so the log entries stay scannable even after a week.
 */
export const formatRelativePast = (timestampMs: number, nowMs: number = Date.now()): string => {
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) return '-';

    const deltaSeconds = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));

    if (deltaSeconds < 5) return 'now';
    if (deltaSeconds < MINUTE) return `${deltaSeconds}s ago`;
    if (deltaSeconds < HOUR) return `${Math.floor(deltaSeconds / MINUTE)}m ago`;
    if (deltaSeconds < DAY) return `${Math.floor(deltaSeconds / HOUR)}h ago`;
    if (deltaSeconds < 7 * DAY) return `${Math.floor(deltaSeconds / DAY)}d ago`;

    const date = new Date(timestampMs);

    return date.toISOString().slice(0, 10);
};

export const formatCompactNumber = (value: number): string => {
    if (!Number.isFinite(value)) return '-';

    const abs = Math.abs(value);

    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;

    return value.toString();
};

/**
 * Calendar date for a unix time in seconds, as the server sends it (account
 * creation, room creation). Zero or a missing value shows a dash.
 */
export const formatHousekeepingDate = (unixSeconds: number | null | undefined, locale?: string): string => {
    if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return '-';

    return new Date(unixSeconds * 1000).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Readable target of an audit entry. The server leaves the label empty and,
 * for room actions, keeps the room id only in the detail ("roomId=12 ...").
 */
export const resolveHousekeepingTarget = (entry: { targetLabel: string; targetId: number | null; detail: string }): string => {
    if (entry.targetLabel) return entry.targetLabel;
    if (entry.targetId) return `#${entry.targetId}`;

    const roomId = /(?:^|\s)roomId=(\d+)/.exec(entry.detail || '');

    return roomId ? `#${roomId[1]}` : '-';
};

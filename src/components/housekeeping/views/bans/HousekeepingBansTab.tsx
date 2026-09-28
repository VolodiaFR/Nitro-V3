import { FC, useEffect, useState } from 'react';
import { FaBan, FaExternalLinkAlt, FaSync, FaUndo } from 'react-icons/fa';
import { formatHousekeepingListCell, HousekeepingApi, HousekeepingTabId, IHousekeepingList, LocalizeText } from '../../../../api';
import { useHousekeeping, useHousekeepingConfirm } from '../../../../hooks';
import { HousekeepingButton, HousekeepingEmptyState, HousekeepingPill } from '../common/HousekeepingParts';

const BANS_LIST = 'hotel.bans';

/** Bans still in force, newest first, each with a jump to the user and a revoke. */
export const HousekeepingBansTab: FC = () => {
    const { unbanUser, isActionPending, lookupUserById, setActiveTab } = useHousekeeping();
    const confirm = useHousekeepingConfirm();
    const [list, setList] = useState<IHousekeepingList | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setIsLoading(true);
        setError(null);

        HousekeepingApi.requestList(BANS_LIST, 0, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;

                setList(result);
                setError(result.ok ? null : result.message || 'housekeeping.list.failed');
            })
            .catch(() => {
                if (!controller.signal.aborted) setError('housekeeping.list.failed');
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });

        return () => controller.abort();
    }, [reload]);

    const column = (name: string) => list?.columns.indexOf(name) ?? -1;
    const cell = (row: string[], name: string) => {
        const index = column(name);

        return index >= 0 ? row[index] : '';
    };

    const openUser = (userId: number) => {
        setActiveTab(HousekeepingTabId.USERS);
        lookupUserById(userId);
    };

    const revoke = (userId: number, username: string) =>
        confirm(LocalizeText('housekeeping.bans.revoke.confirm', ['username'], [username || `#${userId}`]), async () => {
            await unbanUser(userId);
            setReload((value) => value + 1);
        });

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
                <FaBan className="text-rose-500" size={12} />
                <span className="text-xs font-bold text-zinc-700">{LocalizeText('housekeeping.bans.title')}</span>
                {list && <HousekeepingPill>{list.rows.length}</HousekeepingPill>}
                <HousekeepingButton
                    classNames={['ml-auto']}
                    disabled={isLoading}
                    gap={1}
                    size="sm"
                    variant="secondary"
                    onClick={() => setReload((value) => value + 1)}
                >
                    <FaSync className={isLoading ? 'animate-spin' : ''} size={9} />
                    <span>{LocalizeText('housekeeping.history.refresh')}</span>
                </HousekeepingButton>
            </div>

            {error && <HousekeepingEmptyState>{LocalizeText(error)}</HousekeepingEmptyState>}
            {!error && !list && isLoading && <HousekeepingEmptyState>{LocalizeText('generic.loading')}</HousekeepingEmptyState>}
            {!error && list && list.rows.length === 0 && <HousekeepingEmptyState>{LocalizeText('housekeeping.bans.empty')}</HousekeepingEmptyState>}

            {!error &&
                list?.rows.map((row, index) => {
                    const userId = parseInt(cell(row, 'id')) || 0;
                    const username = cell(row, 'user');

                    return (
                        <div key={`${userId}-${index}`} className="flex flex-col gap-1 rounded border border-rose-200 bg-white p-2 text-[11px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-zinc-800">{username || `#${userId}`}</span>
                                <HousekeepingPill tone="danger">{cell(row, 'type')}</HousekeepingPill>
                                <span className="text-zinc-500">
                                    {LocalizeText('housekeeping.bans.until', ['date'], [formatHousekeepingListCell('expires', cell(row, 'expires'))])}
                                </span>
                                <div className="ml-auto flex items-center gap-1">
                                    {userId > 0 && (
                                        <button
                                            className="p-0.5 text-zinc-400 hover:text-sky-600"
                                            title={LocalizeText('housekeeping.audit.detail.open_user')}
                                            type="button"
                                            onClick={() => openUser(userId)}
                                        >
                                            <FaExternalLinkAlt size={9} />
                                        </button>
                                    )}
                                    {userId > 0 && (
                                        <HousekeepingButton
                                            disabled={isActionPending}
                                            gap={1}
                                            size="sm"
                                            variant="success"
                                            onClick={() => revoke(userId, username)}
                                        >
                                            <FaUndo size={9} />
                                            <span>{LocalizeText('housekeeping.action.unban')}</span>
                                        </HousekeepingButton>
                                    )}
                                </div>
                            </div>
                            <div className="break-words text-zinc-700">{cell(row, 'reason') || '-'}</div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500">
                                <span>
                                    {LocalizeText('housekeeping.list.column.staff')}: {cell(row, 'staff') || '-'}
                                </span>
                                <span>
                                    {LocalizeText('housekeeping.list.column.time')}: {formatHousekeepingListCell('time', cell(row, 'time'))}
                                </span>
                                {cell(row, 'ip') && <span>IP: {cell(row, 'ip')}</span>}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
};

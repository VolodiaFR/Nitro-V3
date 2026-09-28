import { FC, useEffect, useState } from 'react';
import { FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import { formatHousekeepingListCell, HousekeepingApi, housekeepingFailureKey, HousekeepingTabId, IHousekeepingList, LocalizeText } from '../../../../api';
import { useHousekeepingStore } from '../../../../hooks';
import { HousekeepingButton, HousekeepingEmptyState } from './HousekeepingParts';
import { HousekeepingSubTabs } from './HousekeepingSubTabs';

export interface HousekeepingListChoice {
    key: string;
    labelKey: string;
}

/** Columns that point at another user or room the operator can jump to. */
const USER_ID_COLUMN = 'id';
const ROOM_ID_COLUMN = 'room_id';

/**
 * A server list (chat, visits, same-IP accounts, ...) as a table, with a choice
 * of lists on top. Rows that name a user or a room open it in the panel.
 */
export const HousekeepingListView: FC<{ lists: HousekeepingListChoice[]; targetId: number }> = ({ lists, targetId }) => {
    const { lookupUserById, lookupRoomById, setActiveTab } = useHousekeepingStore();
    const [listKey, setListKey] = useState(lists[0]?.key ?? '');
    const [list, setList] = useState<IHousekeepingList | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        if (!listKey || targetId <= 0) return;

        const controller = new AbortController();

        setIsLoading(true);
        setError(null);

        HousekeepingApi.requestList(listKey, targetId, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;

                setList(result);
                setError(result.ok ? null : result.message || 'housekeeping.list.failed');
            })
            .catch((reason) => {
                if (!controller.signal.aborted) setError(housekeepingFailureKey(reason, 'housekeeping.list.failed'));
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });

        return () => controller.abort();
    }, [listKey, targetId, reload]);

    const shown = list && list.listKey === listKey && list.targetId === targetId ? list : null;
    const userColumn = shown ? shown.columns.indexOf(USER_ID_COLUMN) : -1;
    const roomColumn = shown ? shown.columns.indexOf(ROOM_ID_COLUMN) : -1;

    const openRow = (row: string[]) => {
        const userId = userColumn >= 0 ? parseInt(row[userColumn]) : 0;
        const roomId = roomColumn >= 0 ? parseInt(row[roomColumn]) : 0;

        if (userId > 0) {
            setActiveTab(HousekeepingTabId.USERS);
            lookupUserById(userId);
        } else if (roomId > 0) {
            setActiveTab(HousekeepingTabId.ROOMS);
            lookupRoomById(roomId);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1">
                <HousekeepingSubTabs
                    compact
                    active={listKey}
                    tabs={lists.map((choice) => ({ id: choice.key, label: LocalizeText(choice.labelKey) }))}
                    onChange={setListKey}
                />
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
            {!error && isLoading && !shown && <HousekeepingEmptyState>{LocalizeText('generic.loading')}</HousekeepingEmptyState>}
            {!error && shown && shown.rows.length === 0 && <HousekeepingEmptyState>{LocalizeText('housekeeping.list.empty')}</HousekeepingEmptyState>}

            {!error && shown && shown.rows.length > 0 && (
                <div className="max-h-[300px] overflow-auto rounded border border-zinc-200 bg-white">
                    <table className="w-full border-collapse text-[11px]">
                        <thead className="sticky top-0 bg-zinc-100">
                            <tr>
                                {shown.columns.map((column) => (
                                    <th
                                        key={column}
                                        className="whitespace-nowrap px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-600"
                                    >
                                        {LocalizeText(`housekeeping.list.column.${column}`)}
                                    </th>
                                ))}
                                {(userColumn >= 0 || roomColumn >= 0) && <th className="w-6" />}
                            </tr>
                        </thead>
                        <tbody>
                            {shown.rows.map((row, index) => (
                                <tr key={index} className="border-t border-zinc-100 align-top hover:bg-sky-50/50">
                                    {shown.columns.map((column, columnIndex) => (
                                        <td
                                            key={column}
                                            className={`px-1.5 py-0.5 ${column === 'message' || column === 'reason' ? 'break-words' : 'whitespace-nowrap'} text-zinc-800`}
                                        >
                                            {formatHousekeepingListCell(column, row[columnIndex])}
                                        </td>
                                    ))}
                                    {(userColumn >= 0 || roomColumn >= 0) && (
                                        <td className="px-1 py-0.5">
                                            <button
                                                className="text-zinc-400 hover:text-sky-600"
                                                title={LocalizeText(
                                                    userColumn >= 0 ? 'housekeeping.audit.detail.open_user' : 'housekeeping.audit.detail.open_room'
                                                )}
                                                type="button"
                                                onClick={() => openRow(row)}
                                            >
                                                <FaExternalLinkAlt size={9} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

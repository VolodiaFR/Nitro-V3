import { IWiredVariableHolder, WiredVariableHoldersPageComposer, WiredVariableHoldersPageEvent } from '@octane/renderer';
import { useEffect, useRef, useState } from 'react';
import { localizeWithFallback, SendMessageComposer } from '../../api';
import { GetUserProfile } from '../../api/user/GetUserProfile';
import { Button, DraggableWindowPosition, OctaneCardContentView, OctaneCardHeaderView, OctaneCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';
import { useWiredPageRequests } from '../../hooks/wired-tools/useWiredPageRequests';
import { VariableManageEntry, VariablesElementType } from './WiredCreatorTools.types';
import { WiredPagedTable, WiredTableCell, WiredTableColumn } from './WiredPagedTable';
import { calculateLastPage, NO_PAGE } from './WiredPaging.helpers';

/** Holders per page, as the official overview shows them. */
export const WIRED_VARIABLE_OWNERS_PAGE_SIZE = 50;
/** Above the server's own 250 ms limit on the page request. */
const REQUEST_PAGE_RATELIMIT = 300;

/** The server's holder kinds (`entityType`). */
export const HOLDER_TYPE_ROOM = 0;
export const HOLDER_TYPE_USER = 1;
export const HOLDER_TYPE_FURNI = 2;

/** The server's `userTypeFilter` values. */
const USER_FILTER_ALL = 0;
const USER_FILTER_IN_ROOM = 1;
/** The server's `sortTypeFilter` values; -1 keeps the natural order. */
const SORT_NONE = -1;
const SORT_VALUE_ASCENDING = 0;
const SORT_VALUE_DESCENDING = 1;
const SORT_NAME = 2;

/** The variable id the server keys the page on: the target prefix plus the definition item id. */
export const wiredVariableIdOf = (variablesType: VariablesElementType, itemId: number): string => {
    switch (variablesType) {
        case 'user':
            return `user:${itemId}`;
        case 'furni':
            return `furni:${itemId}`;
        case 'context':
            return `ctx:${itemId}`;
        default:
            return `room:${itemId}`;
    }
};

interface HoldersPage {
    variableId: string;
    totalEntries: number;
    currentPage: number;
    elements: IWiredVariableHolder[];
    userTypeFilter: number;
    sortTypeFilter: number;
}

export interface WiredHolderDescription {
    categoryLabel: string;
    entityName: string;
}

export interface WiredVariableOwnersViewProps {
    variableId: string;
    variableName: string;
    variablesType: VariablesElementType;
    hasValue: boolean;
    /** The room's own knowledge of a holder (Habbo / Bot / Pet, floor / wall furni), when it is in the room. */
    describeHolder: (entityType: number, entityId: number, entityName: string) => WiredHolderDescription;
    onManage: (entry: VariableManageEntry) => void;
    onClose: () => void;
}

/**
 * Who holds a wired variable, a page of 50 at a time from the server: user type, name (a link
 * to a user's profile), creation and last update time, value, and "manage", which opens the
 * holder in the detail panel. The user type and sort menus ask for page 1 again; every page that
 * arrives puts its own filters back into the menus.
 */
export const WiredVariableOwnersView = (props: WiredVariableOwnersViewProps) => {
    const { variableId, variableName, variablesType, hasValue, describeHolder, onManage, onClose } = props;
    const [page, setPage] = useState<HoldersPage | null>(null);
    const [userType, setUserType] = useState(USER_FILTER_ALL);
    const [sortType, setSortType] = useState(SORT_NONE);
    const [scrollKey, setScrollKey] = useState(0);
    const nextFilters = useRef<{ userTypeFilter: number; sortTypeFilter: number } | null>(null);

    useMessageEvent<WiredVariableHoldersPageEvent>(WiredVariableHoldersPageEvent, (event) => {
        const parser = event.getParser();

        if (parser.variableId !== variableId) return;

        setPage({
            variableId: parser.variableId,
            totalEntries: parser.totalEntries,
            currentPage: parser.currentPage,
            elements: [...parser.elements],
            userTypeFilter: parser.userTypeFilter,
            sortTypeFilter: parser.sortTypeFilter
        });
        setUserType(parser.userTypeFilter);
        setSortType(parser.sortTypeFilter);
        setScrollKey((key) => key + 1);
    });

    const currentPage = page?.currentPage ?? NO_PAGE;
    const lastPage = page ? calculateLastPage(page.totalEntries, WIRED_VARIABLE_OWNERS_PAGE_SIZE) : NO_PAGE;

    const requests = useWiredPageRequests({
        currentPage,
        lastPage,
        pageKey: page,
        ratelimit: REQUEST_PAGE_RATELIMIT,
        onRequestPage: (requested) => {
            const filters = nextFilters.current ?? {
                userTypeFilter: page?.userTypeFilter ?? USER_FILTER_ALL,
                sortTypeFilter: page?.sortTypeFilter ?? SORT_NONE
            };

            SendMessageComposer(
                new WiredVariableHoldersPageComposer(variableId, requested, WIRED_VARIABLE_OWNERS_PAGE_SIZE, filters.userTypeFilter, filters.sortTypeFilter)
            );
        }
    });

    // The first page of a new variable, unfiltered.
    useEffect(() => {
        setPage(null);
        SendMessageComposer(new WiredVariableHoldersPageComposer(variableId, 1, WIRED_VARIABLE_OWNERS_PAGE_SIZE, USER_FILTER_ALL, SORT_NONE));
    }, [variableId]);

    const changeFilters = (nextUserType: number, nextSortType: number) => {
        if (!requests.canRequestNewPage(false)) return;

        nextFilters.current = { userTypeFilter: nextUserType, sortTypeFilter: nextSortType };
        requests.requestPage(1);
        nextFilters.current = null;
    };

    const toManageEntry = (holder: IWiredVariableHolder): VariableManageEntry => {
        const description = describeHolder(holder.entityType, holder.entityId, holder.entityName);

        return {
            categoryLabel: description.categoryLabel,
            entityId: holder.entityId,
            entityName: description.entityName,
            createdAt: Math.floor(holder.storage.creationTime / 1000),
            updatedAt: Math.floor(holder.storage.lastUpdateTime / 1000),
            value: hasValue ? holder.storage.value : null,
            manageLabel: localizeWithFallback('wiredmenu.variable_management.manage', 'Manage')
        };
    };

    const typeHeader = (() => {
        switch (variablesType) {
            case 'furni':
                return localizeWithFallback('wiredmenu.variable_management.col.furnitype', 'Furni type');
            case 'global':
                return localizeWithFallback('wiredmenu.variable_management.col.scope', 'Scope');
            default:
                return localizeWithFallback('wiredmenu.variable_management.col.usertype', 'User type');
        }
    })();

    const columns: WiredTableColumn[] = [
        { id: 'type', title: typeHeader, className: 'w-[90px]' },
        { id: 'name', title: localizeWithFallback('wiredmenu.variable_management.col.name', 'Name'), className: 'w-[160px]' },
        { id: 'creation_time', title: localizeWithFallback('wiredmenu.variable_management.col.creation_time', 'Creation time'), className: 'w-[150px]' },
        { id: 'last_update_time', title: localizeWithFallback('wiredmenu.variable_management.col.last_update_time', 'Last update time'), className: 'w-[150px]' },
        { id: 'value', title: localizeWithFallback('wiredmenu.variable_management.col.value', 'Value'), className: 'w-[110px]' },
        { id: 'manage', title: localizeWithFallback('wiredmenu.variable_management.col.manage', 'Manage') }
    ];

    const noValueLabel = hasValue ? '/' : localizeWithFallback('wiredmenu.variable_management.no_value', 'Not supported');

    const getCell = (holder: IWiredVariableHolder, columnId: string): WiredTableCell => {
        const description = describeHolder(holder.entityType, holder.entityId, holder.entityName);

        switch (columnId) {
            case 'type':
                return { content: description.categoryLabel };
            case 'name':
                return holder.entityType === HOLDER_TYPE_USER
                    ? {
                          content: (
                              <button className="text-[#1b57b2] underline underline-offset-2" type="button" onClick={() => GetUserProfile(holder.entityId)}>
                                  {description.entityName}
                              </button>
                          ),
                          title: description.entityName
                      }
                    : { content: description.entityName, title: description.entityName };
            case 'creation_time':
                return { content: holder.storage.creationTimeStr || '/', className: 'tabular-nums' };
            case 'last_update_time':
                return { content: holder.storage.lastUpdateTimeStr || '/', className: 'tabular-nums' };
            case 'value':
                return { content: hasValue ? String(holder.storage.value) : noValueLabel, className: 'tabular-nums' };
            default:
                return {
                    content: (
                        <button className="text-[#1b57b2] underline underline-offset-2" type="button" onClick={() => onManage(toManageEntry(holder))}>
                            {localizeWithFallback('wiredmenu.variable_management.manage', 'Manage')}
                        </button>
                    )
                };
        }
    };

    return (
        <OctaneCardView
            className="min-w-[860px] max-w-[860px] max-h-[620px]"
            theme="primary-slim"
            uniqueKey="wired-variable-management"
            windowPosition={DraggableWindowPosition.TOP_LEFT}
            offsetLeft={540}
            offsetTop={60}
        >
            <OctaneCardHeaderView headerText={localizeWithFallback('wiredmenu.variable_management.title', 'Variable Management')} onCloseClick={onClose} />
            <OctaneCardContentView className="text-black bg-[#f4efe3] p-3 flex flex-col gap-3" overflow="hidden">
                <div className="rounded border border-[#c8c2b2] bg-white p-3 flex items-center justify-between gap-3">
                    <div className="grow flex flex-col items-center text-center">
                        <Text>
                            {localizeWithFallback(
                                'wiredmenu.variable_management.info',
                                'This is a tool to manage everyone and everything that holds this variable, in the room or not.'
                            )}
                        </Text>
                        <Text>
                            <b>{localizeWithFallback('wiredmenu.variable_management.variable_name', 'Variable name')}:</b> {variableName}
                        </Text>
                    </div>
                    <Button variant="secondary" onClick={() => requests.refresh()}>
                        {localizeWithFallback('wiredmenu.variable_management.refresh', 'Refresh')}
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[12px]">
                    {variablesType === 'user' && (
                        <label className="flex items-center gap-2">
                            <Text>{localizeWithFallback('wiredmenu.variable_management.usertype', 'User type')}:</Text>
                            <select
                                className="rounded border border-[#b8b2a4] bg-white px-2 py-[2px] text-[12px]"
                                value={userType}
                                onChange={(event) => {
                                    const next = Number(event.target.value);

                                    setUserType(next);
                                    changeFilters(next, sortType);
                                }}
                            >
                                <option value={USER_FILTER_ALL}>{localizeWithFallback('wiredmenu.variable_management.usertype.all', 'All')}</option>
                                <option value={USER_FILTER_IN_ROOM}>{localizeWithFallback('wiredmenu.variable_management.usertype.in_room', 'In the room')}</option>
                            </select>
                        </label>
                    )}
                    <label className="flex items-center gap-2">
                        <Text>{localizeWithFallback('wiredmenu.variable_management.sort_by', 'Sort by')}:</Text>
                        <select
                            className="rounded border border-[#b8b2a4] bg-white px-2 py-[2px] text-[12px]"
                            value={sortType}
                            onChange={(event) => {
                                const next = Number(event.target.value);

                                setSortType(next);
                                changeFilters(userType, next);
                            }}
                        >
                            <option value={SORT_NONE}>{localizeWithFallback('wiredmenu.variable_management.sort_by.none', 'Default order')}</option>
                            <option value={SORT_VALUE_DESCENDING}>{localizeWithFallback('wiredmenu.variable_management.sort_by.highest', 'Highest value')}</option>
                            <option value={SORT_VALUE_ASCENDING}>{localizeWithFallback('wiredmenu.variable_management.sort_by.lowest', 'Lowest value')}</option>
                            <option value={SORT_NAME}>{localizeWithFallback('wiredmenu.variable_management.sort_by.name', 'Name')}</option>
                        </select>
                    </label>
                </div>
                <WiredPagedTable
                    columns={columns}
                    rows={page?.elements ?? []}
                    getRowId={(holder) => `${holder.entityType}-${holder.entityId}`}
                    getCell={getCell}
                    currentPage={currentPage}
                    totalEntries={page?.totalEntries ?? 0}
                    lastPage={lastPage}
                    requests={requests}
                    emptyText={localizeWithFallback('wiredmenu.variable_management.empty', 'Nobody holds this variable with the current filters')}
                    scrollResetKey={scrollKey}
                    bodyClassName="h-[360px]"
                />
            </OctaneCardContentView>
        </OctaneCardView>
    );
};

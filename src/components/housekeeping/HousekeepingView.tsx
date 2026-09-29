import { AddLinkEventTracker, ILinkEventTracker, RemoveLinkEventTracker } from '@octane/renderer';
import { FC, useEffect, useMemo } from 'react';
import {
    getHousekeepingMode,
    HK_TICKET_STATE_OPEN,
    HousekeepingTabId,
    HousekeepingUserSection,
    isHousekeepingEnabled,
    isHousekeepingTabAvailable,
    LocalizeText
} from '../../api';
import { DraggableWindowPosition, OctaneCardContentView, OctaneCardHeaderView, OctaneCardView, WidgetErrorBoundary } from '../../common';
import { useHasPermission, useHousekeepingStore, useModTools } from '../../hooks';
import { HousekeepingDangerConfirmView } from './HousekeepingDangerConfirmView';
import { HousekeepingPasswordReveal } from './HousekeepingPasswordReveal';
import { HousekeepingStatusBanner } from './HousekeepingStatusBanner';
import { HousekeepingAuditTab } from './views/audit/HousekeepingAuditTab';
import { HousekeepingBansTab } from './views/bans/HousekeepingBansTab';
import { HousekeepingDashboardTab } from './views/dashboard/HousekeepingDashboardTab';
import { HousekeepingHotelTab } from './views/hotel/HousekeepingHotelTab';
import { HousekeepingLiveTab } from './views/live/HousekeepingLiveTab';
import { HousekeepingPermissionsTab } from './views/permissions/HousekeepingPermissionsTab';
import { HousekeepingRoomsTab } from './views/rooms/HousekeepingRoomsTab';
import { HousekeepingNavGroup, HousekeepingSidebar } from './views/shell/HousekeepingSidebar';
import { HousekeepingSoundboardTab } from './views/soundboard/HousekeepingSoundboardTab';
import { HousekeepingSupportTab } from './views/support/HousekeepingSupportTab';
import { HousekeepingUsersTab } from './views/users/HousekeepingUsersTab';

const TAB_IDS: HousekeepingTabId[] = Object.values(HousekeepingTabId);

const isHkTabId = (value: string): value is HousekeepingTabId => (TAB_IDS as string[]).includes(value);

const decodeSegment = (segment: string | undefined): string => {
    try {
        return decodeURIComponent(segment || '');
    } catch {
        return segment || '';
    }
};

export const HousekeepingView: FC = () => {
    const {
        isVisible,
        setIsVisible,
        togglePanel,
        activeTab,
        setActiveTab,
        setUserSection,
        closePanel,
        lookupUserById,
        lookupRoomById,
        seedUserFromAvatar,
        selectedUserIds
    } = useHousekeepingStore();
    // Gate behind a dedicated HK permission so the panel stays hidden
    // for plain users/mods on servers that haven't granted it. Reactive
    // — promote/demote takes effect on the next render without a relog.
    const isHk = useHasPermission('acc_housekeeping');
    const canManageSoundboard = useHasPermission('acc_soundboard_manage');
    // Two-layer config gate on top of the permission:
    //   - `housekeeping.enabled` (boolean, default false): master kill
    //     switch for the whole module
    //   - `housekeeping.mode` ("light" | "full", default "full"):
    //     "light" exposes only Users + Rooms (essential moderation)
    // Config is read after `await GetConfiguration().init()` in
    // bootstrap.ts, so by the time React mounts we're reading a
    // populated value — no Suspense needed.
    const hkEnabled = useMemo(() => isHousekeepingEnabled(), []);
    const hkMode = useMemo(() => getHousekeepingMode(), []);
    // Tickets waiting for someone, shown on the Support entry.
    const { tickets = [] } = useModTools();
    const openTickets = tickets.filter((ticket) => ticket.state === HK_TICKET_STATE_OPEN).length;

    useEffect(() => {
        // Economy moved into the user page; the old tab id lands there.
        const openTab = (tab: HousekeepingTabId) => {
            if (tab === HousekeepingTabId.ECONOMY) {
                setUserSection(HousekeepingUserSection.ECONOMY);
                setActiveTab(HousekeepingTabId.USERS);

                return;
            }

            setActiveTab(tab);
        };

        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) => {
                const parts = url.split('/');

                if (parts.length < 2) return;

                switch (parts[1]) {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        closePanel();
                        return;
                    case 'toggle':
                        togglePanel();
                        return;
                    case 'tab': {
                        const candidate = parts[2] ?? '';
                        const canOpenCandidate = candidate !== HousekeepingTabId.SOUNDBOARD || canManageSoundboard;

                        if (isHkTabId(candidate) && canOpenCandidate && isHousekeepingTabAvailable(candidate, getHousekeepingMode())) {
                            openTab(candidate);
                            setIsVisible(true);
                        }
                        return;
                    }
                    case 'user': {
                        // housekeeping/user/<id>[/<name>/<figure>] — the optional,
                        // URI-encoded name and figure paint the card at once while
                        // the find-by-id packet fills in the rest.
                        const userId = parseInt(parts[2] ?? '');

                        if (!Number.isFinite(userId) || userId <= 0) return;

                        setActiveTab(HousekeepingTabId.USERS);
                        setIsVisible(true);

                        if (parts.length > 4) seedUserFromAvatar(userId, decodeSegment(parts[3]), decodeSegment(parts[4]));

                        lookupUserById(userId);
                        return;
                    }
                    case 'room': {
                        // housekeeping/room/<id> — opens the room page on that room.
                        const roomId = parseInt(parts[2] ?? '');

                        if (!Number.isFinite(roomId) || roomId <= 0) return;

                        setActiveTab(HousekeepingTabId.ROOMS);
                        setIsVisible(true);
                        lookupRoomById(roomId);
                        return;
                    }
                }
            },
            eventUrlPrefix: 'housekeeping/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [setIsVisible, togglePanel, closePanel, setActiveTab, setUserSection, lookupUserById, lookupRoomById, seedUserFromAvatar, canManageSoundboard]);

    // When the panel is gated off (perm revoked mid-session, or
    // `housekeeping.enabled` is false) make sure it isn't left visible.
    useEffect(() => {
        if ((!isHk || !hkEnabled) && isVisible) closePanel();
    }, [isHk, hkEnabled, isVisible, closePanel]);

    // Bounce a stored tab that is no longer reachable: the old economy tab,
    // Soundboard without its permission, or a full-mode tab in light mode.
    useEffect(() => {
        if (activeTab === HousekeepingTabId.ECONOMY) {
            setUserSection(HousekeepingUserSection.ECONOMY);
            setActiveTab(HousekeepingTabId.USERS);

            return;
        }

        const soundboardDenied = activeTab === HousekeepingTabId.SOUNDBOARD && !canManageSoundboard;

        if (soundboardDenied || !isHousekeepingTabAvailable(activeTab, hkMode)) setActiveTab(HousekeepingTabId.USERS);
    }, [activeTab, hkMode, canManageSoundboard, setActiveTab, setUserSection]);

    const navGroups = useMemo<HousekeepingNavGroup[]>(() => {
        const available = (id: HousekeepingTabId) => isHousekeepingTabAvailable(id, hkMode) && (id !== HousekeepingTabId.SOUNDBOARD || canManageSoundboard);
        const groups: HousekeepingNavGroup[] = [
            {
                titleKey: 'housekeeping.nav.overview',
                items: [
                    { id: HousekeepingTabId.DASHBOARD, icon: 'icon-housekeeping', labelKey: 'housekeeping.tab.dashboard' },
                    { id: HousekeepingTabId.LIVE, icon: 'icon-progression', labelKey: 'housekeeping.tab.live' }
                ]
            },
            {
                titleKey: 'housekeeping.nav.moderation',
                items: [
                    { id: HousekeepingTabId.USERS, icon: 'icon-friendall', labelKey: 'housekeeping.tab.users', count: selectedUserIds.length },
                    { id: HousekeepingTabId.ROOMS, icon: 'icon-rooms', labelKey: 'housekeeping.tab.rooms' },
                    { id: HousekeepingTabId.SUPPORT, icon: 'icon-help', labelKey: 'housekeeping.tab.support', count: openTickets },
                    { id: HousekeepingTabId.BANS, icon: 'icon-modtools', labelKey: 'housekeeping.tab.bans' },
                    { id: HousekeepingTabId.AUDIT, icon: 'icon-message', labelKey: 'housekeeping.tab.audit' }
                ]
            },
            {
                titleKey: 'housekeeping.nav.hotel',
                items: [
                    { id: HousekeepingTabId.HOTEL, icon: 'icon-catalog', labelKey: 'housekeeping.tab.hotel' },
                    { id: HousekeepingTabId.PERMISSIONS, icon: 'icon-cog', labelKey: 'housekeeping.tab.permissions' }
                ]
            },
            {
                titleKey: 'housekeeping.nav.content',
                items: [{ id: HousekeepingTabId.SOUNDBOARD, icon: 'icon-soundboard', labelKey: 'housekeeping.tab.soundboard' }]
            }
        ];

        return groups.map((group) => ({ ...group, items: group.items.filter((item) => available(item.id)) }));
    }, [hkMode, canManageSoundboard, selectedUserIds.length, openTickets]);

    const activeView = useMemo(() => {
        switch (activeTab) {
            case HousekeepingTabId.LIVE:
                return <HousekeepingLiveTab />;
            case HousekeepingTabId.ROOMS:
                return <HousekeepingRoomsTab />;
            case HousekeepingTabId.SUPPORT:
                return <HousekeepingSupportTab />;
            case HousekeepingTabId.BANS:
                return <HousekeepingBansTab />;
            case HousekeepingTabId.AUDIT:
                return <HousekeepingAuditTab />;
            case HousekeepingTabId.HOTEL:
                return <HousekeepingHotelTab />;
            case HousekeepingTabId.PERMISSIONS:
                return <HousekeepingPermissionsTab />;
            case HousekeepingTabId.SOUNDBOARD:
                return canManageSoundboard ? <HousekeepingSoundboardTab /> : <HousekeepingUsersTab />;
            case HousekeepingTabId.USERS:
            case HousekeepingTabId.ECONOMY:
                return <HousekeepingUsersTab />;
            case HousekeepingTabId.DASHBOARD:
            default:
                return <HousekeepingDashboardTab />;
        }
    }, [activeTab, canManageSoundboard]);

    if (!hkEnabled || !isHk || !isVisible) return null;

    const isLight = hkMode === 'light';
    const headerSuffix = isLight ? ` · ${LocalizeText('housekeeping.mode.light')}` : '';
    // Light mode has two sections and less to show, so the window stays narrower.
    const sizeClass = isLight ? 'w-[640px]' : 'w-[860px]';

    return (
        <WidgetErrorBoundary name="HousekeepingView">
            <OctaneCardView
                className={`octane-housekeeping ${sizeClass} h-[620px] max-h-[92vh] max-w-[96vw]`}
                theme="primary-slim"
                uniqueKey="housekeeping"
                windowPosition={DraggableWindowPosition.TOP_CENTER}
            >
                <OctaneCardHeaderView headerText={`${LocalizeText('housekeeping.title')}${headerSuffix}`} onCloseClick={() => closePanel()} />
                <div className="relative flex min-h-0 grow text-black">
                    <HousekeepingSidebar active={activeTab} groups={navGroups} onSelect={setActiveTab} />
                    <div className="flex min-w-0 grow flex-col">
                        <HousekeepingStatusBanner />
                        <HousekeepingPasswordReveal />
                        <OctaneCardContentView className="min-h-0 grow text-black" gap={2}>
                            {activeView}
                        </OctaneCardContentView>
                    </div>
                    <HousekeepingDangerConfirmView />
                </div>
            </OctaneCardView>
        </WidgetErrorBoundary>
    );
};

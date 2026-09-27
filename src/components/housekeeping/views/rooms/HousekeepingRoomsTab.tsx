import { FC, useState } from 'react';
import {
    FaCalendarAlt,
    FaCrown,
    FaDoorOpen,
    FaEyeSlash,
    FaExchangeAlt,
    FaHome,
    FaKey,
    FaLock,
    FaMapMarkerAlt,
    FaSearch,
    FaTags,
    FaTimes,
    FaTrash,
    FaUserSlash,
    FaUsers,
    FaVolumeMute
} from 'react-icons/fa';
import { formatHousekeepingDate, IHousekeepingRoom, LocalizeText } from '../../../../api';
import { Button } from '../../../../common';
import { useHousekeeping, useHousekeepingConfirm, useNavigatorData, useRoom } from '../../../../hooks';
import { HousekeepingEmptyState, HousekeepingFact, HousekeepingNumberField, HousekeepingPill, HousekeepingSection } from '../common/HousekeepingParts';
import { HousekeepingRoomSettingsForm } from './HousekeepingRoomSettingsForm';

const DEFAULT_MUTE_MINUTES = 10;

/** Remount key for the settings form: a new server snapshot resets its draft. */
const settingsKey = (room: IHousekeepingRoom) => JSON.stringify([room.id, room.name, room.description, room.maxUsers, room.settings]);

const RoomStatePill: FC<{ room: IHousekeepingRoom }> = ({ room }) => {
    const state = room.settings?.state ?? (room.isLocked ? 1 : 0);

    switch (state) {
        case 1:
            return (
                <HousekeepingPill icon={<FaLock size={8} />} tone="danger">
                    {LocalizeText('housekeeping.room.state.locked')}
                </HousekeepingPill>
            );
        case 2:
            return (
                <HousekeepingPill icon={<FaKey size={8} />} tone="warning">
                    {LocalizeText('housekeeping.room.state.password')}
                </HousekeepingPill>
            );
        case 3:
            return (
                <HousekeepingPill icon={<FaEyeSlash size={8} />} tone="neutral">
                    {LocalizeText('housekeeping.room.state.invisible')}
                </HousekeepingPill>
            );
        default:
            return (
                <HousekeepingPill icon={<FaDoorOpen size={8} />} tone="success">
                    {LocalizeText('housekeeping.room.state.open')}
                </HousekeepingPill>
            );
    }
};

export const HousekeepingRoomsTab: FC = () => {
    const {
        selectedRoom,
        setSelectedRoom,
        lookupRoomById,
        isRoomLoading,
        isActionPending,
        openRoom,
        closeRoom,
        saveRoomSettings,
        muteRoom,
        kickAllFromRoom,
        transferRoomOwnership,
        deleteRoom
    } = useHousekeeping();
    const { roomSession = null } = useRoom();
    const { categories = null } = useNavigatorData();
    const [query, setQuery] = useState('');
    const [muteMinutes, setMuteMinutes] = useState<number>(DEFAULT_MUTE_MINUTES);
    const [newOwnerId, setNewOwnerId] = useState<number>(0);
    const confirm = useHousekeepingConfirm();
    const currentRoomId = roomSession && roomSession.roomId > 0 ? roomSession.roomId : 0;

    const submitLookup = () => {
        const idFromQuery = parseInt(query.trim());
        const id = Number.isFinite(idFromQuery) && idFromQuery > 0 ? idFromQuery : currentRoomId;

        if (id > 0) lookupRoomById(id);
    };

    const useCurrentRoom = () => {
        if (currentRoomId <= 0) return;

        setQuery(String(currentRoomId));
        lookupRoomById(currentRoomId);
    };

    const disableActions = !selectedRoom || isActionPending;
    const confirmAndRun = (key: string, fn: () => void) => confirm(LocalizeText(key), fn);
    const occupancyPct = selectedRoom && selectedRoom.maxUsers > 0 ? Math.min(100, Math.round((selectedRoom.userCount / selectedRoom.maxUsers) * 100)) : 0;
    const categoryName = (() => {
        const id = selectedRoom?.settings?.categoryId ?? 0;
        const category = id > 0 ? categories?.find((entry) => entry.id === id) : null;

        return category ? LocalizeText(category.name) : id > 0 ? `#${id}` : '-';
    })();

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
                <div className="flex grow items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 shadow-sm focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-300">
                    <FaSearch className="shrink-0 text-zinc-400" size={11} />
                    <input
                        className="grow bg-transparent text-sm outline-none placeholder:italic placeholder:text-zinc-500"
                        min={1}
                        placeholder={LocalizeText('housekeeping.room.search.placeholder')}
                        type="number"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') submitLookup();
                        }}
                    />
                </div>
                {currentRoomId > 0 && currentRoomId !== selectedRoom?.id && (
                    <Button
                        disabled={isRoomLoading}
                        gap={1}
                        title={LocalizeText('housekeeping.room.here.title', ['id'], [String(currentRoomId)])}
                        variant="secondary"
                        onClick={useCurrentRoom}
                    >
                        <FaMapMarkerAlt className="text-sky-500" size={10} />
                        <span>{LocalizeText('housekeeping.room.here')}</span>
                    </Button>
                )}
                <Button disabled={isRoomLoading} gap={1} onClick={submitLookup}>
                    <FaSearch className={isRoomLoading ? 'animate-pulse' : ''} size={10} />
                    <span>{LocalizeText('housekeeping.room.search.button')}</span>
                </Button>
            </div>

            {!selectedRoom && <HousekeepingEmptyState icon={<FaHome size={14} />}>{LocalizeText('housekeeping.room.none')}</HousekeepingEmptyState>}

            {selectedRoom && (
                <>
                    <div className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-2.5 shadow-sm">
                        <div className="flex items-start gap-2.5">
                            <div className="flex shrink-0 items-center justify-center rounded-full bg-sky-100 p-2">
                                <span className="octane-icon octane-icon-hk-hero icon-rooms" />
                            </div>
                            <div className="min-w-0 grow">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-base font-bold">{selectedRoom.name}</span>
                                    <span className="text-[10px] tabular-nums text-zinc-500">#{selectedRoom.id}</span>
                                    <RoomStatePill room={selectedRoom} />
                                    {selectedRoom.isPublic && <HousekeepingPill tone="info">{LocalizeText('housekeeping.room.public')}</HousekeepingPill>}
                                    {selectedRoom.isMuted && (
                                        <HousekeepingPill icon={<FaVolumeMute size={8} />} tone="warning">
                                            {LocalizeText('housekeeping.room.muted')}
                                        </HousekeepingPill>
                                    )}
                                </div>
                                <div className="mt-0.5 line-clamp-2 text-xs text-zinc-600">
                                    {selectedRoom.description || LocalizeText('housekeeping.room.no_description')}
                                </div>
                            </div>
                            <button
                                className="p-1 text-zinc-400 transition-colors hover:text-rose-600"
                                title={LocalizeText('housekeeping.room.clear')}
                                onClick={() => setSelectedRoom(null)}
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-1">
                            <HousekeepingFact
                                icon={<FaUsers size={8} />}
                                label={LocalizeText('housekeeping.room.fact.users')}
                                value={`${selectedRoom.userCount} / ${selectedRoom.maxUsers}`}
                            />
                            <HousekeepingFact
                                icon={<FaCrown className="text-amber-500" size={8} />}
                                label={LocalizeText('housekeeping.room.fact.owner')}
                                title={`#${selectedRoom.ownerId}`}
                                value={selectedRoom.ownerName || `#${selectedRoom.ownerId}`}
                            />
                            <HousekeepingFact label={LocalizeText('navigator.category')} value={categoryName} />
                            <HousekeepingFact
                                icon={<FaCalendarAlt size={8} />}
                                label={LocalizeText('housekeeping.room.fact.created')}
                                value={formatHousekeepingDate(selectedRoom.createdAt)}
                            />
                        </div>
                        {selectedRoom.maxUsers > 0 && (
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-100">
                                <div
                                    className={`h-full transition-all ${occupancyPct > 85 ? 'bg-rose-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${occupancyPct}%` }}
                                />
                            </div>
                        )}
                        {!!selectedRoom.settings?.tags.length && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <FaTags className="text-zinc-400" size={9} />
                                {selectedRoom.settings.tags.map((tag) => (
                                    <HousekeepingPill key={tag}>{tag}</HousekeepingPill>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedRoom.settings ? (
                        <HousekeepingRoomSettingsForm
                            key={settingsKey(selectedRoom)}
                            disabled={isActionPending}
                            room={selectedRoom}
                            onSave={(input) => saveRoomSettings(selectedRoom.id, input)}
                        />
                    ) : (
                        <HousekeepingEmptyState>{LocalizeText('housekeeping.room.settings.unavailable')}</HousekeepingEmptyState>
                    )}
                </>
            )}

            {selectedRoom && (
                <HousekeepingSection title={LocalizeText('housekeeping.room.section.actions')} tone="neutral">
                    <div className="grid grid-cols-2 gap-1.5">
                        {selectedRoom.isLocked ? (
                            <Button classNames={['col-span-2']} disabled={disableActions} gap={1} variant="success" onClick={() => openRoom(selectedRoom.id)}>
                                <FaDoorOpen size={10} />
                                <span>{LocalizeText('housekeeping.room.open')}</span>
                            </Button>
                        ) : (
                            <Button classNames={['col-span-2']} disabled={disableActions} gap={1} variant="danger" onClick={() => closeRoom(selectedRoom.id)}>
                                <FaLock size={10} />
                                <span>{LocalizeText('housekeeping.room.close')}</span>
                            </Button>
                        )}
                        <div className="col-span-2 flex items-center gap-1.5">
                            <FaVolumeMute className="text-amber-600" size={11} />
                            <HousekeepingNumberField unit={LocalizeText('housekeeping.unit.minutes')} value={muteMinutes} onChange={setMuteMinutes} />
                            <Button
                                classNames={['grow']}
                                disabled={disableActions}
                                gap={1}
                                variant="warning"
                                onClick={() => muteRoom(selectedRoom.id, muteMinutes)}
                            >
                                <span>{LocalizeText('housekeeping.room.mute_min', ['m'], [String(muteMinutes)])}</span>
                            </Button>
                        </div>
                        <Button
                            disabled={disableActions}
                            gap={1}
                            variant="warning"
                            onClick={() => confirmAndRun('housekeeping.room.kick_all.confirm', () => kickAllFromRoom(selectedRoom.id))}
                        >
                            <FaUserSlash size={10} />
                            <span>{LocalizeText('housekeeping.room.kick_all')}</span>
                        </Button>
                        <Button
                            disabled={disableActions}
                            gap={1}
                            variant="danger"
                            onClick={() => confirmAndRun('housekeeping.room.delete.confirm', () => deleteRoom(selectedRoom.id))}
                        >
                            <FaTrash size={10} />
                            <span>{LocalizeText('housekeeping.room.delete')}</span>
                        </Button>
                    </div>
                </HousekeepingSection>
            )}

            {selectedRoom && (
                <HousekeepingSection
                    icon={<FaExchangeAlt className="text-violet-500" size={8} />}
                    title={LocalizeText('housekeeping.room.transfer.label')}
                    tone="accent"
                >
                    <div className="flex items-center gap-1.5">
                        <HousekeepingNumberField
                            label={LocalizeText('housekeeping.room.transfer.new_owner')}
                            value={newOwnerId}
                            widthClass="w-20"
                            onChange={setNewOwnerId}
                        />
                        <Button
                            classNames={['grow']}
                            disabled={disableActions || !newOwnerId}
                            gap={1}
                            variant="primary"
                            onClick={() => transferRoomOwnership(selectedRoom.id, newOwnerId)}
                        >
                            <FaExchangeAlt size={10} />
                            <span>{LocalizeText('housekeeping.room.transfer')}</span>
                        </Button>
                    </div>
                </HousekeepingSection>
            )}
        </div>
    );
};

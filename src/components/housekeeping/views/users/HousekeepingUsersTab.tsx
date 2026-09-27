import { FC, useEffect, useRef, useState } from 'react';
import {
    FaBan,
    FaBolt,
    FaCircle,
    FaEnvelope,
    FaGavel,
    FaKey,
    FaLock,
    FaPlug,
    FaSearch,
    FaTimes,
    FaUndo,
    FaUserShield,
    FaUserSlash,
    FaVolumeMute
} from 'react-icons/fa';
import { findTemplateById, HK_SANCTION_TEMPLATES, HousekeepingSanctionType, LocalizeText } from '../../../../api';
import { Button } from '../../../../common';
import { useHousekeeping, useHousekeepingConfirm, useRoomUserListSnapshot } from '../../../../hooks';
import { HOUSEKEEPING_INPUT_CLASS, HousekeepingEmptyState, HousekeepingField, HousekeepingNumberField, HousekeepingSection } from '../common/HousekeepingParts';
import { HousekeepingUserCard } from './HousekeepingUserCard';

const DEFAULT_BAN_HOURS = 18;
const DEFAULT_MUTE_MINUTES = 60;
const DEFAULT_TRADE_LOCK_HOURS = 168;
const BULK_CONFIRM_THRESHOLD = 5;

export const HousekeepingUsersTab: FC = () => {
    const {
        selectedUser,
        setSelectedUser,
        lookupUserByName,
        lookupUserById,
        isUserLoading,
        isActionPending,
        banUser,
        unbanUser,
        kickUser,
        muteUser,
        forceDisconnectUser,
        resetUserPassword,
        setUserRank,
        tradeLockUser,
        userSuggestions,
        requestUserSuggestions,
        recentLookups,
        kickFromCurrentRoom,
        banFromCurrentRoom,
        muteInCurrentRoom,
        selectedUserIds,
        toggleUserSelection,
        clearUserSelection,
        banUsersBulk,
        kickUsersBulk,
        muteUsersBulk
    } = useHousekeeping();
    const confirm = useHousekeepingConfirm();
    const roomUsers = useRoomUserListSnapshot();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [reason, setReason] = useState('');
    const [banHours, setBanHours] = useState<number>(DEFAULT_BAN_HOURS);
    const [muteMinutes, setMuteMinutes] = useState<number>(DEFAULT_MUTE_MINUTES);
    const [tradeLockHours, setTradeLockHours] = useState<number>(DEFAULT_TRADE_LOCK_HOURS);
    const [rankDraft, setRankDraft] = useState<number>(1);
    const [templateId, setTemplateId] = useState<string>('');
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
        },
        []
    );

    useEffect(() => {
        requestUserSuggestions(query);
    }, [query, requestUserSuggestions]);

    const submitLookup = () => {
        const trimmed = query.trim();

        if (!trimmed.length) return;

        lookupUserByName(trimmed);
        setIsFocused(false);
    };

    const recentUsers = recentLookups.filter((entry) => entry.kind === 'user').slice(0, 5);
    const showSuggestionPanel = isFocused && (userSuggestions.length > 0 || (recentUsers.length > 0 && query.trim().length < 2));

    // The live shortcuts act through the room session, so they only make sense
    // while the target stands in the room the operator is in.
    const isInCurrentRoom = !!selectedUser && roomUsers.some((entry) => entry.webID === selectedUser.id);
    const disableActions = !selectedUser || isActionPending;
    const reasonOrDefault = reason.trim().length ? reason.trim() : LocalizeText('housekeeping.reason.default');

    const applyTemplate = (id: string) => {
        setTemplateId(id);

        const template = findTemplateById(id);

        if (!template) return;

        setReason(template.defaultReason);

        if (template.type === HousekeepingSanctionType.BAN) setBanHours(template.durationValue);
        if (template.type === HousekeepingSanctionType.MUTE) setMuteMinutes(template.durationValue);
        if (template.type === HousekeepingSanctionType.TRADE_LOCK) setTradeLockHours(template.durationValue);
    };

    const runBulkWithGate = (actionLabel: string, runner: () => void) => {
        if (selectedUserIds.length === 0) return;

        if (selectedUserIds.length >= BULK_CONFIRM_THRESHOLD) {
            confirm(LocalizeText('housekeeping.bulk.confirm', ['action', 'count'], [actionLabel, String(selectedUserIds.length)]), runner);

            return;
        }

        runner();
    };

    const bulkBan = () =>
        runBulkWithGate(LocalizeText('housekeeping.action.ban_h', ['h'], [String(banHours)]), () => banUsersBulk(selectedUserIds, reasonOrDefault, banHours));
    const bulkKick = () => runBulkWithGate(LocalizeText('housekeeping.action.kick'), () => kickUsersBulk(selectedUserIds, reasonOrDefault));
    const bulkMute = () =>
        runBulkWithGate(LocalizeText('housekeeping.action.mute_min', ['m'], [String(muteMinutes)]), () =>
            muteUsersBulk(selectedUserIds, reasonOrDefault, muteMinutes)
        );

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <div className="flex items-center gap-1.5">
                    <div className="flex grow items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 shadow-sm focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-300">
                        <FaSearch className="shrink-0 text-zinc-400" size={11} />
                        <input
                            className="grow bg-transparent text-sm outline-none placeholder:italic placeholder:text-zinc-500"
                            placeholder={LocalizeText('housekeeping.user.search.placeholder')}
                            value={query}
                            onBlur={() => {
                                if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                                blurTimerRef.current = setTimeout(() => setIsFocused(false), 120);
                            }}
                            onChange={(event) => setQuery(event.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') submitLookup();
                                if (event.key === 'Escape') setIsFocused(false);
                            }}
                        />
                    </div>
                    <Button disabled={isUserLoading} gap={1} onClick={submitLookup}>
                        <FaSearch className={isUserLoading ? 'animate-pulse' : ''} size={10} />
                        <span>{LocalizeText('housekeeping.user.search.button')}</span>
                    </Button>
                </div>
                {showSuggestionPanel && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[200px] overflow-y-auto rounded border border-zinc-200 bg-white shadow-lg">
                        {userSuggestions.length > 0
                            ? userSuggestions.map((entry) => {
                                  const isChecked = selectedUserIds.includes(entry.id);

                                  return (
                                      <div
                                          key={entry.id}
                                          className="flex w-full items-center gap-2 border-b border-zinc-100 px-2 py-1 text-xs last:border-b-0 hover:bg-sky-50"
                                          onMouseDown={(event) => event.preventDefault()}
                                      >
                                          <input
                                              checked={isChecked}
                                              className="shrink-0"
                                              title={isChecked ? LocalizeText('housekeeping.bulk.clear') : LocalizeText('housekeeping.bulk.apply')}
                                              type="checkbox"
                                              onChange={() => toggleUserSelection(entry.id)}
                                          />
                                          <button
                                              className="flex grow items-center gap-2 text-left"
                                              onClick={() => {
                                                  setQuery(entry.username);
                                                  setIsFocused(false);
                                                  lookupUserById(entry.id);
                                              }}
                                          >
                                              <FaCircle className={entry.online ? 'text-emerald-500' : 'text-zinc-400'} size={6} />
                                              <span className="grow truncate font-medium">{entry.username}</span>
                                              <span className="shrink-0 text-[10px] text-zinc-500">
                                                  #{entry.id} · {entry.rank}
                                              </span>
                                          </button>
                                      </div>
                                  );
                              })
                            : recentUsers.map((entry) => (
                                  <button
                                      key={entry.id}
                                      className="flex w-full items-center gap-2 border-b border-zinc-100 px-2 py-1 text-left text-xs last:border-b-0 hover:bg-sky-50"
                                      onClick={() => {
                                          setQuery(entry.label);
                                          setIsFocused(false);
                                          lookupUserById(entry.id);
                                      }}
                                      onMouseDown={(event) => event.preventDefault()}
                                  >
                                      <span className="shrink-0 text-[10px] uppercase text-zinc-400">{LocalizeText('housekeeping.user.recent')}</span>
                                      <span className="grow truncate font-medium">{entry.label}</span>
                                      <span className="shrink-0 text-[10px] text-zinc-500">#{entry.id}</span>
                                  </button>
                              ))}
                    </div>
                )}
            </div>

            {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 rounded border border-sky-300 bg-sky-50 p-1.5">
                    <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                        {LocalizeText('housekeeping.bulk.label', ['count'], [String(selectedUserIds.length)])}
                    </span>
                    <Button disabled={isActionPending} gap={1} size="sm" variant="danger" onClick={bulkBan}>
                        <FaBan size={10} />
                        <span>{LocalizeText('housekeeping.action.ban_h', ['h'], [String(banHours)])}</span>
                    </Button>
                    <Button disabled={isActionPending} gap={1} size="sm" variant="warning" onClick={bulkMute}>
                        <FaVolumeMute size={10} />
                        <span>{LocalizeText('housekeeping.action.mute_min', ['m'], [String(muteMinutes)])}</span>
                    </Button>
                    <Button disabled={isActionPending} gap={1} size="sm" variant="warning" onClick={bulkKick}>
                        <FaUserSlash size={10} />
                        <span>{LocalizeText('housekeeping.action.kick')}</span>
                    </Button>
                    <button
                        className="ml-auto px-1 text-zinc-500 hover:text-rose-600"
                        title={LocalizeText('housekeeping.bulk.clear')}
                        onClick={clearUserSelection}
                    >
                        <FaTimes size={10} />
                    </button>
                </div>
            )}

            {selectedUser ? (
                <HousekeepingUserCard user={selectedUser} onClear={() => setSelectedUser(null)} />
            ) : (
                <HousekeepingEmptyState icon={<FaUserSlash size={14} />}>{LocalizeText('housekeeping.user.none')}</HousekeepingEmptyState>
            )}

            {selectedUser && isInCurrentRoom && (
                <HousekeepingSection icon={<FaBolt className="text-amber-500" size={9} />} title={LocalizeText('housekeeping.user.live.label')} tone="warning">
                    <div className="flex flex-wrap items-center gap-1">
                        <Button disabled={isActionPending} size="sm" variant="warning" onClick={() => kickFromCurrentRoom(selectedUser.id)}>
                            {LocalizeText('housekeeping.user.live.kick')}
                        </Button>
                        <Button disabled={isActionPending} size="sm" variant="warning" onClick={() => muteInCurrentRoom(selectedUser.id, 2)}>
                            {LocalizeText('housekeeping.user.live.mute_2m')}
                        </Button>
                        <Button disabled={isActionPending} size="sm" variant="warning" onClick={() => muteInCurrentRoom(selectedUser.id, 10)}>
                            {LocalizeText('housekeeping.user.live.mute_10m')}
                        </Button>
                        <Button disabled={isActionPending} size="sm" variant="danger" onClick={() => banFromCurrentRoom(selectedUser.id, 'hour')}>
                            {LocalizeText('housekeeping.user.live.ban_h')}
                        </Button>
                        <Button disabled={isActionPending} size="sm" variant="danger" onClick={() => banFromCurrentRoom(selectedUser.id, 'day')}>
                            {LocalizeText('housekeeping.user.live.ban_d')}
                        </Button>
                    </div>
                </HousekeepingSection>
            )}

            {selectedUser && (
                <>
                    <HousekeepingSection icon={<FaGavel className="text-rose-500" size={9} />} title={LocalizeText('housekeeping.user.section.sanctions')}>
                        <HousekeepingField label={LocalizeText('housekeeping.field.template')}>
                            <select className={HOUSEKEEPING_INPUT_CLASS} value={templateId} onChange={(event) => applyTemplate(event.target.value)}>
                                <option value="">{LocalizeText('housekeeping.field.template.none')}</option>
                                {HK_SANCTION_TEMPLATES.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </HousekeepingField>
                        <HousekeepingField label={LocalizeText('housekeeping.field.reason')}>
                            <textarea
                                className={`${HOUSEKEEPING_INPUT_CLASS} min-h-[44px] resize-y`}
                                placeholder={LocalizeText('housekeeping.field.reason.placeholder')}
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                            />
                        </HousekeepingField>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex items-center gap-1">
                                <HousekeepingNumberField unit={LocalizeText('housekeeping.unit.hours')} value={banHours} onChange={setBanHours} />
                                <Button
                                    classNames={['grow']}
                                    disabled={disableActions}
                                    gap={1}
                                    variant="danger"
                                    onClick={() => banUser(selectedUser.id, reasonOrDefault, banHours)}
                                >
                                    <FaBan size={10} />
                                    <span>{LocalizeText('housekeeping.action.ban_h', ['h'], [String(banHours)])}</span>
                                </Button>
                            </div>
                            <div className="flex items-center gap-1">
                                <HousekeepingNumberField unit={LocalizeText('housekeeping.unit.minutes')} value={muteMinutes} onChange={setMuteMinutes} />
                                <Button
                                    classNames={['grow']}
                                    disabled={disableActions}
                                    gap={1}
                                    variant="warning"
                                    onClick={() => muteUser(selectedUser.id, reasonOrDefault, muteMinutes)}
                                >
                                    <FaVolumeMute size={10} />
                                    <span>{LocalizeText('housekeeping.action.mute_min', ['m'], [String(muteMinutes)])}</span>
                                </Button>
                            </div>
                            <div className="flex items-center gap-1">
                                <HousekeepingNumberField unit={LocalizeText('housekeeping.unit.hours')} value={tradeLockHours} onChange={setTradeLockHours} />
                                <Button
                                    classNames={['grow']}
                                    disabled={disableActions}
                                    gap={1}
                                    variant="warning"
                                    onClick={() => tradeLockUser(selectedUser.id, tradeLockHours, reasonOrDefault)}
                                >
                                    <FaLock size={10} />
                                    <span>{LocalizeText('housekeeping.action.trade_lock_h', ['h'], [String(tradeLockHours)])}</span>
                                </Button>
                            </div>
                            <Button disabled={disableActions} gap={1} variant="warning" onClick={() => kickUser(selectedUser.id, reasonOrDefault)}>
                                <FaUserSlash size={10} />
                                <span>{LocalizeText('housekeeping.action.kick')}</span>
                            </Button>
                            <Button disabled={disableActions || !selectedUser?.isBanned} gap={1} variant="success" onClick={() => unbanUser(selectedUser.id)}>
                                <FaUndo size={10} />
                                <span>{LocalizeText('housekeeping.action.unban')}</span>
                            </Button>
                            <Button
                                disabled={disableActions || !selectedUser?.online}
                                gap={1}
                                variant="danger"
                                onClick={() => forceDisconnectUser(selectedUser.id, reasonOrDefault)}
                            >
                                <FaPlug size={10} />
                                <span>{LocalizeText('housekeeping.action.force_disconnect')}</span>
                            </Button>
                        </div>
                    </HousekeepingSection>

                    <HousekeepingSection
                        icon={<FaUserShield className="text-violet-500" size={9} />}
                        title={LocalizeText('housekeeping.user.section.account')}
                        tone="accent"
                    >
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex items-center gap-1">
                                <HousekeepingNumberField label={LocalizeText('housekeeping.field.rank')} max={12} value={rankDraft} onChange={setRankDraft} />
                                <Button
                                    classNames={['grow']}
                                    disabled={disableActions}
                                    gap={1}
                                    variant="primary"
                                    onClick={() => setUserRank(selectedUser.id, rankDraft)}
                                >
                                    <FaUserShield size={10} />
                                    <span>{LocalizeText('housekeeping.action.set_rank')}</span>
                                </Button>
                            </div>
                            <Button
                                disabled={disableActions}
                                gap={1}
                                variant="secondary"
                                onClick={() => confirm(LocalizeText('housekeeping.action.reset_password.confirm'), () => resetUserPassword(selectedUser.id))}
                            >
                                <FaKey size={10} />
                                <span>{LocalizeText('housekeeping.action.reset_password')}</span>
                            </Button>
                        </div>
                    </HousekeepingSection>
                </>
            )}

            <div className="flex items-center gap-1 border-t border-zinc-200 pt-1 text-[10px] italic text-zinc-500">
                <FaEnvelope className="opacity-50" size={9} />
                {LocalizeText('housekeeping.user.audit_hint')}
            </div>
        </div>
    );
};

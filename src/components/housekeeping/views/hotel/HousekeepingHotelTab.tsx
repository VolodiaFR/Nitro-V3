import { FC, ReactNode, useState } from 'react';
import { FaBook, FaBullhorn, FaCog, FaCompass, FaCube, FaFilter, FaLanguage, FaSync, FaUserShield } from 'react-icons/fa';
import { formatHousekeepingDateTime, HOUSEKEEPING_RELOAD_TARGETS, HousekeepingReloadTarget, LocalizeText } from '../../../../api';
import { useHousekeeping, useHousekeepingConfirm } from '../../../../hooks';
import { HOUSEKEEPING_INPUT_CLASS, HousekeepingButton, HousekeepingSection } from '../common/HousekeepingParts';

const HOTEL_ALERT_CONFIRM_THRESHOLD = 200;
const HOTEL_ALERT_MAX = 1000;

const RELOAD_ICONS: Record<HousekeepingReloadTarget, ReactNode> = {
    catalog: <FaBook className="text-sky-600" size={11} />,
    texts: <FaLanguage className="text-violet-600" size={11} />,
    permissions: <FaUserShield className="text-rose-600" size={11} />,
    items: <FaCube className="text-amber-600" size={11} />,
    navigator: <FaCompass className="text-emerald-600" size={11} />,
    config: <FaCog className="text-zinc-600" size={11} />,
    wordfilter: <FaFilter className="text-orange-600" size={11} />
};

/** Hotel-wide tools: the hotel alert and the hot reload of the server tables. */
export const HousekeepingHotelTab: FC = () => {
    const { isActionPending, sendHotelAlert, reloadHotel } = useHousekeeping();
    const confirm = useHousekeepingConfirm();
    const [alertText, setAlertText] = useState('');
    const [reloadedAt, setReloadedAt] = useState<Partial<Record<HousekeepingReloadTarget, number>>>({});
    const trimmedAlert = alertText.trim();

    const send = () => {
        const dispatch = () => {
            sendHotelAlert(trimmedAlert);
            setAlertText('');
        };

        if (trimmedAlert.length >= HOTEL_ALERT_CONFIRM_THRESHOLD) {
            confirm(LocalizeText('housekeeping.hotel.alert.confirm', ['count'], [String(trimmedAlert.length)]), dispatch);

            return;
        }

        dispatch();
    };

    const reload = (target: HousekeepingReloadTarget) =>
        confirm(LocalizeText('housekeeping.hotel.reload.confirm', ['target'], [LocalizeText(`housekeeping.hotel.reload.${target}`)]), async () => {
            const result = await reloadHotel(target);

            if (result?.ok) setReloadedAt((previous) => ({ ...previous, [target]: Date.now() }));
        });

    return (
        <div className="flex flex-col gap-2">
            <HousekeepingSection icon={<FaBullhorn className="text-rose-500" size={9} />} title={LocalizeText('housekeeping.hotel.alert.label')} tone="danger">
                <textarea
                    className={`${HOUSEKEEPING_INPUT_CLASS} min-h-[90px] resize-y`}
                    maxLength={HOTEL_ALERT_MAX}
                    placeholder={LocalizeText('housekeeping.hotel.alert.placeholder')}
                    value={alertText}
                    onChange={(event) => setAlertText(event.target.value)}
                />
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] tabular-nums text-zinc-500">
                        {trimmedAlert.length}/{HOTEL_ALERT_MAX}
                    </span>
                    <HousekeepingButton classNames={['ml-auto']} disabled={isActionPending || !trimmedAlert.length} gap={1} variant="danger" onClick={send}>
                        <FaBullhorn size={10} />
                        <span>{LocalizeText('housekeeping.hotel.alert.send')}</span>
                    </HousekeepingButton>
                </div>
                {trimmedAlert.length > 0 && (
                    <div className="rounded border border-zinc-200 bg-white p-2 text-xs text-zinc-800">
                        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                            {LocalizeText('housekeeping.hotel.alert.preview')}
                        </div>
                        <div className="whitespace-pre-wrap break-words">{trimmedAlert}</div>
                    </div>
                )}
            </HousekeepingSection>
            <HousekeepingSection icon={<FaSync className="text-sky-600" size={9} />} title={LocalizeText('housekeeping.hotel.reload.label')} tone="accent">
                <div className="text-[10px] text-zinc-500">{LocalizeText('housekeeping.hotel.reload.hint')}</div>
                <div className="grid grid-cols-2 gap-1.5">
                    {HOUSEKEEPING_RELOAD_TARGETS.map((target) => (
                        <div key={target} className="flex min-w-0 items-center gap-1.5 rounded border border-zinc-200 bg-white px-1.5 py-1">
                            <span className="shrink-0">{RELOAD_ICONS[target]}</span>
                            <div className="flex min-w-0 grow flex-col">
                                <span className="truncate text-[11px] font-semibold text-zinc-800">{LocalizeText(`housekeeping.hotel.reload.${target}`)}</span>
                                <span className="truncate text-[9px] text-zinc-500" title={LocalizeText(`housekeeping.hotel.reload.${target}.hint`)}>
                                    {reloadedAt[target]
                                        ? LocalizeText('housekeeping.hotel.reload.done_at', ['time'], [formatHousekeepingDateTime(reloadedAt[target] ?? 0)])
                                        : LocalizeText(`housekeeping.hotel.reload.${target}.hint`)}
                                </span>
                            </div>
                            <HousekeepingButton disabled={isActionPending} gap={1} size="sm" variant="primary" onClick={() => reload(target)}>
                                <FaSync size={9} />
                                <span>{LocalizeText('housekeeping.hotel.reload.run')}</span>
                            </HousekeepingButton>
                        </div>
                    ))}
                </div>
            </HousekeepingSection>
        </div>
    );
};

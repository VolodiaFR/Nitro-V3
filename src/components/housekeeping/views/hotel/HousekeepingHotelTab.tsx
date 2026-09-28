import { FC, useState } from 'react';
import { FaBullhorn } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useHousekeeping, useHousekeepingConfirm } from '../../../../hooks';
import { HOUSEKEEPING_INPUT_CLASS, HousekeepingButton, HousekeepingSection } from '../common/HousekeepingParts';

const HOTEL_ALERT_CONFIRM_THRESHOLD = 200;
const HOTEL_ALERT_MAX = 1000;

/** Hotel-wide tools. Today the hotel alert; maintenance and the word filter belong here too. */
export const HousekeepingHotelTab: FC = () => {
    const { isActionPending, sendHotelAlert } = useHousekeeping();
    const confirm = useHousekeepingConfirm();
    const [alertText, setAlertText] = useState('');
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
        </div>
    );
};

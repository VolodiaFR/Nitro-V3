import { FC, useMemo } from 'react';
import { LocalizeText, NotificationAlertItem, OpenUrl } from '../../../../api';
import { Button, LayoutAvatarImageView, LayoutNotificationAlertView, LayoutNotificationAlertViewProps } from '../../../../common';

interface NotificationEventAlertViewProps extends LayoutNotificationAlertViewProps {
    item: NotificationAlertItem;
}

export const EVENT_ALERT_TYPES = ['hotel.event', 'hotel.event.ended'];

/**
 * Reads the placeholders the hotel event notification carries. The default layout
 * throws them away and renders one paragraph; the event card lays them out.
 */
export const getEventDetails = (item: NotificationAlertItem) => {
    const data = item.data;
    const closed = item.alertType === 'hotel.event.ended';
    const message = (data && data.get('MESSAGE')) || '';

    return {
        closed,
        look: (data && data.get('LOOK')) || '',
        username: (data && data.get('USERNAME')) || '',
        roomName: (data && data.get('ROOMNAME')) || '',
        time: (data && data.get('TIME')) || '',
        // The card owns the layout, so it shows the message on its own. Without the
        // placeholders - an older emulator, or a replayed notification - it falls
        // back to the paragraph the localised text produced.
        message: message.length ? message : item.messages.join(' ')
    };
};

export const NotificationEventAlertView: FC<NotificationEventAlertViewProps> = (props) => {
    const { item = null, title = (props.item && props.item.title) || '', onClose = null, classNames = [], ...rest } = props;

    const details = useMemo(() => getEventDetails(item), [item]);

    const visitUrl = () => {
        OpenUrl(item.clickUrl);

        onClose();
    };

    const subtitleKey = details.closed ? 'notification.hotel.event.ended.hostedBy' : 'notification.hotel.event.hostedBy';

    return (
        <LayoutNotificationAlertView
            title={title}
            onClose={onClose}
            classNames={['nitro-alert-hotel-event', ...classNames]}
            {...rest}
            type="hotel-event"
        >
            <div className="hotel-event-hero">
                <div className="hotel-event-hero-lights" />
                <div className="hotel-event-room">{details.roomName}</div>
                {(details.username.length > 0 || details.time.length > 0) && (
                    <div className="hotel-event-hosted-by">
                        {LocalizeText(subtitleKey, ['USERNAME', 'TIME'], [details.username, details.time])}
                    </div>
                )}
            </div>
            <div className="hotel-event-body">
                {details.look.length > 0 && (
                    <div className="hotel-event-avatar-wrap shrink-0">
                        <LayoutAvatarImageView figure={details.look} direction={2} classNames={['hotel-event-avatar']} />
                        <div className="hotel-event-avatar-shadow" />
                    </div>
                )}
                <div className="hotel-event-message">{details.message}</div>
            </div>
            <div className="hotel-event-actions">
                {item.clickUrl && item.clickUrl.length > 0 ? (
                    <Button className="hotel-event-visit" onClick={visitUrl}>
                        {LocalizeText(item.clickUrlText)}
                    </Button>
                ) : (
                    <Button onClick={onClose}>{LocalizeText('generic.close')}</Button>
                )}
            </div>
            {item.timeoutSeconds > 0 && (
                <div className="hotel-event-countdown">
                    <div className="hotel-event-countdown-bar" style={{ animationDuration: `${item.timeoutSeconds}s` }} />
                </div>
            )}
        </LayoutNotificationAlertView>
    );
};

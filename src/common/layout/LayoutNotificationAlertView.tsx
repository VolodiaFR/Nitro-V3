import { FC, useEffect, useMemo, useRef } from 'react';
import { NotificationAlertType } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView, NitroCardViewProps } from '../card';

export interface LayoutNotificationAlertViewProps extends NitroCardViewProps {
    title?: string;
    type?: string;
    /**
     * Seconds after which the alert closes on its own. Left out, it stays open
     * until the user dismisses it.
     */
    autoCloseSeconds?: number;
    onClose: () => void;
}

export const LayoutNotificationAlertView: FC<LayoutNotificationAlertViewProps> = (props) => {
    const { title = '', onClose = null, classNames = [], children = null, type = NotificationAlertType.DEFAULT, autoCloseSeconds = null, ...rest } = props;

    // Held in a ref so the countdown is not restarted every time the parent
    // hands down a fresh close callback - a second alert arriving must not give
    // the first one another full delay.
    const closeRef = useRef(onClose);

    closeRef.current = onClose;

    useEffect(() => {
        if (!autoCloseSeconds || autoCloseSeconds <= 0) return;

        const timeout = setTimeout(() => closeRef.current?.(), autoCloseSeconds * 1000);

        return () => clearTimeout(timeout);
    }, [autoCloseSeconds]);

    const getClassNames = useMemo(() => {
        const newClassNames: string[] = ['nitro-alert'];

        newClassNames.push('nitro-alert-' + type);

        if (classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [classNames, type]);

    return (
        <NitroCardView classNames={getClassNames} theme="primary-slim" {...rest}>
            <NitroCardHeaderView headerText={title} onCloseClick={onClose} />
            <NitroCardContentView grow className="text-black" gap={0} justifyContent="between" overflow="hidden">
                {children}
            </NitroCardContentView>
        </NitroCardView>
    );
};

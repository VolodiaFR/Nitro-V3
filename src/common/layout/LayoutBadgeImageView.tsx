import { BadgeImageReadyEvent, GetEventDispatcher, GetSessionDataManager, NitroSprite, TextureUtils } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GetConfigurationValue, LocalizeBadgeDescription, LocalizeBadgeName, LocalizeText } from '../../api';
import { Base, BaseProps } from '../Base';

export interface LayoutBadgeImageViewProps extends BaseProps<HTMLDivElement>
{
    badgeCode: string;
    isGroup?: boolean;
    showInfo?: boolean;
    customTitle?: string;
    isGrayscale?: boolean;
    scale?: number;
}

export const LayoutBadgeImageView: FC<LayoutBadgeImageViewProps> = props =>
{
    const { badgeCode = null, isGroup = false, showInfo = false, customTitle = null, isGrayscale = false, scale = 1, classNames = [], style = {}, children = null, ...rest } = props;
    const [ imageElement, setImageElement ] = useState<HTMLImageElement>(null);
    const [ tooltipPosition, setTooltipPosition ] = useState<{ top: number; left: number } | null>(null);
    const badgeRef = useRef<HTMLDivElement>(null);

    const tooltipsEnabled = showInfo && GetConfigurationValue<boolean>('badge.descriptions.enabled', true);

    const showTooltip = () =>
    {
        if(!tooltipsEnabled || !badgeRef.current) return;

        const rect = badgeRef.current.getBoundingClientRect();
        const tooltipWidth = 210;
        const gap = 10;
        let left = rect.left - tooltipWidth - gap;

        if(left < gap) left = rect.right + gap;

        setTooltipPosition({ top: rect.top, left });
    };

    const hideTooltip = () => setTooltipPosition(null);

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'relative w-[40px] h-[40px] bg-no-repeat bg-center' ];

        if(isGroup) newClassNames.push('group-badge');

        if(isGrayscale) newClassNames.push('grayscale');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames, isGroup, isGrayscale ]);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(imageElement)
        {
            newStyle.backgroundImage = `url(${ (isGroup) ? imageElement.src : GetConfigurationValue<string>('badge.asset.url').replace('%badgename%', badgeCode.toString()) })`;
            newStyle.width = imageElement.width;
            newStyle.height = imageElement.height;

            if(scale !== 1)
            {
                newStyle.transform = `scale(${ scale })`;

                if(!(scale % 1)) newStyle.imageRendering = 'pixelated';

                newStyle.width = (imageElement.width * scale);
                newStyle.height = (imageElement.height * scale);
            }
        }

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ badgeCode, isGroup, imageElement, scale, style ]);

    useEffect(() =>
    {
        if(!badgeCode || !badgeCode.length) return;

        let didSetBadge = false;

        const onBadgeImageReadyEvent = async (event: BadgeImageReadyEvent) =>
        {
            if(event.badgeId !== badgeCode) return;

            if(isGroup)
            {
                const element = await TextureUtils.generateImage(new NitroSprite(event.image));

                element.onload = () => setImageElement(element);
            }
            else
            {
                const badgeUrl = GetConfigurationValue<string>('badge.asset.url').replace('%badgename%', badgeCode.toString());
                const img = new Image();

                img.onload = () => setImageElement(img);
                img.src = badgeUrl;
            }

            didSetBadge = true;

            GetEventDispatcher().removeEventListener(BadgeImageReadyEvent.IMAGE_READY, onBadgeImageReadyEvent);
        };

        GetEventDispatcher().addEventListener(BadgeImageReadyEvent.IMAGE_READY, onBadgeImageReadyEvent);

        const texture = isGroup ? GetSessionDataManager().getGroupBadgeImage(badgeCode) : GetSessionDataManager().getBadgeImage(badgeCode);

        if(texture && !didSetBadge)
        {
            if(isGroup)
            {
                (async () =>
                {
                    const element = await TextureUtils.generateImage(new NitroSprite(texture));

                    element.onload = () => setImageElement(element);
                })();
            }
            else
            {
                const badgeUrl = GetConfigurationValue<string>('badge.asset.url').replace('%badgename%', badgeCode.toString());
                const img = new Image();

                img.onload = () => setImageElement(img);
                img.src = badgeUrl;
            }
        }

        return () => GetEventDispatcher().removeEventListener(BadgeImageReadyEvent.IMAGE_READY, onBadgeImageReadyEvent);
    }, [ badgeCode, isGroup ]);

    return (
        <Base
            innerRef={ badgeRef }
            classNames={ getClassNames }
            style={ getStyle }
            onMouseEnter={ tooltipsEnabled ? showTooltip : undefined }
            onMouseLeave={ tooltipsEnabled ? hideTooltip : undefined }
            { ...rest }>
            { tooltipsEnabled && tooltipPosition && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none select-none w-[210px] rounded-[.25rem] bg-[#fff] text-black py-1 px-2 small"
                    style={ { top: tooltipPosition.top, left: tooltipPosition.left } }>
                    <div className="font-bold mb-1">{ isGroup ? customTitle : LocalizeBadgeName(badgeCode) }</div>
                    <div>{ isGroup ? LocalizeText('group.badgepopup.body') : LocalizeBadgeDescription(badgeCode) }</div>
                </div>,
                document.body
            ) }
            { children }
        </Base>
    );
};

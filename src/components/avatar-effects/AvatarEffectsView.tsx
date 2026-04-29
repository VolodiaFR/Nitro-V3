import { AddLinkEventTracker, AvatarDirectionAngle, AvatarEffectActivatedComposer, GetConfiguration, GetSessionDataManager, ILinkEventTracker, RemoveLinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { LocalizeText, SendMessageComposer } from '../../api';
import { Button, Column, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { AvatarEffectPreviewView } from './AvatarEffectPreviewView';

interface EffectMapEntry
{
    id: string;
    lib: string;
    type: string;
    revision?: string | number;
}

const DEFAULT_DIRECTION = 4;

export const AvatarEffectsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ effects, setEffects ] = useState<EffectMapEntry[]>([]);
    const [ loadError, setLoadError ] = useState<string>(null);
    const [ selectedId, setSelectedId ] = useState<number>(0);
    const [ direction, setDirection ] = useState<number>(DEFAULT_DIRECTION);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':   setIsVisible(true); return;
                    case 'hide':   setIsVisible(false); return;
                    case 'toggle': setIsVisible(prev => !prev); return;
                }
            },
            eventUrlPrefix: 'avatar-effects/'
        };

        AddLinkEventTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!isVisible || effects.length || loadError) return;

        const url = GetConfiguration().getValue<string>('avatar.effectmap.url');
        if(!url)
        {
            setLoadError('Effect map URL is not configured.');
            return;
        }

        let cancelled = false;
        (async () =>
        {
            try
            {
                const response = await fetch(url);
                if(!response.ok) throw new Error(`HTTP ${ response.status }`);
                const json = await response.json();
                if(cancelled) return;

                const list: EffectMapEntry[] = Array.isArray(json?.effects)
                    ? json.effects.filter((e: EffectMapEntry) => e?.type === 'fx' && /^\d+$/.test(String(e.id)))
                    : [];

                list.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
                setEffects(list);
            }
            catch(error)
            {
                if(!cancelled) setLoadError(String((error as Error).message ?? error));
            }
        })();

        return () => { cancelled = true; };
    }, [ isVisible, effects.length, loadError ]);

    const session = GetSessionDataManager();
    const figure = session?.figure ?? '';
    const gender = session?.gender ?? 'M';

    const rotateFigure = useCallback((delta: number) =>
    {
        setDirection(prev =>
        {
            let next = prev + delta;
            if(next < AvatarDirectionAngle.MIN_DIRECTION) next = AvatarDirectionAngle.MAX_DIRECTION;
            if(next > AvatarDirectionAngle.MAX_DIRECTION) next = AvatarDirectionAngle.MIN_DIRECTION;
            return next;
        });
    }, []);

    const applySelectedEffect = useCallback(() =>
    {
        if(!selectedId) return;
        SendMessageComposer(new AvatarEffectActivatedComposer(selectedId));
        setIsVisible(false);
    }, [ selectedId ]);

    const onClose = useCallback(() => setIsVisible(false), []);

    if(!isVisible) return null;

    return (
        <NitroCardView className="nitro-avatar-effects w-[620px] h-[460px]" uniqueKey="avatar-effects" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('product.type.effect') || 'Avatar effect' } onCloseClick={ onClose } />
            <NitroCardContentView className="flex flex-row gap-3 text-black">
                <Column overflow="hidden" className="w-[220px] items-center justify-between">
                    <div className="figure-preview-container overflow-hidden relative w-full h-[280px] bg-black rounded-md">
                        <AvatarEffectPreviewView figure={ figure } gender={ gender } direction={ direction } effect={ selectedId } height={ 280 } zoom={ 2 } />
                        <div className="arrow-container absolute bottom-2 left-0 right-0 flex justify-between px-3 z-10">
                            <button type="button" className="text-white/80 hover:text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]" onClick={ () => rotateFigure(1) }><FaChevronLeft /></button>
                            <button type="button" className="text-white/80 hover:text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]" onClick={ () => rotateFigure(-1) }><FaChevronRight /></button>
                        </div>
                    </div>
                    <Button variant="success" disabled={ !selectedId } onClick={ applySelectedEffect } className="w-full mt-2">
                        { LocalizeText('inventory.effects.activate') || 'Use' }
                    </Button>
                </Column>
                <Column overflow="auto" className="flex-1 min-h-0">
                    { loadError && <div className="text-red-600 text-xs px-2 py-1">{ loadError }</div> }
                    { !loadError && !effects.length && <div className="text-xs px-2 py-1 opacity-70">{ LocalizeText('generic.loading') || 'Loading…' }</div> }
                    { !!effects.length &&
                        <div className="grid grid-cols-3 gap-2 p-1">
                            { effects.map(effect =>
                            {
                                const id = parseInt(effect.id, 10);
                                const isSelected = (id === selectedId);
                                return (
                                    <button
                                        key={ effect.id }
                                        type="button"
                                        onClick={ () => setSelectedId(id) }
                                        className={ `flex flex-col items-center justify-end h-[88px] px-1 py-1 rounded border text-[10px] truncate w-full ${ isSelected ? 'border-[#3a78c4] bg-[#cfe1f5]' : 'border-[#2a2a2a]/15 bg-[#f3f3f3] hover:bg-[#e7eef7]' }` }
                                        title={ effect.lib }
                                    >
                                        <span className="self-start opacity-60">#{ id }</span>
                                        <span className="truncate w-full text-center font-semibold">{ effect.lib }</span>
                                    </button>
                                );
                            }) }
                        </div>
                    }
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
};

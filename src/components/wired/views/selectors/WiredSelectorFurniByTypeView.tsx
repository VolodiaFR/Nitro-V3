import { FC, useCallback, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Button, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from '../actions/WiredActionBaseView';

const SOURCE_FURNI_PICKED   = 0;
const SOURCE_FURNI_SIGNAL   = 1;
const SOURCE_FURNI_TRIGGER  = 2;

const SOURCES = [
    { value: SOURCE_FURNI_PICKED,  label: 'wiredfurni.params.sources.furni.100' },
    { value: SOURCE_FURNI_SIGNAL,  label: 'wiredfurni.params.sources.furni.201' },
    { value: SOURCE_FURNI_TRIGGER, label: 'wiredfurni.params.sources.furni.0'   },
];

export const WiredSelectorFurniByTypeView: FC<{}> = () =>
{
    const [ sourceType,     setSourceType     ] = useState(SOURCE_FURNI_PICKED);
    const [ matchState,     setMatchState     ] = useState(false);
    const [ filterExisting, setFilterExisting ] = useState(false);
    const [ invert,         setInvert         ] = useState(false);

    const { trigger = null, furniIds = [], setIntParams, setSelectByType, setInvertSelection } = useWired();

    useEffect(() =>
    {
        if(!trigger) return;

        const p = trigger.intData;
        if(p.length >= 1) setSourceType(p[0]);
        if(p.length >= 2) setMatchState(p[1] === 1);
        if(p.length >= 3) setFilterExisting(p[2] === 1);
        if(p.length >= 4) setInvert(p[3] === 1);
    }, [ trigger ]);

    useEffect(() =>
    {
        setSelectByType(sourceType === SOURCE_FURNI_PICKED);
    }, [ sourceType, setSelectByType ]);

    useEffect(() =>
    {
        setInvertSelection(invert);
    }, [ invert, setInvertSelection ]);

    const save = useCallback(() =>
    {
        setIntParams([
            sourceType,
            matchState      ? 1 : 0,
            filterExisting  ? 1 : 0,
            invert          ? 1 : 0,
        ]);
    }, [ sourceType, matchState, filterExisting, invert, setIntParams ]);

    const sourceIndex = SOURCES.findIndex(s => s.value === sourceType);

    const prevSource = () =>
        setSourceType(SOURCES[(sourceIndex - 1 + SOURCES.length) % SOURCES.length].value);

    const nextSource = () =>
        setSourceType(SOURCES[(sourceIndex + 1) % SOURCES.length].value);

    const requiresFurni = sourceType === SOURCE_FURNI_PICKED
        ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID
        : WiredFurniType.STUFF_SELECTION_OPTION_NONE;

    const pickedCount = furniIds.length;
    const pickedLimit = trigger?.maximumItemSelectionCount ?? 20;

    return (
        <WiredActionBaseView hasSpecialInput={ true } requiresFurni={ requiresFurni } save={ save } hideDelay={ true } cardStyle={ { width: 400 } }>
            <div className="flex flex-col gap-2">

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={ matchState }
                        onChange={ e => setMatchState(e.target.checked) } />
                    <Text small>{ LocalizeText('wiredfurni.params.state_match') }</Text>
                </label>

                <hr className="m-0 bg-dark" />

                <Text bold>{ LocalizeText('wiredfurni.params.selector_options_selector') }</Text>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={ filterExisting }
                        onChange={ e => setFilterExisting(e.target.checked) } />
                    <Text small>{ LocalizeText('wiredfurni.params.selector_option.0') }</Text>
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        checked={ invert }
                        onChange={ e => setInvert(e.target.checked) } />
                    <Text small>{ LocalizeText('wiredfurni.params.selector_option.1') }</Text>
                </label>

                <hr className="m-0 bg-dark" />

                <Text bold>{ LocalizeText('wiredfurni.params.sources.furni.title') }</Text>

                <div className="flex items-center gap-2">
                    <Button variant="primary" className="px-2 py-1" onClick={ prevSource }>
                        <FaChevronLeft />
                    </Button>
                    <div className="flex flex-1 items-center justify-center">
                        <Text small>{ LocalizeText(SOURCES[sourceIndex >= 0 ? sourceIndex : 0].label) }</Text>
                    </div>
                    <Button variant="primary" className="px-2 py-1" onClick={ nextSource }>
                        <FaChevronRight />
                    </Button>
                </div>
            </div>
        </WiredActionBaseView>
    );
};

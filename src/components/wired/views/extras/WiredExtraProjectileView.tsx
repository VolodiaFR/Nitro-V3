import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
    clampProjectileParam,
    defaultProjectileParams,
    localizeWithFallback,
    normalizeProjectileParams,
    PROJECTILE_DISTANCE_FIXED,
    PROJECTILE_DISTANCE_NORMAL,
    PROJECTILE_DISTANCE_OVERSHOOT,
    PROJECTILE_INTERNAL_VARIABLES,
    PROJECTILE_PARAM_BUNNY_HOP,
    PROJECTILE_PARAM_CHANGE_SHOOTER_DIRECTION,
    PROJECTILE_PARAM_CURVE_STRENGTH,
    PROJECTILE_PARAM_DIRECTIONAL_SYSTEM,
    PROJECTILE_PARAM_DISTANCE_BY_HEIGHT,
    PROJECTILE_PARAM_DISTANCE_BY_X,
    PROJECTILE_PARAM_DISTANCE_BY_Y,
    PROJECTILE_PARAM_DISTANCE_MODE,
    PROJECTILE_PARAM_DISTANCE_TILES,
    PROJECTILE_PARAM_INTERNAL_VARIABLES,
    PROJECTILE_PARAM_ROTATE,
    PROJECTILE_PARAM_ROTATION_OFFSET,
    PROJECTILE_PARAM_SCALE_TIME_WITH_DISTANCE,
    PROJECTILE_PARAM_SPEED_INCREASE,
    PROJECTILE_PARAM_TIME_PER_TILE,
    WiredFurniType
} from '../../../../api';
import { Slider, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredFurniSelectorView } from '../WiredFurniSelectorView';
import { WiredExtraBaseView } from './WiredExtraBaseView';
import { WiredProjectileDirectionGrid } from './WiredProjectileDirectionGrid';


const DIRECTIONAL_SYSTEMS: Array<{ fallback: string; value: number }> = [
    { fallback: '8 directions, straight', value: 0 },
    { fallback: '8 directions, diffuse', value: 1 },
    { fallback: '4 directions, prefer vertical', value: 2 },
    { fallback: '4 directions, prefer horizontal', value: 3 }
];

const DISTANCE_MODES: Array<{ fallback: string; key: string; value: number }> = [
    { fallback: 'Fly to the target', key: 'normal', value: PROJECTILE_DISTANCE_NORMAL },
    { fallback: 'Fly past the target', key: 'overshoot', value: PROJECTILE_DISTANCE_OVERSHOOT },
    { fallback: 'Always fly the same distance', key: 'fixed', value: PROJECTILE_DISTANCE_FIXED }
];

const DISTANCE_AXES: Array<{ fallback: string; key: string; param: number }> = [
    { fallback: 'X', key: 'x', param: PROJECTILE_PARAM_DISTANCE_BY_X },
    { fallback: 'Y', key: 'y', param: PROJECTILE_PARAM_DISTANCE_BY_Y },
    { fallback: 'Height', key: 'height', param: PROJECTILE_PARAM_DISTANCE_BY_HEIGHT }
];

type SectionKey = 'info' | 'direction' | 'trajectory' | 'time' | 'rotation' | 'variables';

const INITIALLY_OPEN: Record<SectionKey, boolean> = {
    info: true,
    direction: true,
    trajectory: false,
    time: false,
    rotation: true,
    variables: false
};

const text = (key: string, fallback: string, parameters: string[] = null, replacements: string[] = null) =>
    localizeWithFallback(`wiredfurni.params.projectile.${key}`, fallback, parameters, replacements);

const ProjectileSection: FC<PropsWithChildren<{ title: string; open: boolean; first?: boolean; onToggle: () => void }>> = (props) => {
    const { title, open, first = false, onToggle, children } = props;

    return (
        <>
            {!first && <div className="octane-wired__divider" />}
            <div className="octane-wired__projectile-section">
                <button aria-expanded={open} className="octane-wired__projectile-section-header" type="button" onClick={onToggle}>
                    <Text bold>{title}</Text>
                    {open ? <FaChevronUp className="octane-wired__projectile-chevron" /> : <FaChevronDown className="octane-wired__projectile-chevron" />}
                </button>
                {open && <div className="octane-wired__projectile-section-body">{children}</div>}
            </div>
        </>
    );
};

const Checkbox: FC<{ checked: boolean; disabled?: boolean; label: string; onChange: (checked: boolean) => void }> = (props) => {
    const { checked, disabled = false, label, onChange } = props;

    return (
        <label className={`flex items-center gap-1 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
            <input checked={checked} className="form-check-input" disabled={disabled} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
            <Text small>{label}</Text>
        </label>
    );
};

const NumberField: FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
    <label className="flex items-center justify-between gap-2">
        <Text small>{label}</Text>
        <input
            className="form-control form-control-sm octane-wired__projectile-number"
            type="number"
            value={value}
            onChange={(event) => onChange(parseInt(event.target.value, 10))}
        />
    </label>
);

export const WiredExtraProjectileView: FC<{}> = () => {
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();
    const [params, setParams] = useState<number[]>(defaultProjectileParams);
    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(INITIALLY_OPEN);

    useEffect(() => {
        if (!trigger) return;

        setParams(normalizeProjectileParams(trigger.intData));
    }, [trigger]);

    const setParam = (index: number, value: number) =>
        setParams((current) => current.map((entry, position) => (position === index ? clampProjectileParam(index, value) : entry)));
    const setFlag = (index: number, checked: boolean) => setParam(index, checked ? 1 : 0);
    const toggleSection = (key: SectionKey) => setOpenSections((current) => ({ ...current, [key]: !current[key] }));

    const rotates = params[PROJECTILE_PARAM_ROTATE] === 1;
    const changesShooter = params[PROJECTILE_PARAM_CHANGE_SHOOTER_DIRECTION] === 1;
    const scalesTime = params[PROJECTILE_PARAM_SCALE_TIME_WITH_DISTANCE] === 1;
    const distanceMode = params[PROJECTILE_PARAM_DISTANCE_MODE];
    const rotationOffset = params[PROJECTILE_PARAM_ROTATION_OFFSET];
    const variablesMask = params[PROJECTILE_PARAM_INTERNAL_VARIABLES];

    const save = () => {
        setIntParams(normalizeProjectileParams(params));
        setStringParam('');
    };

    return (
        <WiredExtraBaseView
            footer={<WiredFurniSelectorView />}
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID}
            save={save}
            showSelection={false}
        >
            <div className="octane-wired__projectile">
                <ProjectileSection first open={openSections.info} title={text('info', 'Usage info:')} onToggle={() => toggleSection('info')}>
                    <Text small>
                        {text(
                            'info.desc',
                            'This box is meant for projectile furni. Use it to add extra features to a projectile that is already being moved by Wired.'
                        )}
                    </Text>
                </ProjectileSection>

                <ProjectileSection open={openSections.direction} title={text('direction', 'Projectile direction:')} onToggle={() => toggleSection('direction')}>
                    <Checkbox
                        checked={rotates}
                        label={text('rotate', 'Rotate the projectile in the moving direction')}
                        onChange={(checked) => setFlag(PROJECTILE_PARAM_ROTATE, checked)}
                    />
                    <div className="flex flex-col gap-1">
                        <Text small>{text('system', 'System:')}</Text>
                        <select
                            className="form-select form-select-sm"
                            disabled={!rotates}
                            value={params[PROJECTILE_PARAM_DIRECTIONAL_SYSTEM]}
                            onChange={(event) => setParam(PROJECTILE_PARAM_DIRECTIONAL_SYSTEM, parseInt(event.target.value, 10))}
                        >
                            {DIRECTIONAL_SYSTEMS.map((system) => (
                                <option key={system.value} value={system.value}>
                                    {text(`system.${system.value}`, system.fallback)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <WiredProjectileDirectionGrid disabled={!rotates} system={params[PROJECTILE_PARAM_DIRECTIONAL_SYSTEM]} />
                    <Checkbox
                        checked={changesShooter}
                        label={text('shooter', "Visually change the shooter's direction")}
                        onChange={(checked) => setFlag(PROJECTILE_PARAM_CHANGE_SHOOTER_DIRECTION, checked)}
                    />
                    <div className="octane-wired__projectile-indent">
                        <Checkbox
                            checked={params[PROJECTILE_PARAM_BUNNY_HOP] === 1}
                            disabled={!changesShooter}
                            label={text('bunny_hop', 'Do a little hop when shooting sideways')}
                            onChange={(checked) => setFlag(PROJECTILE_PARAM_BUNNY_HOP, checked)}
                        />
                    </div>
                </ProjectileSection>

                <ProjectileSection open={openSections.trajectory} title={text('trajectory', 'Animation trajectory:')} onToggle={() => toggleSection('trajectory')}>
                    <div className="flex flex-col gap-1">
                        {DISTANCE_MODES.map((mode) => (
                            <label key={mode.value} className="flex items-center gap-1 cursor-pointer">
                                <input
                                    checked={distanceMode === mode.value}
                                    className="form-check-input"
                                    name="projectileDistanceMode"
                                    type="radio"
                                    onChange={() => setParam(PROJECTILE_PARAM_DISTANCE_MODE, mode.value)}
                                />
                                <Text small>{text(`distance.${mode.key}`, mode.fallback)}</Text>
                            </label>
                        ))}
                    </div>
                    {distanceMode !== PROJECTILE_DISTANCE_NORMAL && (
                        <NumberField
                            label={text('distance.tiles', 'Tiles:')}
                            value={params[PROJECTILE_PARAM_DISTANCE_TILES]}
                            onChange={(value) => setParam(PROJECTILE_PARAM_DISTANCE_TILES, value)}
                        />
                    )}
                    <div className="flex flex-col gap-1">
                        <Text small>
                            {text('curve', 'Curve strength: %value%', ['value'], [String(params[PROJECTILE_PARAM_CURVE_STRENGTH])]).replace(
                                '%value%',
                                String(params[PROJECTILE_PARAM_CURVE_STRENGTH])
                            )}
                        </Text>
                        <Slider
                            max={1000}
                            min={-1000}
                            step={10}
                            value={params[PROJECTILE_PARAM_CURVE_STRENGTH]}
                            onChange={(value) => setParam(PROJECTILE_PARAM_CURVE_STRENGTH, value as number)}
                        />
                    </div>
                </ProjectileSection>

                <ProjectileSection open={openSections.time} title={text('time', 'Animation time:')} onToggle={() => toggleSection('time')}>
                    <Checkbox
                        checked={scalesTime}
                        label={text('time.scale', 'Scale the animation time with the distance')}
                        onChange={(checked) => setFlag(PROJECTILE_PARAM_SCALE_TIME_WITH_DISTANCE, checked)}
                    />
                    {scalesTime && (
                        <>
                            <NumberField
                                label={text('time.per_tile', 'Time per tile (ms):')}
                                value={params[PROJECTILE_PARAM_TIME_PER_TILE]}
                                onChange={(value) => setParam(PROJECTILE_PARAM_TIME_PER_TILE, value)}
                            />
                            <Text small>{text('time.distance_by', 'Measure the distance by:')}</Text>
                            <div className="flex items-center gap-3 octane-wired__projectile-indent">
                                {DISTANCE_AXES.map((axis) => (
                                    <Checkbox
                                        key={axis.key}
                                        checked={params[axis.param] === 1}
                                        label={text(`time.distance_by.${axis.key}`, axis.fallback)}
                                        onChange={(checked) => setFlag(axis.param, checked)}
                                    />
                                ))}
                            </div>
                            <NumberField
                                label={text('time.speed_increase', 'Speed increase (ms):')}
                                value={params[PROJECTILE_PARAM_SPEED_INCREASE]}
                                onChange={(value) => setParam(PROJECTILE_PARAM_SPEED_INCREASE, value)}
                            />
                        </>
                    )}
                </ProjectileSection>

                <ProjectileSection
                    open={openSections.rotation}
                    title={text('rotation_offset', 'Shift the rotation by %value%', ['value'], [String(rotationOffset)]).replace('%value%', String(rotationOffset))}
                    onToggle={() => toggleSection('rotation')}
                >
                    <Slider max={7} min={0} step={1} value={rotationOffset} onChange={(value) => setParam(PROJECTILE_PARAM_ROTATION_OFFSET, value as number)} />
                </ProjectileSection>

                <ProjectileSection open={openSections.variables} title={text('variables', 'Projectile internal variables:')} onToggle={() => toggleSection('variables')}>
                    {PROJECTILE_INTERNAL_VARIABLES.map((variable, bit) => (
                        <Checkbox
                            key={variable}
                            checked={(variablesMask & (1 << bit)) !== 0}
                            label={variable}
                            onChange={(checked) =>
                                setParam(PROJECTILE_PARAM_INTERNAL_VARIABLES, checked ? variablesMask | (1 << bit) : variablesMask & ~(1 << bit))
                            }
                        />
                    ))}
                </ProjectileSection>
            </div>
        </WiredExtraBaseView>
    );
};

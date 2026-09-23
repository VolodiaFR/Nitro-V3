import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setIntParams = vi.fn();
const setStringParam = vi.fn();
let trigger: { intData: number[] } | null = null;
let baseProps: { save: () => void; showSelection?: boolean } | null = null;

vi.mock('../../../../hooks', () => ({
    useWired: () => ({ trigger, setIntParams, setStringParam })
}));

vi.mock('../../../../common', () => ({
    Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
    Slider: (props: { value: number; min: number; max: number; onChange: (value: number) => void }) => (
        <input max={props.max} min={props.min} type="range" value={props.value} onChange={(event) => props.onChange(Number(event.target.value))} />
    )
}));

vi.mock('../WiredFurniSelectorView', () => ({
    WiredFurniSelectorView: () => <div>picked furni</div>
}));

vi.mock('./WiredExtraBaseView', () => ({
    WiredExtraBaseView: (props: PropsWithChildren<{ save: () => void; showSelection?: boolean }>) => {
        baseProps = { save: props.save, showSelection: props.showSelection };
        return <div>{props.children}</div>;
    }
}));

import { WiredExtraProjectileView } from './WiredExtraProjectileView';

describe('WiredExtraProjectileView', () => {
    afterEach(cleanup);

    beforeEach(() => {
        setIntParams.mockClear();
        setStringParam.mockClear();
        baseProps = null;
        trigger = { intData: [] };
    });

    it('opens on the sections Habbo opens on and keeps the picked furni under advanced options', () => {
        render(<WiredExtraProjectileView />);

        expect(screen.getByRole('button', { name: /Usage info/ }).getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('button', { name: /Projectile direction/ }).getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('button', { name: /Animation trajectory/ }).getAttribute('aria-expanded')).toBe('false');
        expect(screen.getByRole('button', { name: /Animation time/ }).getAttribute('aria-expanded')).toBe('false');
        expect(screen.getByRole('button', { name: /Shift the rotation by 0/ }).getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('button', { name: /internal variables/ }).getAttribute('aria-expanded')).toBe('false');
        expect(baseProps.showSelection).toBe(false);
    });

    it('writes every edit back in the nineteen-param wire order', () => {
        trigger = { intData: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0] };

        render(<WiredExtraProjectileView />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
        fireEvent.click(screen.getByLabelText("Visually change the shooter's direction"));
        fireEvent.click(screen.getByLabelText('Do a little hop when shooting sideways'));

        fireEvent.click(screen.getByRole('button', { name: /Animation trajectory/ }));
        fireEvent.click(screen.getByLabelText('Fly past the target'));
        fireEvent.change(screen.getByLabelText('Tiles:'), { target: { value: '-99' } });

        fireEvent.click(screen.getByRole('button', { name: /internal variables/ }));
        fireEvent.click(screen.getByLabelText('@projectile.animation.position.y'));
        fireEvent.click(screen.getByLabelText('@projectile.animation.user_collisions'));

        baseProps.save();

        // Distance tiles clamp to the server's -64; the mask is bits 1 and 6.
        expect(setIntParams).toHaveBeenCalledWith([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 66, 1, 1, 1, 0, -64, 0, 0]);
        expect(setStringParam).toHaveBeenCalledWith('');
    });

    it('carries the params it was handed through untouched', () => {
        const stored = [1, 3, 1, 1, 250, 2, 1, 1, 1, 75, 6, 5, 1, 1, 2, 1, -12, 3, 400];
        trigger = { intData: stored };

        render(<WiredExtraProjectileView />);
        baseProps.save();

        expect(setIntParams).toHaveBeenCalledWith(stored);
        expect(screen.getByRole('button', { name: /Shift the rotation by 6/ })).toBeTruthy();
    });
});

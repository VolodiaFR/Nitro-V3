import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarEffectPreviewView } from './AvatarEffectPreviewView';

const previewMocks = vi.hoisted(() => ({
    addAvatarIntoRoom: vi.fn(),
    dispose: vi.fn(),
    instances: [] as object[],
    updateAvatarDirection: vi.fn(),
    updateObjectUserFigure: vi.fn(),
    updateUserEffect: vi.fn()
}));

vi.mock('@nitrots/nitro-renderer', () => {
    class RoomPreviewer {
        public static PREVIEW_COUNTER = 0;

        public addAvatarIntoRoom = previewMocks.addAvatarIntoRoom;
        public dispose = previewMocks.dispose;
        public updateAvatarDirection = previewMocks.updateAvatarDirection;
        public updateObjectUserFigure = previewMocks.updateObjectUserFigure;
        public updateUserEffect = previewMocks.updateUserEffect;

        public constructor() {
            previewMocks.instances.push(this);
        }
    }

    return {
        GetRoomEngine: () => ({}),
        RoomPreviewer
    };
});

vi.mock('../../common', () => ({
    LayoutRoomPreviewerView: ({ roomPreviewer, height }: { roomPreviewer: object; height: number }) => (
        <div data-height={height} data-preview-id={previewMocks.instances.indexOf(roomPreviewer)} data-testid="room-preview" />
    )
}));

beforeEach(() => {
    vi.clearAllMocks();
    previewMocks.instances.length = 0;
});

afterEach(() => cleanup());

describe('AvatarEffectPreviewView', () => {
    it('keeps compositor backdrop filters off the animated preview surface', () => {
        const source = readFileSync(join(process.cwd(), 'src/components/avatar-effects/AvatarEffectsView.tsx'), 'utf8');

        expect(source).not.toContain('backdrop-blur');
    });

    it('updates effects in place without rebuilding or remounting the preview', async () => {
        const view = render(<AvatarEffectPreviewView direction={4} effect={1} figure="hd-180-1" gender="M" height={280} zoom={2} />);

        const preview = await screen.findByTestId('room-preview');

        await waitFor(() => expect(previewMocks.updateUserEffect).toHaveBeenLastCalledWith(1));

        expect(previewMocks.instances).toHaveLength(1);
        expect(previewMocks.addAvatarIntoRoom).toHaveBeenCalledOnce();
        expect(previewMocks.addAvatarIntoRoom).toHaveBeenCalledWith('hd-180-1', 0);
        expect(previewMocks.updateAvatarDirection).toHaveBeenLastCalledWith(4, 4);
        expect(preview).toHaveAttribute('data-height', '140');

        view.rerender(<AvatarEffectPreviewView direction={4} effect={6} figure="hd-180-1" gender="M" height={280} zoom={2} />);

        await waitFor(() => expect(previewMocks.updateUserEffect).toHaveBeenLastCalledWith(6));

        expect(screen.getByTestId('room-preview')).toBe(preview);
        expect(previewMocks.instances).toHaveLength(1);
        expect(previewMocks.addAvatarIntoRoom).toHaveBeenCalledOnce();
        expect(previewMocks.updateObjectUserFigure).toHaveBeenCalledOnce();
        expect(previewMocks.updateAvatarDirection).toHaveBeenCalledOnce();
        expect(previewMocks.dispose).not.toHaveBeenCalled();
    });

    it('reapplies the effect and direction after replacing the figure', async () => {
        const view = render(<AvatarEffectPreviewView direction={6} effect={7} figure="hd-180-1" gender="M" />);

        await screen.findByTestId('room-preview');
        await waitFor(() => expect(previewMocks.updateUserEffect).toHaveBeenLastCalledWith(7));

        view.rerender(<AvatarEffectPreviewView direction={6} effect={7} figure="hd-190-1" gender="F" />);

        await waitFor(() => expect(previewMocks.addAvatarIntoRoom).toHaveBeenCalledTimes(2));

        expect(previewMocks.updateObjectUserFigure).toHaveBeenLastCalledWith('hd-190-1', 'F');
        expect(previewMocks.updateUserEffect).toHaveBeenLastCalledWith(7);
        expect(previewMocks.updateAvatarDirection).toHaveBeenLastCalledWith(6, 6);

        view.unmount();

        expect(previewMocks.dispose).toHaveBeenCalledOnce();
    });
});

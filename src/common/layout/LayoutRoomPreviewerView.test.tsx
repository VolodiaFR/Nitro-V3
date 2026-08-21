import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LayoutRoomPreviewerView } from './LayoutRoomPreviewerView';

const previewMocks = vi.hoisted(() => ({
    add: vi.fn(),
    createRenderTexture: vi.fn((_width: number, _height: number) => ({ destroy: vi.fn() })),
    remove: vi.fn(),
    destroy: vi.fn()
}));

vi.mock('@nitrots/nitro-renderer', () => ({
    GetRenderer: () => ({
        render: vi.fn(),
        texture: { generateCanvas: vi.fn() }
    }),
    GetTicker: () => ({ add: previewMocks.add, remove: previewMocks.remove }),
    NitroLogger: { error: vi.fn() },
    TextureUtils: { createRenderTexture: previewMocks.createRenderTexture }
}));

let resizeCallback: ResizeObserverCallback;

class ResizeObserverMock {
    public constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
    }

    public observe = vi.fn();
    public disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

afterEach(cleanup);

describe('LayoutRoomPreviewerView interactions', () => {
    it('recreates its render target when the preview width changes', () => {
        const roomPreviewer = {
            changeRoomObjectState: vi.fn(),
            getRenderingCanvas: vi.fn(() => null),
            getRoomCanvas: vi.fn(),
            modifyRoomCanvas: vi.fn(),
            updatePreviewRoomView: vi.fn()
        } as any;

        const view = render(<LayoutRoomPreviewerView height={240} roomPreviewer={roomPreviewer} />);
        const preview = view.container.querySelector('.shadow-room-previewer')!;

        Object.defineProperty(preview.parentElement, 'offsetWidth', { configurable: true, value: 680 });
        resizeCallback([], {} as ResizeObserver);

        expect(previewMocks.createRenderTexture).toHaveBeenLastCalledWith(680, 240);
    });

    it('keeps furniture state on a single click', () => {
        const roomPreviewer = {
            changeRoomObjectDirection: vi.fn(),
            changeRoomObjectState: vi.fn(),
            getRenderingCanvas: vi.fn(() => null),
            getRoomCanvas: vi.fn(),
            modifyRoomCanvas: vi.fn(),
            updatePreviewRoomView: vi.fn()
        } as any;

        const view = render(<LayoutRoomPreviewerView height={200} roomPreviewer={roomPreviewer} />);
        fireEvent.click(view.container.querySelector('.shadow-room-previewer')!);

        expect(roomPreviewer.changeRoomObjectState).toHaveBeenCalledOnce();
    });

    it('keeps preview clicks dedicated to furniture state even with modifier keys', () => {
        const roomPreviewer = {
            changeRoomObjectDirection: vi.fn(),
            changeRoomObjectState: vi.fn(),
            getRenderingCanvas: vi.fn(() => null),
            getRoomCanvas: vi.fn(),
            modifyRoomCanvas: vi.fn(),
            updatePreviewRoomView: vi.fn()
        } as any;

        const view = render(<LayoutRoomPreviewerView height={200} roomPreviewer={roomPreviewer} />);
        fireEvent.click(view.container.querySelector('.shadow-room-previewer')!, { shiftKey: true });

        expect(roomPreviewer.changeRoomObjectDirection).not.toHaveBeenCalled();
        expect(roomPreviewer.changeRoomObjectState).toHaveBeenCalledOnce();
    });

    it('does not cycle avatar actions from the preview surface', () => {
        const roomPreviewer = {
            changeRoomObjectDirection: vi.fn(),
            changeRoomObjectState: vi.fn(),
            cycleAvatarAction: vi.fn(),
            getPreviewCapabilities: () => ({ mode: 'avatar' }),
            getRenderingCanvas: vi.fn(() => null),
            getRoomCanvas: vi.fn(),
            modifyRoomCanvas: vi.fn(),
            updatePreviewRoomView: vi.fn()
        } as any;

        const view = render(<LayoutRoomPreviewerView height={200} roomPreviewer={roomPreviewer} />);
        fireEvent.click(view.container.querySelector('.shadow-room-previewer')!);

        expect(roomPreviewer.cycleAvatarAction).not.toHaveBeenCalled();
        expect(roomPreviewer.changeRoomObjectState).toHaveBeenCalledOnce();
    });
});

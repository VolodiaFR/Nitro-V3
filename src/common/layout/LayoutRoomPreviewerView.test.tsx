import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LayoutRoomPreviewerView } from './LayoutRoomPreviewerView';

const previewMocks = vi.hoisted(() => ({
    add: vi.fn(),
    createRenderTexture: vi.fn((width: number, height: number) => ({ width, height, destroy: vi.fn() })),
    getPixels: vi.fn((texture: { width: number; height: number }) => ({
        pixels: new Uint8ClampedArray(texture.width * texture.height * 4),
        width: texture.width,
        height: texture.height
    })),
    remove: vi.fn(),
    render: vi.fn()
}));

vi.mock('@nitrots/nitro-renderer', () => ({
    GetRenderer: () => ({
        render: previewMocks.render,
        texture: { getPixels: previewMocks.getPixels }
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

const context = {
    createImageData: vi.fn((width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height
    })),
    putImageData: vi.fn()
};

const createRoomPreviewer = (canvasUpdated = true) => {
    const renderingCanvas = { canvasUpdated, master: {} };

    return {
        changeRoomObjectDirection: vi.fn(),
        changeRoomObjectState: vi.fn(),
        cycleAvatarAction: vi.fn(),
        getPreviewCapabilities: () => ({ mode: 'avatar' }),
        getRenderingCanvas: vi.fn(() => renderingCanvas),
        getRoomCanvas: vi.fn(),
        modifyRoomCanvas: vi.fn(),
        renderingCanvas,
        updatePreviewRoomView: vi.fn()
    } as any;
};

const renderPreview = (roomPreviewer: ReturnType<typeof createRoomPreviewer>, height = 240, initialWidth = 360) => {
    const container = document.createElement('div');
    let width = initialWidth;

    Object.defineProperty(container, 'clientWidth', { configurable: true, get: () => width });
    document.body.appendChild(container);

    const view = render(<LayoutRoomPreviewerView height={height} roomPreviewer={roomPreviewer} />, { container });

    return {
        ...view,
        setWidth(nextWidth: number) {
            width = nextWidth;
            resizeCallback([], {} as ResizeObserver);
        }
    };
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('LayoutRoomPreviewerView presentation canvas', () => {
    it('blits dirty frames into one persistent canvas without encoding data URLs', () => {
        const roomPreviewer = createRoomPreviewer();
        const toDataUrl = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
        const view = renderPreview(roomPreviewer);
        const canvas = view.container.querySelector('canvas');
        const tick = previewMocks.add.mock.calls[0][0];

        tick();
        tick();

        expect(view.container.querySelector('canvas')).toBe(canvas);
        expect(previewMocks.getPixels).toHaveBeenCalledTimes(3);
        expect(context.putImageData).toHaveBeenCalledTimes(3);
        expect(toDataUrl).not.toHaveBeenCalled();
        expect(view.container.querySelector<HTMLElement>('.shadow-room-previewer')?.style.backgroundImage).toBe('');
    });

    it('does not read back or blit clean renderer ticks', () => {
        const roomPreviewer = createRoomPreviewer(false);
        renderPreview(roomPreviewer);
        const tick = previewMocks.add.mock.calls[0][0];
        const initialReadbacks = previewMocks.getPixels.mock.calls.length;

        tick();

        expect(previewMocks.getPixels).toHaveBeenCalledTimes(initialReadbacks);
        expect(roomPreviewer.updatePreviewRoomView).toHaveBeenCalledOnce();
    });

    it('preserves a dirty action frame when the next room update clears its flag', () => {
        const roomPreviewer = createRoomPreviewer();
        const view = renderPreview(roomPreviewer);
        const tick = previewMocks.add.mock.calls[0][0];
        const initialReadbacks = previewMocks.getPixels.mock.calls.length;

        roomPreviewer.updatePreviewRoomView.mockImplementation(() => {
            roomPreviewer.renderingCanvas.canvasUpdated = false;
        });

        tick();
        tick();

        expect(previewMocks.getPixels).toHaveBeenCalledTimes(initialReadbacks + 1);
        expect(view.container.querySelector('canvas')).toBeInTheDocument();
    });

    it('recreates its render target only when the measured width changes', () => {
        const roomPreviewer = createRoomPreviewer();
        const view = renderPreview(roomPreviewer);
        const firstTexture = previewMocks.createRenderTexture.mock.results[0].value;

        view.setWidth(360);

        expect(previewMocks.createRenderTexture).toHaveBeenCalledTimes(1);
        expect(roomPreviewer.modifyRoomCanvas).not.toHaveBeenCalled();

        view.setWidth(680);

        expect(previewMocks.createRenderTexture).toHaveBeenLastCalledWith(680, 240);
        expect(roomPreviewer.modifyRoomCanvas).toHaveBeenCalledOnce();
        expect(roomPreviewer.modifyRoomCanvas).toHaveBeenCalledWith(680, 240);
        expect(firstTexture.destroy).toHaveBeenCalledWith(true);
    });

    it('initializes the room canvas once and releases ticker and texture resources', () => {
        const roomPreviewer = createRoomPreviewer();
        const view = renderPreview(roomPreviewer, 348);
        const texture = previewMocks.createRenderTexture.mock.results[0].value;
        const tick = previewMocks.add.mock.calls[0][0];

        expect(roomPreviewer.getRoomCanvas).toHaveBeenCalledWith(360, 348);

        view.unmount();

        expect(previewMocks.remove).toHaveBeenCalledWith(tick);
        expect(texture.destroy).toHaveBeenCalledWith(true);
    });
});

describe('LayoutRoomPreviewerView interactions', () => {
    it('keeps furniture state on a single click', () => {
        const roomPreviewer = createRoomPreviewer();
        const view = renderPreview(roomPreviewer, 200);

        fireEvent.click(view.container.querySelector('.shadow-room-previewer')!);

        expect(roomPreviewer.changeRoomObjectState).toHaveBeenCalledOnce();
    });

    it('keeps preview clicks dedicated to furniture state even with modifier keys', () => {
        const roomPreviewer = createRoomPreviewer();
        const view = renderPreview(roomPreviewer, 200);

        fireEvent.click(view.container.querySelector('.shadow-room-previewer')!, { shiftKey: true });

        expect(roomPreviewer.changeRoomObjectDirection).not.toHaveBeenCalled();
        expect(roomPreviewer.changeRoomObjectState).toHaveBeenCalledOnce();
    });

    it('does not cycle avatar actions from the preview surface', () => {
        const roomPreviewer = createRoomPreviewer();
        const view = renderPreview(roomPreviewer, 200);

        fireEvent.click(view.container.querySelector('.shadow-room-previewer')!);

        expect(roomPreviewer.cycleAvatarAction).not.toHaveBeenCalled();
        expect(roomPreviewer.changeRoomObjectState).toHaveBeenCalledOnce();
    });
});

import { GetRenderer, GetRoomEngine, TextureUtils } from '@nitrots/nitro-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { blitRoomCanvasToViewfinder, getViewfinderRoomFrame } from './blitRoomCanvasToViewfinder';

const rect = (left: number, top: number, width: number, height: number): DOMRect => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({})
}) as DOMRect;

describe('AIR camera viewfinder blit', () => {
    afterEach(() => {
        vi.mocked(GetRenderer).mockReset();
        vi.mocked(GetRoomEngine).mockReset();
    });

    it('no-ops when the room canvas is missing', () => {
        vi.mocked(GetRoomEngine).mockReturnValue({ getActiveRoomInstanceRenderingCanvas: () => null } as any);
        vi.mocked(GetRenderer).mockReturnValue({ canvas: document.createElement('canvas'), resolution: 1 } as any);

        const target = document.createElement('canvas');

        expect(blitRoomCanvasToViewfinder(target)).toBe(false);
        expect(blitRoomCanvasToViewfinder(null)).toBe(false);
        expect(getViewfinderRoomFrame(null)).toBeNull();
    });

    it('snapshots the room display object in logical pixels, not backing-store pixels', () => {
        const source = document.createElement('canvas');
        source.width = 400;
        source.height = 200;
        vi.spyOn(source, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 100));

        const master = { label: 'room-master' };
        const snapshot = { destroy: vi.fn() };
        const extracted = document.createElement('canvas');
        extracted.width = 40;
        extracted.height = 30;

        vi.mocked(GetRenderer).mockReturnValue({ canvas: source, resolution: 2 } as any);
        vi.mocked(GetRoomEngine).mockReturnValue({
            getActiveRoomInstanceRenderingCanvas: () => ({ master })
        } as any);
        vi.spyOn(TextureUtils, 'generateTexture').mockReturnValue(snapshot as any);
        vi.spyOn(TextureUtils, 'generateCanvas').mockReturnValue(extracted as any);

        const drawImage = vi.fn();
        const target = document.createElement('canvas');
        vi.spyOn(target, 'getContext').mockReturnValue({
            imageSmoothingEnabled: true,
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage
        } as any);
        vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect(50, 20, 40, 30));

        expect(blitRoomCanvasToViewfinder(target)).toBe(true);

        const frame = vi.mocked(TextureUtils.generateTexture).mock.calls[0][0].frame;

        expect(frame).toMatchObject({ x: 50, y: 20, width: 40, height: 30 });
        expect(drawImage).toHaveBeenCalledWith(extracted, 0, 0, 40, 30);
        expect(vi.mocked(TextureUtils.generateTexture).mock.calls[0][0]).toMatchObject({
            target: master,
            resolution: 1
        });
        expect(snapshot.destroy).toHaveBeenCalled();
        expect(getViewfinderRoomFrame(target)).toMatchObject({ x: 50, y: 20, width: 40, height: 30 });
    });

    it('inverts the room master world transform when the canvas is offset', () => {
        const source = document.createElement('canvas');
        source.width = 200;
        source.height = 100;
        vi.spyOn(source, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 100));

        const master = {
            worldTransform: {
                applyInverse: ({ x, y }: { x: number; y: number }) => ({ x: x - 10, y: y - 4 })
            }
        };

        vi.mocked(GetRenderer).mockReturnValue({ canvas: source, resolution: 1 } as any);
        vi.mocked(GetRoomEngine).mockReturnValue({
            getActiveRoomInstanceRenderingCanvas: () => ({ master })
        } as any);

        const target = document.createElement('canvas');
        vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(rect(50, 20, 40, 30));

        expect(getViewfinderRoomFrame(target)).toMatchObject({ x: 40, y: 16, width: 40, height: 30 });
    });
});

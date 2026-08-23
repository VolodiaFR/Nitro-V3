import { AvatarSetType, GetAvatarRenderManager } from '@nitrots/nitro-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarEditorThumbnailsHelper } from './AvatarEditorThumbnailsHelper';

const createAvatarImage = vi.fn();

const createAvatar = (options: { placeholder?: boolean; url?: string } = {}) => ({
    dispose: vi.fn(),
    isPlaceholder: vi.fn(() => options.placeholder ?? false),
    processAsCroppedImageUrl: vi.fn(() => options.url ?? 'face.png'),
    processAsTexture: vi.fn()
});

describe('AvatarEditorThumbnailsHelper.buildForFace', () => {
    beforeEach(() => {
        AvatarEditorThumbnailsHelper.clearCache();
        createAvatarImage.mockReset();
        vi.mocked(GetAvatarRenderManager).mockReturnValue({ createAvatarImage } as never);
    });

    it('uses, caches, and disposes the native cropped-head export', async () => {
        const avatar = createAvatar({ url: 'native-face.png' });
        createAvatarImage.mockReturnValue(avatar);

        await expect(AvatarEditorThumbnailsHelper.buildForFace('hd-1-1')).resolves.toBe('native-face.png');
        await expect(AvatarEditorThumbnailsHelper.buildForFace('hd-1-1')).resolves.toBe('native-face.png');

        expect(createAvatarImage).toHaveBeenCalledTimes(1);
        expect(avatar.processAsCroppedImageUrl).toHaveBeenCalledWith(AvatarSetType.HEAD);
        expect(avatar.processAsTexture).not.toHaveBeenCalled();
        expect(avatar.dispose).toHaveBeenCalledTimes(1);
    });

    it('waits for a placeholder face library and resolves its loaded replacement', async () => {
        let resetFigure: (figure: string) => void;
        const placeholder = createAvatar({ placeholder: true });
        const loaded = createAvatar({ url: 'loaded-face.png' });

        createAvatarImage.mockImplementation((_figure, _scale, _gender, listener) => {
            resetFigure = listener.resetFigure;

            return createAvatarImage.mock.calls.length === 1 ? placeholder : loaded;
        });

        const result = AvatarEditorThumbnailsHelper.buildForFace('hd-2-1');
        let settled = false;
        void result.then(() => {
            settled = true;
        });
        await Promise.resolve();

        expect(settled).toBe(false);
        expect(placeholder.dispose).toHaveBeenCalledTimes(1);

        resetFigure!('hd-2-1');

        await expect(result).resolves.toBe('loaded-face.png');
        expect(loaded.processAsCroppedImageUrl).toHaveBeenCalledWith(AvatarSetType.HEAD);
        expect(loaded.dispose).toHaveBeenCalledTimes(1);
    });

    it('does not poison retries when avatar creation fails', async () => {
        const loaded = createAvatar({ url: 'retry-face.png' });
        createAvatarImage.mockReturnValueOnce(null).mockReturnValueOnce(loaded);

        await expect(AvatarEditorThumbnailsHelper.buildForFace('hd-3-1')).resolves.toBeNull();
        await expect(AvatarEditorThumbnailsHelper.buildForFace('hd-3-1')).resolves.toBe('retry-face.png');

        expect(createAvatarImage).toHaveBeenCalledTimes(2);
    });
});

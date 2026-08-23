import { act, cleanup, render, waitFor } from '@testing-library/react';
import { PropsWithChildren, useLayoutEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarEditorFigureSetItemView } from './AvatarEditorFigureSetItemView';

const mocks = vi.hoisted(() => ({
    build: vi.fn(),
    buildForFace: vi.fn(),
    editor: {
        selectedColorParts: { ch: [{ id: 1, rgb: 0x112233 }] },
        getFigureStringWithFace: vi.fn((partId: number) => `hd-${partId}-1`)
    },
    avatarAssetLoaded: null as (() => void) | null,
    itemPaints: [] as { className: string; src: string | null }[]
}));

vi.mock('../../../api', () => ({
    AvatarEditorThumbnailsHelper: {
        build: mocks.build,
        buildForFace: mocks.buildForFace
    },
    GetClubMemberLevel: () => 0,
    GetConfigurationValue: () => false
}));

vi.mock('../../../common', () => ({
    LayoutCurrencyIcon: () => null
}));

vi.mock('../../../hooks', () => ({
    useAvatarEditor: () => mocks.editor
}));

vi.mock('../../../hooks/events', () => ({
    useNitroEvent: (_type: string, handler: () => void) => {
        mocks.avatarAssetLoaded = handler;
    }
}));

vi.mock('../../../layout', () => ({
    InfiniteGrid: {
        Item: ({ children, className, onClick }: PropsWithChildren<{ className?: string; onClick?: () => void }>) => {
            const itemRef = useRef<HTMLDivElement>(null);

            useLayoutEffect(() => {
                mocks.itemPaints.push({ className: itemRef.current?.className ?? '', src: itemRef.current?.querySelector('img')?.getAttribute('src') ?? null });
            });

            return (
                <div ref={itemRef} className={className} onClick={onClick}>
                    {children}
                </div>
            );
        }
    }
}));

vi.mock('../AvatarEditorIcon', () => ({
    AvatarEditorIcon: () => null
}));

const partItem = {
    id: 7,
    usesColor: true,
    partSet: {
        id: 7,
        clubLevel: 0,
        isSellable: false
    }
};

const deferred = <T,>() => {
    let resolve: (value: T) => void;
    const promise = new Promise<T>((promiseResolve) => {
        resolve = promiseResolve;
    });

    return { promise, resolve: resolve! };
};

describe('AvatarEditorFigureSetItemView', () => {
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    beforeEach(() => {
        mocks.build.mockReset();
        mocks.buildForFace.mockReset();
        mocks.editor.selectedColorParts = { ch: [{ id: 1, rgb: 0x112233 }] };
        mocks.avatarAssetLoaded = null;
        mocks.itemPaints.length = 0;
    });

    it('retries an unsettled face after its avatar library loads', async () => {
        vi.useFakeTimers();
        mocks.buildForFace.mockResolvedValueOnce(null).mockResolvedValueOnce('face.png');

        render(<AvatarEditorFigureSetItemView setType="hd" partItem={partItem as never} isSelected={false} />);

        await act(async () => undefined);
        expect(mocks.buildForFace).toHaveBeenCalledTimes(1);

        await act(async () => {
            mocks.avatarAssetLoaded?.();
            await vi.advanceTimersByTimeAsync(250);
        });

        expect(mocks.buildForFace).toHaveBeenCalledTimes(2);
        expect(document.querySelector('img')).toHaveAttribute('src', 'face.png');
    });

    it('dims a locked face without modifying its generated image', async () => {
        mocks.buildForFace.mockResolvedValueOnce('face.png');
        const lockedPart = { ...partItem, isSellableNotOwned: true };

        render(<AvatarEditorFigureSetItemView setType="hd" partItem={lockedPart as never} isSelected={false} />);

        await waitFor(() => expect(document.querySelector('img')).toHaveAttribute('src', 'face.png'));
        expect(document.querySelector('img')).toHaveClass('avatar-editor-face-thumbnail', 'is-disabled');
    });

    it('keeps the settled thumbnail visible while a recolor is generated', async () => {
        mocks.build.mockResolvedValueOnce('first.png');

        const { rerender } = render(<AvatarEditorFigureSetItemView setType="ch" partItem={partItem as never} isSelected={false} />);

        await waitFor(() => expect(document.querySelector('img')).toHaveAttribute('src', 'first.png'));

        const recolored = deferred<string>();
        mocks.build.mockReturnValueOnce(recolored.promise);
        mocks.editor.selectedColorParts = { ch: [{ id: 2, rgb: 0x445566 }] };

        rerender(<AvatarEditorFigureSetItemView setType="ch" partItem={partItem as never} isSelected={false} />);

        expect(document.querySelector('img')).toHaveAttribute('src', 'first.png');

        await act(async () => recolored.resolve('second.png'));
        await waitFor(() => expect(document.querySelector('img')).toHaveAttribute('src', 'second.png'));
    });

    it('ignores an older thumbnail request that finishes last', async () => {
        const older = deferred<string>();
        const newer = deferred<string>();
        mocks.build.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

        const { rerender } = render(<AvatarEditorFigureSetItemView setType="ch" partItem={partItem as never} isSelected={false} />);

        mocks.editor.selectedColorParts = { ch: [{ id: 2, rgb: 0x445566 }] };
        rerender(<AvatarEditorFigureSetItemView setType="ch" partItem={partItem as never} isSelected={false} />);

        await act(async () => newer.resolve('newer.png'));
        await waitFor(() => expect(document.querySelector('img')).toHaveAttribute('src', 'newer.png'));

        await act(async () => older.resolve('older.png'));
        expect(document.querySelector('img')).toHaveAttribute('src', 'newer.png');
    });

    it('never paints a reused cell with the previous part thumbnail', async () => {
        mocks.build.mockResolvedValueOnce('first.png');

        const { rerender } = render(<AvatarEditorFigureSetItemView setType="ch" partItem={partItem as never} isSelected={false} />);

        await waitFor(() => expect(document.querySelector('img')).toHaveAttribute('src', 'first.png'));

        const nextThumbnail = deferred<string>();
        mocks.build.mockReturnValueOnce(nextThumbnail.promise);
        mocks.itemPaints.length = 0;

        const nextPartItem = { ...partItem, id: 8, partSet: { ...partItem.partSet, id: 8 } };
        rerender(<AvatarEditorFigureSetItemView setType="ch" partItem={nextPartItem as never} isSelected={false} />);

        expect(mocks.itemPaints.some((paint) => paint.src === 'first.png')).toBe(false);
        expect(mocks.itemPaints[0]?.className).toContain('is-loading');
        expect(document.querySelector('img')).toBeNull();
    });
});

import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InfiniteGrid } from './InfiniteGrid';

vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: () => ({
        getTotalSize: () => 700,
        getVirtualItems: () => [{ index: 0, key: 0, size: 70, start: 0 }],
        measureElement: vi.fn(),
        scrollToIndex: vi.fn()
    })
}));

afterEach(() => {
    vi.restoreAllMocks();
});

describe('InfiniteGrid responsive columns', () => {
    it('excludes scrollbar padding when calculating virtualized columns', async () => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(580);
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(800);
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            paddingLeft: '0px',
            paddingRight: '17px'
        } as CSSStyleDeclaration);

        const { container } = render(
            <InfiniteGrid
                classicScrollbar
                columnCount={6}
                estimateSize={70}
                itemMinWidth={53}
                items={Array.from({ length: 100 }, (_, index) => index + 1)}
                itemRender={(item) => <span>{item}</span>}
            />
        );

        await waitFor(() => {
            const firstRow = container.querySelector<HTMLElement>('[data-index="0"]');

            expect(firstRow?.children).toHaveLength(9);
            expect(firstRow?.style.gridTemplateColumns).toBe('repeat(auto-fill, minmax(53px, 1fr))');
        });
    });

    it('uses the caller column gap when fixed AIR tracks share space with a classic scrollbar', async () => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(352);
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(155);
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(800);
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            paddingLeft: '0px',
            paddingRight: '17px'
        } as CSSStyleDeclaration);

        const { container } = render(
            <InfiniteGrid
                classicScrollbar
                columnCount={6}
                columnGap={3}
                estimateSize={74}
                itemMinWidth={53}
                items={Array.from({ length: 100 }, (_, index) => index + 1)}
                itemRender={(item) => <span>{item}</span>}
            />
        );

        await waitFor(() => {
            const firstRow = container.querySelector<HTMLElement>('[data-index="0"]');
            const viewport = container.querySelector<HTMLElement>('.nitro-classic-scroll-area-viewport');

            expect(firstRow?.children).toHaveLength(6);
            expect(firstRow?.style.columnGap).toBe('3px');
            expect(viewport?.style.paddingRight).toBe('');
        });
    });

    it('uses AIR gap-omitting admission for fixed catalog tracks', async () => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(386);
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            paddingLeft: '0px',
            paddingRight: '0px'
        } as CSSStyleDeclaration);
        const onColumnCountChange = vi.fn();

        const { container } = render(
            <InfiniteGrid
                airColumnAdmission
                columnCount={6}
                columnGap={3}
                estimateSize={74}
                itemMinWidth={53}
                items={Array.from({ length: 100 }, (_, index) => index + 1)}
                onColumnCountChange={onColumnCountChange}
                itemRender={(item) => <span>{item}</span>}
            />
        );

        await waitFor(() => {
            expect(container.querySelector<HTMLElement>('[data-index="0"]')?.children).toHaveLength(7);
            expect(onColumnCountChange).toHaveBeenLastCalledWith(7);
        });
    });

    it('resets horizontal virtual-grid scrolling when items change', async () => {
        const view = render(<InfiniteGrid columnCount={2} items={[1, 2]} itemRender={(item) => <span>{item}</span>} />);
        const viewport = view.container.firstElementChild as HTMLElement;

        viewport.scrollLeft = 3;
        view.rerender(<InfiniteGrid columnCount={2} items={[3, 4]} itemRender={(item) => <span>{item}</span>} />);

        await waitFor(() => expect(viewport.scrollLeft).toBe(0));
    });
});

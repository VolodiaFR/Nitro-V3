import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogItemGridWidgetView } from './CatalogItemGridWidgetView';

const catalogState = vi.hoisted(() => ({
    currentPage: { offers: [], pageId: 1 }
}));

vi.mock('../../../../../hooks', () => ({
    useCatalogActions: () => ({ selectCatalogOffer: vi.fn() }),
    useCatalogData: () => ({ currentOffer: null, currentPage: catalogState.currentPage }),
    useCatalogUiState: () => ({ setCurrentPage: vi.fn() })
}));

describe('CatalogItemGridWidgetView responsive grid ownership', () => {
    beforeEach(() => {
        catalogState.currentPage = { offers: [], pageId: 1 };
    });

    afterEach(cleanup);

    it('applies the shared auto-fill grid class to every multi-column offer template', () => {
        render(<CatalogItemGridWidgetView columnCount={6} />);

        expect(screen.getByRole('listbox', { name: 'Catalog items' })).toHaveClass('nitro-catalog-grid');
    });

    it('does not turn a specialized single-column selector into an auto-fill grid', () => {
        render(<CatalogItemGridWidgetView columnCount={1} />);

        expect(screen.getByRole('listbox', { name: 'Catalog items' })).not.toHaveClass('nitro-catalog-grid');
    });
});

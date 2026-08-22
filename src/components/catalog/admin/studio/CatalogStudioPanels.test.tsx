/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogStudioPublishReview } from './CatalogStudioPublishReview';
import { CatalogStudioTransferPanel } from './CatalogStudioTransferPanel';
import { useCatalogStudio } from './useCatalogStudio';

vi.mock('./useCatalogStudio', () => ({ useCatalogStudio: vi.fn() }));

const studio = {
    loading: false,
    documentResult: null,
    dryRunDocument: vi.fn(),
    applyDocument: vi.fn(),
    exportDocument: vi.fn()
};

const historyGroup = {
    id: 1,
    summary: 'Updated Furni',
    revision: 7,
    actorId: 5,
    actorName: 'Admin',
    source: 'UI',
    createdAt: '2026-08-12T20:00:00Z',
    entries: []
};

describe('Catalog Studio essential panels', () => {
    afterEach(cleanup);

    beforeEach(() => {
        Object.values(studio).forEach(value => typeof value === 'function' && value.mockClear());
        vi.mocked(useCatalogStudio).mockReturnValue(studio as any);
    });

    it('uses SQL as the only catalog transfer format', () => {
        render(<CatalogStudioTransferPanel />);
        fireEvent.change(screen.getByLabelText('SQL catalog document'), { target: { value: 'UPDATE catalog_pages SET caption = \'Shop\' WHERE id = 1;' } });
        fireEvent.click(screen.getByText('Validate and dry-run'));

        expect(studio.dryRunDocument).toHaveBeenCalledWith('SQL', "UPDATE catalog_pages SET caption = 'Shop' WHERE id = 1;");
        expect(screen.queryByLabelText('Transfer format')).not.toBeInTheDocument();
    });

    it('offers SQL file import and download controls', () => {
        render(<CatalogStudioTransferPanel />);

        expect(screen.getByLabelText('Import catalog SQL file')).toHaveAttribute('accept', '.sql,application/sql,text/plain');
        expect(screen.getByRole('button', { name: 'Download full catalog' })).toBeEnabled();
    });

    it('shows pending changes and requires confirmation before reverting one', () => {
        const undo = vi.fn();
        render(<CatalogStudioPublishReview
            phase="ready"
            pendingCount={1}
            validationCurrent
            issues={[]}
            history={[ historyGroup ]}
            publishResult={null}
            loading={false}
            publish={vi.fn()}
            undo={undo}
        />);

        expect(screen.getByText('Updated Furni')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Revert Updated Furni' }));
        expect(screen.getByText('Revert “Updated Furni”?')).toBeInTheDocument();
        expect(undo).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Revert change' }));
        expect(undo).toHaveBeenCalledWith(1);
    });

    it('can check and publish external-only changes and confirms before publishing', () => {
        const publish = vi.fn();
        const view = render(<CatalogStudioPublishReview
            phase="clean"
            pendingCount={0}
            validationCurrent
            issues={[]}
            history={[]}
            publishResult={null}
            loading={false}
            publish={publish}
            undo={vi.fn()}
        />);

        fireEvent.click(screen.getByRole('button', { name: 'Check & publish' }));
        expect(screen.getByText('Check live catalog and publish?')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Publish now' }));
        expect(publish).toHaveBeenCalledTimes(1);

        view.rerender(<CatalogStudioPublishReview
            phase="ready"
            pendingCount={3}
            validationCurrent
            issues={[]}
            history={[ historyGroup ]}
            publishResult={null}
            loading={false}
            publish={publish}
            undo={vi.fn()}
        />);

        fireEvent.click(screen.getByRole('button', { name: 'Publish 3 changes' }));
        expect(screen.getByText('Publish 3 changes?')).toBeInTheDocument();
        expect(publish).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Publish now' }));
        expect(publish).toHaveBeenCalledTimes(2);
    });

    it('shows automatically imported changes and field conflicts', () => {
        const view = render(<CatalogStudioPublishReview
            phase="clean"
            pendingCount={0}
            validationCurrent
            issues={[]}
            history={[]}
            publishResult={{
                operationId: 'publish-1', success: true, code: 'PUBLISHED', revision: 8,
                message: 'Catalog published with 2 external database change(s)', importedChanges: 2, conflicts: []
            }}
            loading={false}
            publish={vi.fn()}
            undo={vi.fn()}
        />);

        expect(screen.getByText('2 external database changes imported automatically.')).toBeInTheDocument();

        view.rerender(<CatalogStudioPublishReview
            phase="clean"
            pendingCount={0}
            validationCurrent
            issues={[]}
            history={[]}
            publishResult={{
                operationId: 'publish-2', success: false, code: 'LIVE_SYNC_CONFLICT', revision: 8,
                message: '1 external database conflict(s) block publication', importedChanges: 0,
                conflicts: [ { catalogType: 'NORMAL', entityType: 'OFFER', entityId: 77, field: 'costCredits' } ]
            }}
            loading={false}
            publish={vi.fn()}
            undo={vi.fn()}
        />);

        expect(screen.getByText('OFFER #77 · costCredits')).toBeInTheDocument();
    });
});

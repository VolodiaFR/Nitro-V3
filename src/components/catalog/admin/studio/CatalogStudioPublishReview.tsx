import { FC, useState } from 'react';
import { FaCloudUploadAlt, FaExclamationTriangle, FaHistory, FaUndo } from 'react-icons/fa';
import { CatalogStudioCommandState } from './CatalogStudioCommandCenter';
import { CatalogStudioHistoryGroup, CatalogStudioPublishResult, CatalogStudioValidationIssue } from './CatalogStudioTypes';

interface CatalogStudioPublishReviewProps {
    phase: CatalogStudioCommandState['phase'];
    pendingCount: number;
    validationCurrent: boolean;
    issues: CatalogStudioValidationIssue[];
    history: CatalogStudioHistoryGroup[];
    publishResult: CatalogStudioPublishResult | null;
    loading: boolean;
    publish: () => void;
    undo: (groupId: number) => void;
}

export const CatalogStudioPublishReview: FC<CatalogStudioPublishReviewProps> = ({
    phase,
    pendingCount,
    validationCurrent,
    issues,
    history,
    publishResult,
    loading,
    publish,
    undo
}) => {
    const [publishConfirmationOpen, setPublishConfirmationOpen] = useState(false);
    const [revertCandidate, setRevertCandidate] = useState<CatalogStudioHistoryGroup | null>(null);
    const canPublish = (phase === 'clean' || (phase === 'ready' && validationCurrent)) && issues.length === 0 && !loading;
    const visibleHistory = pendingCount > 0 ? history : [];

    const publishNow = () => {
        setPublishConfirmationOpen(false);
        publish();
    };

    const revertNow = () => {
        if (!revertCandidate) return;

        const groupId = revertCandidate.id;
        setRevertCandidate(null);
        undo(groupId);
    };

    return <div className="nitro-catalog-admin-publish">
        {!!publishResult?.importedChanges && <div className="nitro-catalog-admin-validation-list">
            <div className="nitro-catalog-admin-publish-changes-head">
                {publishResult.importedChanges} external database {publishResult.importedChanges === 1 ? 'change' : 'changes'} imported automatically.
            </div>
        </div>}

        {!!publishResult?.conflicts.length && <div className="nitro-catalog-admin-validation-list">
            <div className="nitro-catalog-admin-publish-changes-head">External database conflicts</div>
            {publishResult.conflicts.map((conflict, index) => <div
                key={`${conflict.catalogType}-${conflict.entityType}-${conflict.entityId}-${conflict.field}-${index}`}
                className="nitro-catalog-admin-validation-row"
            >
                <FaExclamationTriangle />
                <div>
                    <strong>{conflict.entityType} #{conflict.entityId} &middot; {conflict.field}</strong>
                    <span>{conflict.catalogType} catalog changed both live and in the draft.</span>
                </div>
            </div>)}
        </div>}

        {!!issues.length && <div className="nitro-catalog-admin-validation-list">
            <div className="nitro-catalog-admin-publish-changes-head">Resolve before publishing</div>
            {issues.map((issue, index) => <div
                key={`${issue.code}-${issue.entityType}-${issue.entityId}-${index}`}
                className="nitro-catalog-admin-validation-row"
            >
                <FaExclamationTriangle />
                <div>
                    <strong>{issue.message}</strong>
                    <span>{issue.entityType} #{issue.entityId} &middot; {issue.field}</span>
                </div>
            </div>)}
        </div>}

        <div className="nitro-catalog-admin-publish-changes">
            <div className="nitro-catalog-admin-publish-changes-head">
                <FaHistory /> Pending changes
            </div>
            {!visibleHistory.length && <div className="nitro-catalog-admin-placeholder is-small">No pending changes.</div>}
            {visibleHistory.map(group => <div key={group.id} className="nitro-catalog-admin-history-row">
                <div className="nitro-catalog-admin-history-main">
                    <strong>{group.summary}</strong>
                    <span>{group.entries.length} affected item(s) &middot; {group.actorName || `User #${group.actorId}`}</span>
                </div>
                <button
                    className="nitro-catalog-admin-btn is-small"
                    disabled={loading}
                    aria-label={`Revert ${group.summary}`}
                    onClick={() => setRevertCandidate(group)}
                >
                    <FaUndo /> Revert
                </button>
            </div>)}
        </div>

        <div className="nitro-catalog-admin-publish-actions">
            <button
                className={`nitro-catalog-admin-btn is-publish ${canPublish ? 'has-pending' : ''}`}
                disabled={!canPublish}
                onClick={() => setPublishConfirmationOpen(true)}
            >
                <FaCloudUploadAlt /> {pendingCount > 0
                    ? `Publish ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'}`
                    : 'Check & publish'}
            </button>
        </div>

        {publishConfirmationOpen && <div className="nitro-catalog-admin-publish-confirmation" role="dialog" aria-modal="true" aria-label="Confirm catalog publication">
            <FaCloudUploadAlt />
            <div>
                <strong>{pendingCount > 0
                    ? `Publish ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'}?`
                    : 'Check live catalog and publish?'}</strong>
                <span>External database changes will be imported automatically unless they conflict with the draft.</span>
            </div>
            <div className="nitro-catalog-admin-publish-actions">
                <button className="nitro-catalog-admin-btn" onClick={() => setPublishConfirmationOpen(false)}>Cancel</button>
                <button className="nitro-catalog-admin-btn is-publish" onClick={publishNow}>Publish now</button>
            </div>
        </div>}

        {revertCandidate && <div className="nitro-catalog-admin-publish-confirmation" role="dialog" aria-modal="true" aria-label="Confirm change revert">
            <FaUndo />
            <div>
                <strong>Revert &ldquo;{revertCandidate.summary}&rdquo;?</strong>
                <span>This change group will be removed from the shared draft.</span>
            </div>
            <div className="nitro-catalog-admin-publish-actions">
                <button className="nitro-catalog-admin-btn" onClick={() => setRevertCandidate(null)}>Cancel</button>
                <button className="nitro-catalog-admin-btn is-publish" onClick={revertNow}>Revert change</button>
            </div>
        </div>}
    </div>;
};

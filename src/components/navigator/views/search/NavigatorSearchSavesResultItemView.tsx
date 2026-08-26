import { NavigatorDeleteSavedSearchComposer, NavigatorSavedSearch } from '@nitrots/nitro-renderer';
import { FC, MouseEvent } from 'react';
import { LocalizeText, localizeWithFallback, SendMessageComposer } from '../../../../api';
import { useNavigatorUiStore } from '../../../../hooks';

export interface NavigatorSearchSavesResultItemViewProps {
    search: NavigatorSavedSearch;
}

const savedSearchLabel = (search: NavigatorSavedSearch) => {
    let code = search.code || '';

    if (code.startsWith('${')) code = code.slice(2, code.length - 1);
    if (code.startsWith('category__')) code = code.slice('category__'.length);

    const title = localizeWithFallback('navigator.searchcode.title.' + code, search.code || code);

    return search.filter ? `${title} - ${search.filter}` : title;
};

/**
 * AIR QuickLinksView clones the `quick_link` region (132x17) per saved search and hides
 * `remove_quick_link` until listItemProcedure sees WME_OVER, so the caption owns the full row width
 * at rest and the button is an overlay at x=115 rather than a reserved track.
 */
export const NavigatorSearchSavesResultItemView: FC<NavigatorSearchSavesResultItemViewProps> = (props) => {
    const { search = null } = props;
    const title = savedSearchLabel(search);

    const openSearch = () => {
        useNavigatorUiStore.getState().setSearch(search.code, search.filter || '');
        useNavigatorUiStore.getState().show();
    };

    const deleteSearch = (event: MouseEvent) => {
        event.stopPropagation();
        SendMessageComposer(new NavigatorDeleteSavedSearchComposer(search.id));
    };

    return (
        <div className="saved-search-row">
            <button type="button" className="saved-search-row__open" title={LocalizeText('navigator.tooltip.open.saved.search')} onClick={openSearch}>
                <span className="saved-search-row__label">{title}</span>
            </button>
            <button
                type="button"
                className="saved-search-row__delete"
                aria-label={`${LocalizeText('navigator.tooltip.remove.saved.search')} ${title}`}
                title={LocalizeText('navigator.tooltip.remove.saved.search')}
                onClick={deleteSearch}
            />
        </div>
    );
};

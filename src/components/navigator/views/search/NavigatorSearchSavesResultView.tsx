import { NavigatorSavedSearch } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { LocalizeText } from '../../../../api';
import quicklinkAdd from '../../../../assets/images/navigator/air/quicklink-add.png';
import { NavigatorSearchSavesResultItemView } from './NavigatorSearchSavesResultItemView';

export interface NavigatorSearchSavesResultViewProps {
    searches: NavigatorSavedSearch[];
}

/**
 * AIR navigator_frame_2 `left_pane` (border style 2 = "white borderless"/border_colorless, 141x538
 * at 6,35). Its header is a second border_colorless tinted 0xfba800, 141x27 at the pane origin, and
 * `left_hide_container` places the icon at (3,3) 18x18 and the caption at (20,2) h17 with
 * text_style id_heading_2 (Ubuntu 12 bold #fff). Those are absolute window coordinates, not a flex
 * row - a gap-based layout pushed the caption 5px right of where AIR draws it.
 *
 * The list is `quicklinks_list` at (5,25) 136x509 with spacing 2, i.e. it starts 2px above the
 * header's bottom edge; the -2px margin below reproduces that overlap.
 */
export const NavigatorSearchSavesResultView: FC<NavigatorSearchSavesResultViewProps> = (props) => {
    const { searches = [] } = props;

    return (
        <div className="nitro-navigator-search-saves-result">
            <div className="nitro-navigator-search-saves-result__header">
                <img className="nitro-navigator-search-saves-result__header-icon" src={quicklinkAdd} alt="" width={18} height={18} />
                <span className="nitro-navigator-search-saves-result__header-label">{LocalizeText('navigator.quick.links.title')}</span>
            </div>
            <div className="nitro-navigator-search-saves-result__list">
                {searches && searches.length > 0 ? (
                    searches.map((search: NavigatorSavedSearch) => <NavigatorSearchSavesResultItemView key={search.id} search={search} />)
                ) : (
                    <div className="nitro-navigator-search-saves-result__empty">
                        <img src={quicklinkAdd} alt="" width={18} height={18} />
                    </div>
                )}
            </div>
        </div>
    );
};

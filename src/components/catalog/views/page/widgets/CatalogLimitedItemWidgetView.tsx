import { FC } from 'react';
import { Offer } from '../../../../../api';
import { LayoutLimitedEditionCompletePlateView } from '../../../../../common';
import { useCatalogData } from '../../../../../hooks';

export const CatalogLimitedItemWidgetView: FC = (props) => {
    const { currentOffer = null } = useCatalogData();

    if (!currentOffer || currentOffer.pricingModel !== Offer.PRICING_MODEL_SINGLE || !currentOffer.product.isUniqueLimitedItem) return null;

    return (
        <div className="w-full">
            {/* Left-aligned, like the original's plaque: centring it walks the text under the
                rotation arrows that share this corner. */}
            <LayoutLimitedEditionCompletePlateView
                uniqueLimitedItemsLeft={currentOffer.product.uniqueLimitedItemsLeft}
                uniqueLimitedSeriesSize={currentOffer.product.uniqueLimitedItemSeriesSize}
            />
        </div>
    );
};

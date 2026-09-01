import { FC } from 'react';
import { GetProductIconUrl, SanitizeHtml } from '../../../../../api';
import { Column, Flex, Grid, Text } from '../../../../../common';
import { useCatalogData } from '../../../../../hooks';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogBundleGridWidgetView } from '../widgets/CatalogBundleGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSimplePriceWidgetView } from '../widgets/CatalogSimplePriceWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutSingleBundleView: FC<CatalogLayoutProps> = (props) => {
    const { page = null } = props;
    const { currentOffer = null } = useCatalogData();
    const mainProduct = currentOffer?.product ?? null;
    const mainIconUrl = mainProduct ? GetProductIconUrl(mainProduct, currentOffer) : null;

    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <Grid>
                {/* Left: main item (1), price (3), teaser image (4) and purchase */}
                <Column gap={1} overflow="hidden" size={5}>
                    <Flex alignItems="center" gap={2}>
                        {mainIconUrl && (
                            <div className="nitro-catalog-bundle-main-item">
                                <img alt="" className="nitro-catalog-grid-offer-icon" draggable={false} src={mainIconUrl} />
                            </div>
                        )}
                        <div className="nitro-catalog-bundle-price">
                            <CatalogSimplePriceWidgetView />
                        </div>
                    </Flex>
                    {!!page.localization.getText(1) && (
                        <Text center small overflow="auto">
                            {page.localization.getText(1)}
                        </Text>
                    )}
                    <Column grow gap={0} overflow="hidden" position="relative">
                        {!!page.localization.getImage(1) && (
                            <img alt="" className="grow! min-h-0 w-full h-full object-contain object-center" src={page.localization.getImage(1)} />
                        )}
                        <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-0 inset-s-0" position="absolute" />
                    </Column>
                </Column>
                {/* Right: "What's Included" header + framed container with all bundle items (2) */}
                <Column gap={1} overflow="hidden" size={7}>
                    {!!page.localization.getText(2) && <Text dangerouslySetInnerHTML={{ __html: SanitizeHtml(page.localization.getText(2)) }} />}
                    <Column className="nitro-catalog-bundle-frame has-classic-scrollbar" overflow="hidden">
                        <CatalogBundleGridWidgetView fullWidth className="nitro-catalog-layout-bundle-grid" columnCount={4} />
                    </Column>
                </Column>
                {/* Full-width purchase footer spanning both columns */}
                <div className="col-span-12 nitro-catalog-bundle-actions">
                    <CatalogPurchaseWidgetView />
                </div>
            </Grid>
        </>
    );
};

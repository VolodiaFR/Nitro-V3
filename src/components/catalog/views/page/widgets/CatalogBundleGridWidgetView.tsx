import { FC, useEffect, useRef } from 'react';
import { GetProductIconUrl } from '../../../../../api';
import { AutoGrid, AutoGridProps, LayoutGridItem } from '../../../../../common';
import { useCatalogData } from '../../../../../hooks';

interface CatalogBundleGridWidgetViewProps extends AutoGridProps {}

export const CatalogBundleGridWidgetView: FC<CatalogBundleGridWidgetViewProps> = (props) => {
    const { columnCount = 5, children = null, ...rest } = props;
    const { currentOffer = null } = useCatalogData();
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (elementRef && elementRef.current) elementRef.current.scrollTop = 0;
    }, [currentOffer]);

    if (!currentOffer) return null;

    return (
        <AutoGrid columnCount={columnCount} innerRef={elementRef} {...rest}>
            {currentOffer.products &&
                currentOffer.products.length > 0 &&
                currentOffer.products.map((product, index) => {
                    const iconUrl = GetProductIconUrl(product, currentOffer);

                    return (
                        <LayoutGridItem key={index} itemCount={product.productCount}>
                            {iconUrl && <img alt="" className="nitro-catalog-grid-offer-icon" draggable={false} src={iconUrl} />}
                        </LayoutGridItem>
                    );
                })}
            {children}
        </AutoGrid>
    );
};

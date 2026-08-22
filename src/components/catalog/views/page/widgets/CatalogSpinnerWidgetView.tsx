import { FC, useEffect, useId, useState } from 'react';
import { CatalogType, GetConfigurationValue, LocalizeText } from '../../../../../api';
import { useCatalogData, useCatalogUiState } from '../../../../../hooks';

const MIN_VALUE: number = 1;
const MAX_VALUE: number = 100;

export const clampCatalogPurchaseQuantity = (value: number): number => {
    if (isNaN(value)) return MIN_VALUE;

    return Math.min(Math.max(Math.trunc(value), MIN_VALUE), MAX_VALUE);
};

export const CatalogSpinnerWidgetView: FC<{}> = () => {
    const { currentOffer = null } = useCatalogData();
    const { currentType = CatalogType.NORMAL, purchaseOptions = null, setPurchaseOptions = null } = useCatalogUiState();
    const quantityInputId = useId();
    const quantity = purchaseOptions?.quantity ?? MIN_VALUE;
    const [quantityDraft, setQuantityDraft] = useState(() => quantity.toString());

    useEffect(() => setQuantityDraft(quantity.toString()), [currentOffer]);

    const updateQuantity = (value: number) => {
        value = clampCatalogPurchaseQuantity(value);

        if (value === quantity) return;

        setPurchaseOptions((prevValue) => {
            const newValue = { ...prevValue };

            newValue.quantity = value;

            return newValue;
        });
    };

    const updateQuantityDraft = (value: string) => {
        if (value.length && !/^\d+$/.test(value)) return;

        if (!value.length) {
            setQuantityDraft('');
            updateQuantity(Number.NaN);
            return;
        }

        const nextQuantity = clampCatalogPurchaseQuantity(Number(value));

        setQuantityDraft(nextQuantity.toString());
        updateQuantity(nextQuantity);
    };

    if (
        !currentOffer?.bundlePurchaseAllowed ||
        currentType === CatalogType.BUILDER ||
        !GetConfigurationValue<boolean>('catalog.multiple.purchase.enabled', true)
    )
        return null;

    return (
        <div className="nitro-catalog-standard-spinner">
            <label className="nitro-catalog-standard-spinner-label" htmlFor={quantityInputId}>
                {LocalizeText('catalog.bundlewidget.quantity')}
            </label>
            <div className="nitro-catalog-standard-spinner-input-frame">
                <input
                    id={quantityInputId}
                    className="nitro-catalog-standard-spinner-value"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={quantityDraft}
                    onChange={(event) => updateQuantityDraft(event.target.value)}
                />
            </div>
        </div>
    );
};

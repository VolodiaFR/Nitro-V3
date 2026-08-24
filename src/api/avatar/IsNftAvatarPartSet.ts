import { IFigurePartSet } from '@nitrots/nitro-renderer';

export const IsNftAvatarPartSet = (
    partSet: IFigurePartSet,
    knownNftFigureSetIds: ReadonlySet<number>,
    detectFromAssets: (partSet: IFigurePartSet) => boolean
): boolean => {
    // NFT clothing is sellable. Shared foundational avatar parts (hd:1/2,
    // bd:1, lh:1, rh:1, and similar) also occur in NFT libraries, so asset
    // membership alone must never move a base figure set out of Generic.
    if (!partSet?.isSellable) return false;

    if (knownNftFigureSetIds.size > 0) return knownNftFigureSetIds.has(partSet.id);

    return detectFromAssets(partSet);
};

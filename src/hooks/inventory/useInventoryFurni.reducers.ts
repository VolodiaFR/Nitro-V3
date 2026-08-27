import {
    CreateLinkEvent,
    FurnitureListAddOrUpdateEvent,
    FurnitureListItemParser,
    FurnitureListRemovedEvent
} from '@nitrots/nitro-renderer';
import {
    addFurnitureItem,
    attemptItemPlacement,
    CloneObject,
    cancelRoomObjectPlacement,
    FurnitureItem,
    GroupItem,
    getAllItemIds,
    getPlacingItemId,
    UnseenItemCategory
} from '../../api';

export interface FurniReducerContext {
    isUnseen: (category: number, id: number) => boolean;
    dispatchAdded: (id: number, type: number, category: number) => void;
}

export const applyFurnitureListAddOrUpdate = (state: GroupItem[], event: FurnitureListAddOrUpdateEvent, ctx: FurniReducerContext): GroupItem[] => {
    const parser = event.getParser();
    const newValue = [...state];

    for (const item of parser.items) {
        let i = 0;
        let matched = false;

        while (i < newValue.length) {
            const group = newValue[i];

            let j = 0;

            while (j < group.items.length) {
                const furniture = group.items[j];

                if (furniture.id === item.itemId) {
                    const clonedGroup = group.clone();
                    const clonedFurniture = furniture.clone();

                    clonedFurniture.update(item);

                    const newFurniture = [...clonedGroup.items];

                    newFurniture[j] = clonedFurniture;

                    clonedGroup.items = newFurniture;
                    clonedGroup.hasUnseenItems = true;

                    newValue[i] = clonedGroup;

                    matched = true;

                    break;
                }

                j++;
            }

            if (matched) break;

            i++;
        }

        if (!matched) {
            const furniture = new FurnitureItem(item);

            addFurnitureItem(newValue, furniture, ctx.isUnseen(UnseenItemCategory.FURNI, item.itemId));

            ctx.dispatchAdded(furniture.id, furniture.type, furniture.category);
        }
    }

    return newValue;
};

export const applyMergedFurnitureList = (state: GroupItem[], fragment: Map<number, FurnitureListItemParser>, ctx: FurniReducerContext): GroupItem[] => {
    const newValue = [...state];
    const existingIds = getAllItemIds(newValue);
    const existingIdSet = new Set(existingIds);

    for (const existingId of existingIds) {
        if (fragment.get(existingId)) continue;

        let index = 0;

        while (index < newValue.length) {
            const originalGroup = newValue[index];

            if (!originalGroup.getItemById(existingId)) {
                index++;

                continue;
            }

            const group = originalGroup.clone();
            const item = group.remove(existingId);

            if (item && getPlacingItemId() === item.ref) {
                queueMicrotask(() => {
                    cancelRoomObjectPlacement();

                    if (!attemptItemPlacement(group)) {
                        CreateLinkEvent('inventory/show');
                    }
                });
            }

            if (group.getTotalCount() <= 0) {
                newValue.splice(index, 1);
            } else {
                newValue[index] = group;
            }

            break;
        }
    }

    for (const itemId of fragment.keys()) {
        if (existingIdSet.has(itemId)) continue;

        const parserItem = fragment.get(itemId);

        if (!parserItem) continue;

        const item = new FurnitureItem(parserItem);

        addFurnitureItem(newValue, item, ctx.isUnseen(UnseenItemCategory.FURNI, itemId));

        ctx.dispatchAdded(item.id, item.type, item.category);
    }

    return newValue;
};

export const applyFurnitureListRemoved = (state: GroupItem[], event: FurnitureListRemovedEvent): GroupItem[] => {
    const parser = event.getParser();
    const newValue = [...state];

    let index = 0;

    while (index < newValue.length) {
        const originalGroup = newValue[index];

        if (!originalGroup.getItemById(parser.itemId)) {
            index++;

            continue;
        }

        const group = CloneObject(originalGroup);
        const item = group.remove(parser.itemId);

        if (item && getPlacingItemId() === item.ref) {
            queueMicrotask(() => {
                cancelRoomObjectPlacement();

                if (!attemptItemPlacement(group)) CreateLinkEvent('inventory/show');
            });
        }

        if (group.getTotalCount() <= 0) {
            newValue.splice(index, 1);
        } else {
            newValue[index] = group;
        }

        break;
    }

    return newValue;
};

export const clearUnseenFlags = (state: GroupItem[]): GroupItem[] => {
    if (!state?.length) return state;

    return state.map((groupItem) => {
        const nextGroupItem = groupItem.clone();

        nextGroupItem.hasUnseenItems = false;

        return nextGroupItem;
    });
};

export const refreshGroupItemsLocalization = (state: GroupItem[]): GroupItem[] => {
    if (!state?.length) return state;

    return state.map((groupItem) => {
        const nextGroupItem = groupItem.clone();

        nextGroupItem.refreshLocalization();

        return nextGroupItem;
    });
};

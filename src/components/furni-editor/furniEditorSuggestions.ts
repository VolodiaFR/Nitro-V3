// Suggestions the furni editor derives from data it already holds: the
// furnidata entry, the classname and the interaction type. Each one names a
// field, the value to put there and the reason, so the view can offer it as a
// one-click chip and the diff modal still confirms the save.

export interface EditableFields {
    width: number;
    length: number;
    allowWalk: boolean;
    allowSit: boolean;
    allowLay: boolean;
    allowTrade: boolean;
    allowRecycle: boolean;
    description: string;
    interactionType: string;
    interactionModesCount: number;
    vendingIds: string;
    multiheight: string;
}

export type SuggestionField = keyof EditableFields;

export interface Suggestion<F extends SuggestionField = SuggestionField> {
    field: F;
    value: EditableFields[F];
    reason: string;
}

// A requirement the type has that the form does not meet and no value can be
// guessed for: shown as a warning, never applied.
export interface Expectation {
    field: SuggestionField;
    message: string;
}

// Types too generic to be inferred from a classname token: "default" would match
// half the hotel and "multiheight" is a behaviour, not a name.
const UNSUGGESTABLE_TYPES = new Set(['default', 'multiheight']);

export const suggestInteractionType = (classname: string, registered: string[]): { type: string; reason: string } | null => {
    const name = classname.trim().toLowerCase();
    if (!name) return null;
    const candidates = registered.filter((type) => !UNSUGGESTABLE_TYPES.has(type.toLowerCase()));

    const exact = candidates.find((type) => type.toLowerCase() === name);
    if (exact) return { type: exact, reason: 'classname is a registered type' };

    const prefix = candidates
        .filter((type) => name.startsWith(`${type.toLowerCase()}_`) || name.startsWith(`${type.toLowerCase()}-`))
        .sort((a, b) => b.length - a.length)[0];
    if (prefix) return { type: prefix, reason: 'classname starts with it' };

    const tokens = name.split(/[_\-*]/).filter(Boolean);
    const token = candidates.filter((type) => tokens.includes(type.toLowerCase())).sort((a, b) => b.length - a.length)[0];
    if (token) return { type: token, reason: 'classname contains it' };

    return null;
};

const asInt = (value: unknown): number | null => {
    const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(n) ? Math.trunc(n) : null;
};

const asBool = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : null);

// What the furnidata entry says about the furni versus what items_base holds.
// The entry is trusted only when the caller has matched it by classname.
export const suggestFromFurnidata = (entry: Record<string, unknown> | null, form: EditableFields): Suggestion[] => {
    if (!entry) return [];
    const out: Suggestion[] = [];
    const from = 'furnidata';

    const xdim = asInt(entry.xdim);
    const ydim = asInt(entry.ydim);
    if (xdim !== null && xdim >= 1 && xdim !== form.width) out.push({ field: 'width', value: xdim, reason: `${from} xdim` });
    if (ydim !== null && ydim >= 1 && ydim !== form.length) out.push({ field: 'length', value: ydim, reason: `${from} ydim` });

    const flags: [SuggestionField & ('allowWalk' | 'allowSit' | 'allowLay' | 'allowTrade' | 'allowRecycle'), string][] = [
        ['allowWalk', 'canstandon'],
        ['allowSit', 'cansiton'],
        ['allowLay', 'canlayon'],
        ['allowTrade', 'tradeable'],
        ['allowRecycle', 'recyclable']
    ];
    for (const [field, key] of flags) {
        const value = asBool(entry[key]);
        if (value !== null && value !== form[field]) out.push({ field, value, reason: `${from} ${key}` });
    }

    const description = typeof entry.description === 'string' ? entry.description.trim() : '';
    if (description && !form.description.trim()) out.push({ field: 'description', value: description, reason: `${from} description, DB is empty` });

    return out;
};

// What a registered interaction type needs from the other fields. Modes are
// the state count the interaction class drives; a type that reads a list
// (vending ids, multiheight) cannot work with that list empty.
const TYPE_MODES: Record<string, number> = {
    gate: 2,
    guild_gate: 2,
    teleport: 2,
    teleporttile: 2,
    pressureplate: 2,
    one_way_gate: 2,
    colorplate: 2
};

const TYPE_NEEDS: Record<string, { field: 'vendingIds' | 'multiheight'; message: string }> = {
    vendingmachine: { field: 'vendingIds', message: 'vendingmachine hands out nothing without vending ids' },
    multiheight: { field: 'multiheight', message: 'multiheight needs its list of heights' }
};

export const expectationsForType = (form: EditableFields): { suggestions: Suggestion[]; warnings: Expectation[] } => {
    const type = form.interactionType.trim().toLowerCase();
    const suggestions: Suggestion[] = [];
    const warnings: Expectation[] = [];
    if (!type) return { suggestions, warnings };

    const modes = TYPE_MODES[type];
    if (modes !== undefined && form.interactionModesCount !== modes) {
        suggestions.push({ field: 'interactionModesCount', value: modes, reason: `${type} drives ${modes} states` });
    }

    const need = TYPE_NEEDS[type];
    if (need && !form[need.field].trim()) warnings.push({ field: need.field, message: need.message });

    return { suggestions, warnings };
};

import { describe, expect, it } from 'vitest';
import {
    EditableFields,
    expectationsForType,
    multiheightMismatch,
    spriteIdMismatch,
    suggestFromFurnidata,
    suggestInteractionType
} from './furniEditorSuggestions';

const registered = ['default', 'gate', 'guild_gate', 'teleport', 'dice', 'vendingmachine', 'multiheight', 'wf_trg_enter_room', 'wf_act_kick_user'];

const form: EditableFields = {
    width: 1,
    length: 1,
    stackHeight: 1.5,
    allowWalk: false,
    allowSit: true,
    allowLay: false,
    allowTrade: true,
    allowRecycle: true,
    description: '',
    interactionType: 'default',
    interactionModesCount: 1,
    vendingIds: '',
    multiheight: ''
};

describe('suggestInteractionType', () => {
    it('takes a classname that is itself a registered type', () => {
        expect(suggestInteractionType('wf_act_kick_user', registered)).toEqual({ type: 'wf_act_kick_user', reason: 'classname is a registered type' });
    });

    it('prefers the longest registered prefix', () => {
        expect(suggestInteractionType('guild_gate_c', registered)?.type).toBe('guild_gate');
        expect(suggestInteractionType('teleport_door', registered)?.type).toBe('teleport');
    });

    it('falls back to a token inside the classname', () => {
        expect(suggestInteractionType('hc_dice_gold', registered)?.type).toBe('dice');
        expect(suggestInteractionType('rare_gate*2', registered)?.type).toBe('gate');
    });

    it('never suggests default or multiheight, and nothing for an unrelated classname', () => {
        expect(suggestInteractionType('default_chair', registered)).toBeNull();
        expect(suggestInteractionType('multiheight_bed', registered)).toBeNull();
        expect(suggestInteractionType('throne', registered)).toBeNull();
        expect(suggestInteractionType('', registered)).toBeNull();
    });
});

describe('suggestFromFurnidata', () => {
    it('proposes the furnidata footprint and flags when they differ from the form', () => {
        const entry = { xdim: 2, ydim: 3, canstandon: true, cansiton: true, canlayon: false, tradeable: false, recyclable: true, description: 'Royal seat' };

        expect(suggestFromFurnidata(entry, form)).toEqual([
            { field: 'width', value: 2, reason: 'furnidata xdim' },
            { field: 'length', value: 3, reason: 'furnidata ydim' },
            { field: 'allowWalk', value: true, reason: 'furnidata canstandon' },
            { field: 'allowTrade', value: false, reason: 'furnidata tradeable' },
            { field: 'description', value: 'Royal seat', reason: 'furnidata description, DB is empty' }
        ]);
    });

    it('keeps quiet when everything agrees, the DB description is set, or the entry is missing', () => {
        const entry = { xdim: 1, ydim: 1, canstandon: false, cansiton: true, canlayon: false, tradeable: true, recyclable: true, description: 'x' };

        expect(suggestFromFurnidata(entry, { ...form, description: 'already here' })).toEqual([]);
        expect(suggestFromFurnidata(null, form)).toEqual([]);
    });

    it('ignores a wall entry without dimensions and odd values', () => {
        expect(suggestFromFurnidata({ classname: 'post.it', xdim: 'abc', cansiton: 'maybe' }, form)).toEqual([]);
        expect(suggestFromFurnidata({ xdim: 0 }, form)).toEqual([]);
    });
});

describe('expectationsForType', () => {
    it('suggests the state count a gate drives', () => {
        expect(expectationsForType({ ...form, interactionType: 'gate' })).toEqual({
            suggestions: [{ field: 'interactionModesCount', value: 2, reason: 'gate drives 2 states' }],
            warnings: []
        });
        expect(expectationsForType({ ...form, interactionType: 'Gate', interactionModesCount: 2 }).suggestions).toEqual([]);
    });

    it('warns when a list-driven type has its list empty', () => {
        expect(expectationsForType({ ...form, interactionType: 'vendingmachine' }).warnings).toEqual([
            { field: 'vendingIds', message: 'vendingmachine hands out nothing without vending ids' }
        ]);
        expect(expectationsForType({ ...form, interactionType: 'vendingmachine', vendingIds: '1' }).warnings).toEqual([]);
        expect(expectationsForType({ ...form, interactionType: 'multiheight' }).warnings[0].field).toBe('multiheight');
    });

    it('has nothing to say for an empty or unknown type', () => {
        expect(expectationsForType(form)).toEqual({ suggestions: [], warnings: [] });
        expect(expectationsForType({ ...form, interactionType: '' })).toEqual({ suggestions: [], warnings: [] });
        expect(expectationsForType({ ...form, interactionType: 'wf_trg_enter_room' })).toEqual({ suggestions: [], warnings: [] });
    });
});

describe('stack height, sprite id and multiheight checks', () => {
    it('proposes the furnidata height as stack height when it differs', () => {
        expect(suggestFromFurnidata({ height: 1 }, form)).toEqual([{ field: 'stackHeight', value: 1, reason: 'furnidata height' }]);
        expect(suggestFromFurnidata({ height: 1.5 }, form)).toEqual([]);
    });

    it('reports a furnidata id that is not the sprite id', () => {
        expect(spriteIdMismatch({ id: 4201 }, 4200)).toBe(4201);
        expect(spriteIdMismatch({ id: 4200 }, 4200)).toBeNull();
        expect(spriteIdMismatch({}, 4200)).toBeNull();
        expect(spriteIdMismatch(null, 4200)).toBeNull();
    });

    it('compares the multiheight list with the asset state count', () => {
        const mh = { ...form, interactionType: 'multiheight', multiheight: '0.5, 1.0, 1.5' };
        expect(multiheightMismatch(mh, 5)).toEqual({ field: 'multiheight', message: '3 heights for 5 states in the asset' });
        expect(multiheightMismatch(mh, 3)).toBeNull();
        expect(multiheightMismatch(mh, null)).toBeNull();
        expect(multiheightMismatch({ ...mh, multiheight: '' }, 5)).toBeNull();
        expect(multiheightMismatch({ ...mh, interactionType: 'gate' }, 5)).toBeNull();
    });
});

import { describe, expect, it } from 'vitest';
import { suggestInteractionType } from './FurniEditorEditView';

const registered = ['default', 'gate', 'guild_gate', 'teleport', 'dice', 'vendingmachine', 'multiheight', 'wf_trg_enter_room', 'wf_act_kick_user'];

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

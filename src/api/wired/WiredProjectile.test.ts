import { describe, expect, it } from 'vitest';
import {
    clampProjectileParam,
    defaultProjectileParams,
    normalizeProjectileParams,
    PROJECTILE_PARAM_COUNT,
    PROJECTILE_PARAM_CURVE_STRENGTH,
    PROJECTILE_PARAM_DIRECTIONAL_SYSTEM,
    PROJECTILE_PARAM_DISTANCE_TILES,
    PROJECTILE_PARAM_ROTATE,
    PROJECTILE_PARAM_ROTATION_OFFSET,
    PROJECTILE_PARAM_TIME_PER_TILE,
    PROJECTILE_SYSTEM_EIGHT_DIFFUSE,
    PROJECTILE_SYSTEM_EIGHT_STRAIGHT,
    PROJECTILE_SYSTEM_FOUR_PREFER_HORIZONTAL,
    PROJECTILE_SYSTEM_FOUR_PREFER_VERTICAL,
    resolveProjectileDirection
} from './WiredProjectile';

describe('projectile add-on params', () => {
    it('starts a fresh box turning its projectiles', () => {
        const params = defaultProjectileParams();

        expect(params).toHaveLength(PROJECTILE_PARAM_COUNT);
        expect(params[PROJECTILE_PARAM_ROTATE]).toBe(1);
        expect(params.filter((value) => value !== 0)).toEqual([1]);
    });

    it('carries the params this window does not edit through a save untouched', () => {
        // Nineteen, each away from its default: timing, distance and curve set by another client.
        const saved = [1, 3, 1, 1, 250, 2, 1, 1, 1, 75, 6, 5, 1, 1, 2, 1, -12, 3, 400];

        expect(normalizeProjectileParams(saved)).toEqual(saved);
    });

    it('pads a short box and cuts a long one to the nineteen the server reads', () => {
        const short = normalizeProjectileParams([0, 2]);

        expect(short).toHaveLength(PROJECTILE_PARAM_COUNT);
        expect(short[PROJECTILE_PARAM_ROTATE]).toBe(0);
        expect(short[PROJECTILE_PARAM_DIRECTIONAL_SYSTEM]).toBe(2);
        expect(short[PROJECTILE_PARAM_ROTATION_OFFSET]).toBe(0);
        expect(normalizeProjectileParams(new Array(30).fill(1))).toHaveLength(PROJECTILE_PARAM_COUNT);
        expect(normalizeProjectileParams(null)).toEqual(defaultProjectileParams());
    });
});

describe('projectile direction picture', () => {
    it('resolves each system the way the server does', () => {
        // One step each way under eight straight: the room's own compass, north towards smaller y.
        expect([
            [0, -1],
            [1, -1],
            [1, 0],
            [1, 1],
            [0, 1],
            [-1, 1],
            [-1, 0],
            [-1, -1]
        ].map(([dx, dy]) => resolveProjectileDirection(PROJECTILE_SYSTEM_EIGHT_STRAIGHT, dx, dy))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_EIGHT_STRAIGHT, 5, 1)).toBe(3);
        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_EIGHT_DIFFUSE, 5, 1)).toBe(2);
        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_EIGHT_DIFFUSE, 5, 3)).toBe(3);
        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_FOUR_PREFER_VERTICAL, 3, 3)).toBe(4);
        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_FOUR_PREFER_HORIZONTAL, 3, 3)).toBe(2);
        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_FOUR_PREFER_VERTICAL, -2, -2)).toBe(0);
        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_FOUR_PREFER_HORIZONTAL, -2, -2)).toBe(6);
        expect(resolveProjectileDirection(PROJECTILE_SYSTEM_EIGHT_STRAIGHT, 0, 0)).toBe(-1);
    });

    it('keeps an edited param inside what the server accepts', () => {
        expect(clampProjectileParam(PROJECTILE_PARAM_ROTATION_OFFSET, 9)).toBe(7);
        expect(clampProjectileParam(PROJECTILE_PARAM_DISTANCE_TILES, -80)).toBe(-64);
        expect(clampProjectileParam(PROJECTILE_PARAM_CURVE_STRENGTH, 12.7)).toBe(12);
        expect(clampProjectileParam(PROJECTILE_PARAM_TIME_PER_TILE, Number.NaN)).toBe(0);
    });
});

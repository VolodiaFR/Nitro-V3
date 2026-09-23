export const PROJECTILE_PARAM_COUNT = 19;
export const PROJECTILE_PARAM_ROTATE = 0;
export const PROJECTILE_PARAM_DIRECTIONAL_SYSTEM = 1;
export const PROJECTILE_PARAM_SCALE_TIME_WITH_DISTANCE = 2;
export const PROJECTILE_PARAM_TIME_PER_TILE = 4;
export const PROJECTILE_PARAM_DISTANCE_BY_X = 6;
export const PROJECTILE_PARAM_DISTANCE_BY_Y = 7;
export const PROJECTILE_PARAM_DISTANCE_BY_HEIGHT = 8;
export const PROJECTILE_PARAM_SPEED_INCREASE = 9;
export const PROJECTILE_PARAM_ROTATION_OFFSET = 10;
export const PROJECTILE_PARAM_INTERNAL_VARIABLES = 11;
export const PROJECTILE_PARAM_CHANGE_SHOOTER_DIRECTION = 12;
export const PROJECTILE_PARAM_BUNNY_HOP = 13;
export const PROJECTILE_PARAM_DISTANCE_MODE = 14;
export const PROJECTILE_PARAM_DISTANCE_TILES = 16;
export const PROJECTILE_PARAM_CURVE_STRENGTH = 18;

export const PROJECTILE_PARAM_BOUNDS: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [0, 3],
    [0, 1],
    [0, 1],
    [0, 100_000],
    [0, 3],
    [0, 1],
    [0, 1],
    [0, 1],
    [0, 100_000],
    [0, 7],
    [0, 127],
    [0, 1],
    [0, 1],
    [0, 2],
    [0, 1],
    [-64, 64],
    [0, 3],
    [-1000, 1000]
];

export const PROJECTILE_SYSTEM_EIGHT_STRAIGHT = 0;
export const PROJECTILE_SYSTEM_EIGHT_DIFFUSE = 1;
export const PROJECTILE_SYSTEM_FOUR_PREFER_VERTICAL = 2;
export const PROJECTILE_SYSTEM_FOUR_PREFER_HORIZONTAL = 3;

export const PROJECTILE_DISTANCE_NORMAL = 0;
export const PROJECTILE_DISTANCE_OVERSHOOT = 1;
export const PROJECTILE_DISTANCE_FIXED = 2;

export const PROJECTILE_INTERNAL_VARIABLES: ReadonlyArray<string> = [
    '@projectile.animation.position.x',
    '@projectile.animation.position.y',
    '@projectile.animation.position.altitude',
    '@projectile.animation.is_traveling',
    '@projectile.animation.tiles_traveled',
    '@projectile.animation.furni_collisions',
    '@projectile.animation.user_collisions'
];

export const defaultProjectileParams = (): number[] => {
    const params = new Array<number>(PROJECTILE_PARAM_COUNT).fill(0);

    params[PROJECTILE_PARAM_ROTATE] = 1;

    return params;
};

export const normalizeProjectileParams = (raw: number[] | null | undefined): number[] => {
    const params = defaultProjectileParams();

    if (!raw?.length) return params;

    for (let index = 0; index < PROJECTILE_PARAM_COUNT && index < raw.length; index++) {
        const value = raw[index];

        if (Number.isFinite(value)) params[index] = Math.trunc(value);
    }

    return params;
};

export const clampProjectileParam = (index: number, value: number): number => {
    const [min, max] = PROJECTILE_PARAM_BOUNDS[index] ?? [0, 0];
    const whole = Number.isFinite(value) ? Math.trunc(value) : 0;

    return Math.max(min, Math.min(max, whole));
};

const DIFFUSE_AXIS_SLOPE = 0.41421356237309503;

export const resolveProjectileDirection = (system: number, dx: number, dy: number): number => {
    if (dx === 0 && dy === 0) return -1;

    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    const normalized = system >= PROJECTILE_SYSTEM_EIGHT_STRAIGHT && system <= PROJECTILE_SYSTEM_FOUR_PREFER_HORIZONTAL ? system : PROJECTILE_SYSTEM_EIGHT_STRAIGHT;

    let diagonal = false;

    if (normalized === PROJECTILE_SYSTEM_EIGHT_STRAIGHT) diagonal = ax !== 0 && ay !== 0;
    else if (normalized === PROJECTILE_SYSTEM_EIGHT_DIFFUSE) diagonal = Math.min(ax, ay) > Math.max(ax, ay) * DIFFUSE_AXIS_SLOPE;

    if (diagonal) {
        if (dx > 0) return dy > 0 ? 3 : 1;

        return dy > 0 ? 5 : 7;
    }

    const horizontal = normalized === PROJECTILE_SYSTEM_FOUR_PREFER_VERTICAL ? ax > ay : ax >= ay;

    if (horizontal) return dx > 0 ? 2 : 6;

    return dy > 0 ? 4 : 0;
};

export const isFourWayProjectileSystem = (system: number): boolean =>
    system === PROJECTILE_SYSTEM_FOUR_PREFER_VERTICAL || system === PROJECTILE_SYSTEM_FOUR_PREFER_HORIZONTAL;

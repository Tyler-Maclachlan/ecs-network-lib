import type { Entity } from '@core/ecs';

const forceX: Record<Entity, number> = {};
const forceY: Record<Entity, number> = {};

export const DebugGravity = {
    add(entity: Entity, fx: number, fy: number) {
        forceX[entity] = fx;
        forceY[entity] = fy;
    },

    has(entity: Entity): boolean {
        return entity in forceX;
    },

    remove(entity: Entity) {
        delete forceX[entity];
        delete forceY[entity];
    },

    get forceX() {
        return forceX;
    },

    get forceY() {
        return forceY;
    },
};

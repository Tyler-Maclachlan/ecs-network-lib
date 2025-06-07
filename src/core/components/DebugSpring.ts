import type { Entity } from '@core/ecs';

const source: Record<Entity, Entity> = {};
const target: Record<Entity, Entity> = {};
const forceX: Record<Entity, number> = {};
const forceY: Record<Entity, number> = {};

export const DebugSpring = {
    add(entity: Entity, sourceEntity: Entity, targetEntity: Entity, fx: number, fy: number) {
        source[entity] = sourceEntity;
        target[entity] = targetEntity;
        forceX[entity] = fx;
        forceY[entity] = fy;
    },

    has(entity: Entity): boolean {
        return entity in source;
    },

    remove(entity: Entity) {
        delete source[entity];
        delete target[entity];
        delete forceX[entity];
        delete forceY[entity];
    },

    get source() {
        return source;
    },

    get target() {
        return target;
    },

    get forceX() {
        return forceX;
    },

    get forceY() {
        return forceY;
    },
};

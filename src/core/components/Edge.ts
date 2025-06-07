import type { Entity } from '@core/ecs';

const from: Entity[] = [];
const to: Entity[] = [];
const has = new Uint8Array(100_00);

export const Edge = {
    from,
    to,
    has,
    add(id: Entity, source: Entity, target: Entity) {
        from[id] = source;
        to[id] = target;
        has[id] = 1;
    },
    remove(id: Entity) {
        has[id] = 0;
    },
    hasComponent(id: Entity) {
        return has[id] === 1;
    },
    getSource(id: Entity) {
        return from[id];
    },
    getTarget(id: Entity) {
        return to[id];
    }
}
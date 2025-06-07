import type { Entity } from "@core/ecs";

const X = new Float32Array(100_000);
const Y = new Float32Array(100_000);
const has = new Uint8Array(100_000);

export const Velocity = {
    X,
    Y,
    has,
    add(id: Entity, x = 0, y = 0) {
        X[id] = x;
        Y[id] = y;
        has[id] = 1;
    },
    remove(id: Entity) {
        has[id] = 0;
    },
    hasComponent(id: Entity) {
        return has[id] === 1;
    }
}

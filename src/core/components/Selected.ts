import type { Entity } from "@core/ecs";

const selected: Set<Entity> = new Set();

export const Selected = {
    add(entity: Entity) {
        selected.add(entity);
    },

    has(entity: Entity): boolean {
        return selected.has(entity);
    },

    remove(entity: Entity) {
        selected.delete(entity);
    },

    clearAll() {
        selected.clear();
    },

    get all(): Entity[] {
        return [...selected];
    },
};

// @core/components/FixedPosition.ts
import type { Entity } from "@core/ecs";

const store: Set<Entity> = new Set();

export const FixedPosition = {
  add(entity: Entity) {
    store.add(entity);
  },

  remove(entity: Entity) {
    store.delete(entity);
  },

  has(entity: Entity): boolean {
    return store.has(entity);
  },

  get all(): Iterable<Entity> {
    return store.values();
  }
};

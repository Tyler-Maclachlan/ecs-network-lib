import type { World } from "@core/ecs";

export interface System {
    update(world: World, delta: number): void;
}
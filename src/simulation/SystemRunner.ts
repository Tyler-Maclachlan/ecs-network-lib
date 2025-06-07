import type { System } from "@core/systems/System";
import type { World } from "@core/ecs";

export class SystemRunner {
    private systems: System[] = [];
    private lastTime = performance.now();
    private world: World

    constructor(world: World) {
        this.world = world;
    }

    addSystem(system: System): void {
        this.systems.push(system);
    }

    start() {
        const loop = () => {
            const currentTime = performance.now();
            const delta = currentTime - this.lastTime;
            this.lastTime = currentTime;

            for (const system of this.systems) {
                system.update(this.world, delta);
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }
}
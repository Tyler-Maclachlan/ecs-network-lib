import type { System } from "@core/systems/System";
import type { Entity, World } from "@core/ecs";
import { Position } from "@core/components/Position";
import { Velocity } from "@core/components/Velocity";
import { Edge } from "@core/components/Edge";

import { DebugSpring } from "@core/components/DebugSpring";
import { DebugRepulsion } from "@core/components/DebugRepulsion";
import { DebugGravity } from "@core/components/DebugGravity";
import { FixedPosition } from "@core/components/FixedPosition";

export interface PhysicsConfig {
    repulsionStrength: number;
    springLength: number;
    springStiffness: number;
    damping: number;
    gravityStrength: number;
    maxVelocity: number;
}

const defaultConfig: PhysicsConfig = {
    repulsionStrength: 1000,
    springLength: 50,
    springStiffness: 0.08,
    damping: 0.85,
    gravityStrength: 0.002,
    maxVelocity: 5
};

export class PhysicsSystem implements System {
    private config: PhysicsConfig;

    constructor(config: Partial<PhysicsConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    update(world: World, delta: number): void {
        const {
            repulsionStrength,
            springLength,
            springStiffness,
            damping,
            gravityStrength,
            maxVelocity
        } = this.config;

        const entities = world.getEntities();
        const seen = new Set<Entity>();

        // Clear debug data
        for (const entity of entities) {
            DebugSpring.remove(entity);
            DebugRepulsion.remove(entity);
            DebugGravity.remove(entity);
        }

        // 1. Repulsion
        for (const a of entities) {
            if (!Position.hasComponent(a) || FixedPosition.has(a)) continue;

            //seen.add(a);

            for (const b of entities) {
                if (a === b || !Position.hasComponent(b) || FixedPosition.has(b)) continue;

                const dx = Position.X[a] - Position.X[b];
                const dy = Position.Y[a] - Position.Y[b];
                const distSq = dx * dx + dy * dy;

                if (distSq === 0) continue;

                const dist = Math.sqrt(distSq);
                const force = repulsionStrength / distSq;

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (Velocity.hasComponent(a)) {
                    Velocity.X[a] += fx * delta;
                    Velocity.Y[a] += fy * delta;
                }

                if (Velocity.hasComponent(b)) {
                    Velocity.X[b] -= fx * delta;
                    Velocity.Y[b] -= fy * delta;
                }

                DebugRepulsion.add(a, a, b, fx, fy);
                DebugRepulsion.add(b, b, a, -fx, -fy);
            }
        }

        // 2. Gravity toward center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (const entity of entities) {
            if (!Position.hasComponent(entity) || !Velocity.hasComponent(entity) || FixedPosition.has(entity)) continue;

            const dx = centerX - Position.X[entity];
            const dy = centerY - Position.Y[entity];

            const fx = dx * gravityStrength * delta * 0.001;
            const fy = dy * gravityStrength * delta * 0.001;

            Velocity.X[entity] += fx;
            Velocity.Y[entity] += fy;

            DebugGravity.add(entity, fx, fy);
        }

        // 3. Apply spring force
        for (const entity of entities) {
            if (!Edge.hasComponent(entity)) continue;

            const a = Edge.getSource(entity);
            const b = Edge.getTarget(entity);

            if (!Position.hasComponent(a) || !Position.hasComponent(b)) continue;

            const dx = Position.X[b] - Position.X[a];
            const dy = Position.Y[b] - Position.Y[a];

            const dist = Math.sqrt(dx * dx + dy * dy);
            const deltaLength = dist - springLength;
            const force = springStiffness * deltaLength;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (Velocity.hasComponent(a)) {
                Velocity.X[a] += fx * delta;
                Velocity.Y[a] += fy * delta;
            }

            if (Velocity.hasComponent(b)) {
                Velocity.X[b] -= fx * delta;
                Velocity.Y[b] -= fy * delta;
            }

            DebugSpring.add(entity, a, b, fx, fy);
        }

        // 4. Apply velocity + damping + clamp
        for (const entity of entities) {
            if (!Position.hasComponent(entity) || !Velocity.hasComponent(entity) || FixedPosition.has(entity)) continue;

            let vx = Velocity.X[entity];
            let vy = Velocity.Y[entity];

            const speedSq = vx * vx + vy * vy;
            if (speedSq > maxVelocity * maxVelocity) {
                const speed = Math.sqrt(speedSq);
                vx = (vx / speed) * maxVelocity;
                vy = (vy / speed) * maxVelocity;
                Velocity.X[entity] = vx;
                Velocity.Y[entity] = vy;
            }

            Position.X[entity] += vx * delta;
            Position.Y[entity] += vy * delta;

            Velocity.X[entity] *= damping;
            Velocity.Y[entity] *= damping;
        }
    }
}

import { World } from "@core/ecs";
import { Position } from "@core/components/Position";
import { Velocity } from "@core/components/Velocity";
import { SystemRunner } from "@sim/SystemRunner";
import { PhysicsSystem } from "@sim/PhysicsSystem";
import { PixiRenderer } from "@render/PixiRenderer";
import { Edge } from "@core/components/Edge";

import { generateScaleFreeGraph } from "@utils/generateScaleFreeGraph";
import { InteractionSystem } from "@core/systems/InteractionSystem";

const world = new World();
const runner = new SystemRunner(world);

// Setup Pixi and mount it to the body
const pixi = await PixiRenderer.create(document.getElementById('app') || document.body);
runner.addSystem(pixi);

const interaction = new InteractionSystem(pixi.app)
interaction.init(world);
runner.addSystem(interaction);

// Add physics
runner.addSystem(new PhysicsSystem({
    repulsionStrength: 2000,
    springLength: 100,
    springStiffness: 0.001,
    damping: 0.85,
    gravityStrength: 0.002,
    maxVelocity: 5,
}));


const { nodes, edges } = generateScaleFreeGraph(100);

// Add some test entities
for (const { id } of nodes) {
  const entity = world.createEntity(); // will match id == entity due to simple incrementing
  const x = 400 + Math.random() * 200 - 100;
  const y = 300 + Math.random() * 200 - 100;
  const vx = 0// (Math.random() - 0.5) * 0.05;
  const vy = 0//(Math.random() - 0.5) * 0.05;

  Position.add(entity, x, y);
  Velocity.add(entity, vx, vy);
  pixi.addNode(entity);
}

for (const { from, to } of edges) {
  const id = world.createEntity();
  Edge.add(id, from, to);
  pixi.addEdge(id);
}

runner.start();

import {
    Application,
    Container,
    FederatedPointerEvent,
    Graphics,
    Text,
} from "pixi.js";

import type { System } from "@core/systems/System";
import type { Entity, World } from "@core/ecs";

import { Position } from "@core/components/Position";
import { Edge } from "@core/components/Edge";
import { Velocity } from "@core/components/Velocity";

import { DebugSpring } from "@core/components/DebugSpring";
import { DebugRepulsion } from "@core/components/DebugRepulsion";
import { DebugGravity } from "@core/components/DebugGravity";
import { FixedPosition } from "@core/components/FixedPosition";

export class PixiRenderer implements System {
    public app: Application;

    private networkContainer = new Container();
    private nodeContiner = new Container();
    private edgeContainer = new Container();
    private debugContainer = new Container();

    private nodeGraphics = new Map<Entity, Graphics>();
    private nodeLabels = new Map<Entity, Text>();

    private edgeGraphics = new Map<Entity, Graphics>();
    private edgeLabels = new Map<Entity, Text>();

    private velocityArrows = new Map<Entity, Graphics>();
    private springLines = new Map<Entity, Graphics>();
    private repulsionLines = new Map<Entity, Graphics>();
    private gravityLines = new Map<Entity, Graphics>();
    private gravityCrosshair: Graphics | null = null;

    private isPanning = false;
    private lastPanX = 0;
    private lastPanY = 0;
    private zoom = 1;
    private draggingNode: Entity | null = null;
    private dragOffset = { x: 0, y: 0 };



    private debugMode = true;

    private constructor(app: Application) {
        this.app = app;

        this.networkContainer.addChild(this.edgeContainer);
        this.networkContainer.addChild(this.nodeContiner);

        if (this.debugMode) {
            this.networkContainer.addChild(this.debugContainer);
        }

        this.app.stage.addChild(this.networkContainer);
        this.setupInteractionHandlers();


        if (this.debugMode) {
            this.setupStaticDebugElements();
        }
    }

    static async create(container: HTMLElement): Promise<PixiRenderer> {
        const app = new Application();

        await app.init({
            background: `#202020`,
            resizeTo: container,
            antialias: true,
        });

        container.appendChild(app.canvas);

        return new PixiRenderer(app);
    }

    addNode(entity: Entity): void {
        const g = new Graphics();
        g.circle(0, 0, 20).fill(0x00ffff);
        this.nodeContiner.addChild(g);
        this.nodeGraphics.set(entity, g);

        g.eventMode = "static";
        g.cursor = "grab";
        g.on("pointerdown", (event) => this.onNodeDragStart(entity, event));


        const label = new Text({
            text: String(entity),
            style: {
                fill: 0xffffff,
                fontSize: 24,
                fontFamily: "Arial",
            },
            anchor: 0.5,
        });
        this.debugContainer.addChild(label);
        this.nodeLabels.set(entity, label);
    }

    removeNode(entity: Entity): void {
        this.nodeContiner.removeChild(this.nodeGraphics.get(entity)!);
        this.debugContainer.removeChild(this.nodeLabels.get(entity)!);
        this.nodeGraphics.delete(entity);
        this.nodeLabels.delete(entity);

        const arrow = this.velocityArrows.get(entity);
        if (arrow) {
            this.debugContainer.removeChild(arrow);
            this.velocityArrows.delete(entity);
        }
    }

    private onNodeDragStart(entity: Entity, event: FederatedPointerEvent) {
        this.draggingNode = entity;
        const g = this.nodeGraphics.get(entity);
        if (!g) return;

        FixedPosition.add(entity); // Prevent physics from moving this node
        g.cursor = "grabbing";

        const localPos = event.getLocalPosition(this.networkContainer);
        const nodeX = Position.X[entity];
        const nodeY = Position.Y[entity];

        this.dragOffset.x = nodeX - localPos.x;
        this.dragOffset.y = nodeY - localPos.y;

        this.app.stage.on("pointermove", this.onNodeDragMove, this);
        this.app.stage.on("pointerup", this.onNodeDragEnd, this);
        this.app.stage.on("pointerupoutside", this.onNodeDragEnd, this);
    }

    private onNodeDragMove(event: FederatedPointerEvent) {
        if (this.draggingNode === null) return;

        const localPos = event.getLocalPosition(this.networkContainer);
        const entity = this.draggingNode;

        Position.X[entity] = localPos.x + this.dragOffset.x;
        Position.Y[entity] = localPos.y + this.dragOffset.y;

        if (Velocity.hasComponent(entity)) {
            Velocity.X[entity] = 0;
            Velocity.Y[entity] = 0;
        }
    }

    private onNodeDragEnd() {
        if (this.draggingNode !== null) {
            const g = this.nodeGraphics.get(this.draggingNode);
            if (g) g.cursor = "grab";
            FixedPosition.remove(this.draggingNode!);
        }

        this.draggingNode = null;
        
        this.app.stage.off("pointermove", this.onNodeDragMove, this);
        this.app.stage.off("pointerup", this.onNodeDragEnd, this);
        this.app.stage.off("pointerupoutside", this.onNodeDragEnd, this);
    }


    addEdge(entity: Entity): void {
        const g = new Graphics();
        this.edgeContainer.addChild(g);
        this.edgeGraphics.set(entity, g);

        const label = new Text({
            text: '', // will be updated in `update`
            style: {
                fill: 0xffffff,
                fontSize: 14,
                fontFamily: 'Arial',
            },
            anchor: 0.5,
        });
        this.debugContainer.addChild(label);
        this.edgeLabels.set(entity, label);
    }

    removeEdge(entity: Entity): void {
        const g = this.edgeGraphics.get(entity);
        if (g) {
            this.edgeContainer.removeChild(g);
            this.edgeGraphics.delete(entity);
        }

        const label = this.edgeLabels.get(entity);
        if (label) {
            this.debugContainer.removeChild(label);
            this.edgeLabels.delete(entity);
        }
    }

    update(world: World, _delta: number): void {
        for (const entity of world.getEntities()) {
            if (Position.hasComponent(entity)) {
                const g = this.nodeGraphics.get(entity);
                if (g) {
                    g.x = Position.X[entity];
                    g.y = Position.Y[entity];
                }

                const label = this.nodeLabels.get(entity);
                if (label) {
                    label.x = Position.X[entity];
                    label.y = Position.Y[entity] - 10;
                }
            }

            if (Edge.hasComponent(entity)) {
                const g = this.edgeGraphics.get(entity);
                if (!g) continue;

                const fromId = Edge.getSource(entity);
                const toId = Edge.getTarget(entity);

                if (!Position.hasComponent(fromId) || !Position.hasComponent(toId)) continue;

                const x1 = Position.X[fromId];
                const y1 = Position.Y[fromId];
                const x2 = Position.X[toId];
                const y2 = Position.Y[toId];

                g.clear();
                g.moveTo(x1, y1).lineTo(x2, y2).stroke({ 
                    width: 4,
                    color: 0xffffff,
                });

                const label = this.edgeLabels.get(entity);
                if (label) {
                    label.text = `${fromId} -> ${toId}`;
                    label.x = (x1 + x2) / 2;
                    label.y = (y1 + y2) / 2 - 8;
                }
            }
        }

        if (this.debugMode) {
            // this.renderDebugArrows(world);
            this.renderDebugSprings(world);
            this.renderDebugRepulsions(world);
            this.renderDebugGravities(world);
        }
    }

    private setupInteractionHandlers() {
        const stage = this.app.stage;
        const canvas = this.app.canvas;

        stage.eventMode = "static"; // Use static event mode for better performance
        stage.hitArea = this.app.screen; // Make the whole stage interactive

        stage.on("pointerdown", (e) => {
            if (e.button === 0) { // left button
                this.isPanning = true;
                this.lastPanX = e.clientX;
                this.lastPanY = e.clientY;
            }
        });

        stage.on("pointerup", () => {
            this.isPanning = false;
        })

        stage.on("pointerupoutside", () => {
            this.isPanning = false;
        });

        stage.on('pointermove', (e) => {
            if (this.draggingNode !== null || !this.isPanning) return; // 👈 Skip panning if dragging a node

            const pos = e.global;
            const dx = pos.x - this.lastPanX;
            const dy = pos.y - this.lastPanY;

            this.networkContainer.x += dx;
            this.networkContainer.y += dy;

            this.lastPanX = pos.x;
            this.lastPanY = pos.y;
        });

        stage.on('wheel', (e) => {
            e.preventDefault();

            const scaleFactor = 1.1;
            const mouse = { x: e.clientX, y: e.clientY };

            const worldPos = {
                x: (mouse.x - this.networkContainer.x) / this.zoom,
                y: (mouse.y - this.networkContainer.y) / this.zoom,
            };

            const direction = e.deltaY > 0 ? 1 : -1;
            const zoomChange = direction > 0 ? 1 / scaleFactor : scaleFactor;
            this.zoom *= zoomChange;

            this.networkContainer.scale.set(this.zoom);

            const newScreenPos = {
                x: worldPos.x * this.zoom + this.networkContainer.x,
                y: worldPos.y * this.zoom + this.networkContainer.y,
            };

            // Adjust position to keep zoom centered on mouse
            this.networkContainer.x += mouse.x - newScreenPos.x;
            this.networkContainer.y += mouse.y - newScreenPos.y;
        })
    }


    private setupStaticDebugElements() {
        this.gravityCrosshair = new Graphics();
        this.debugContainer.addChild(this.gravityCrosshair);
    }

    private renderDebugArrows(world: World) {
        for (const entity of world.getEntities()) {
            if (!Position.hasComponent(entity) || !Velocity.hasComponent(entity)) continue;

            const x = Position.X[entity];
            const y = Position.Y[entity];
            const vx = Velocity.X[entity];
            const vy = Velocity.Y[entity];

            let arrow = this.velocityArrows.get(entity);
            if (!arrow) {
                arrow = new Graphics();
                this.velocityArrows.set(entity, arrow);
                this.debugContainer.addChild(arrow);
            }

            arrow.clear();
            arrow
                .moveTo(x, y)
                .lineTo(x + vx * 50, y + vy * 50)
                .stroke({ width: 1, color: 0x00ffff, alpha: 0.7 });
        }
    }

    private renderDebugSprings(world: World) {
        for (const entity of world.getEntities()) {
            if (!DebugSpring.has(entity)) continue;

            const fromId = DebugSpring.source[entity];
            if (!Position.hasComponent(fromId)) continue;

            const x = Position.X[fromId];
            const y = Position.Y[fromId];
            const fx = DebugSpring.forceX[entity];
            const fy = DebugSpring.forceY[entity];

            let g = this.springLines.get(entity);
            if (!g) {
                g = new Graphics();
                this.springLines.set(entity, g);
                this.debugContainer.addChild(g);
            }

            g.clear();
            g.moveTo(x, y).lineTo(x + fx * 100, y + fy * 100)
                .stroke({ width: 1, color: 0xff0000, alpha: 0.6 });
        }
    }

    private renderDebugRepulsions(world: World) {
        for (const entity of world.getEntities()) {
            if (!DebugRepulsion.has(entity)) continue;

            const x = Position.X[entity];
            const y = Position.Y[entity];
            let fx = DebugRepulsion.forceX[entity];
            let fy = DebugRepulsion.forceY[entity];

            let g = this.repulsionLines.get(entity);
            if (!g) {
                g = new Graphics();
                this.repulsionLines.set(entity, g);
                this.debugContainer.addChild(g);
            }

            g.clear();
            g.moveTo(x, y).lineTo(x + fx * 10000, y + fy * 10000)
                .stroke({ width: 1, color: 0x00ff00, alpha: 0.5 });
        }
    }

    private renderDebugGravities(world: World) {
        const centerX = this.app.renderer.width / 2;
        const centerY = this.app.renderer.height / 2;

        if (this.gravityCrosshair) {
            this.gravityCrosshair.clear();
            this.gravityCrosshair
                .moveTo(centerX - 10, centerY)
                .lineTo(centerX + 10, centerY)
                .moveTo(centerX, centerY - 10)
                .lineTo(centerX, centerY + 10)
                .stroke({ width: 1, color: 0xff0000, alpha: 0.8 });
        }

        for (const entity of world.getEntities()) {
            if (!DebugGravity.has(entity)) continue;

            const x = Position.X[entity];
            const y = Position.Y[entity];
            const fx = DebugGravity.forceX[entity];
            const fy = DebugGravity.forceY[entity];

            let g = this.gravityLines.get(entity);
            if (!g) {
                g = new Graphics();
                this.gravityLines.set(entity, g);
                this.debugContainer.addChild(g);
            }

            g.clear();
            g.moveTo(x, y).lineTo(x + fx * 1000, y + fy * 1000)
                .stroke({ width: 1, color: 0x8888ff, alpha: 0.5 });
        }
    }
}

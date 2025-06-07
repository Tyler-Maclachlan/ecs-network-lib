import type { System } from "@core/systems/System";
import type { World, Entity } from "@core/ecs";

import { Position } from "@core/components/Position";
import { Velocity } from "@core/components/Velocity";
import { FixedPosition } from "@core/components/FixedPosition";
import { Selected } from "@core/components/Selected";
import { Edge } from "@core/components/Edge";

import { Application, Container } from "pixi.js";

export class InteractionSystem implements System {
    private app: Application;

    private draggingNode: Entity | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;

    private isPanning = false;
    private panStart = { x: 0, y: 0 };

    private zoom = 1;
    private pan = { x: 0, y: 0 };

    private world: World | null = null;

    constructor(app: Application) {
        this.app = app;
        this.attachEvents();
    }

    init(world: World): void {
        this.world = world;
    }

    update(): void {
        if (this.app.stage) {
            const rootContainer = this.app.stage.getChildAt(0) as Container;
            rootContainer.scale.set(this.zoom);
            rootContainer.position.set(this.pan.x, this.pan.y);
        }
    }

    private attachEvents(): void {
        const stage = this.app.stage;

        stage.eventMode = "static";
        stage.hitArea = this.app.screen;

        stage.on("pointerdown", this.onPointerDown);
        stage.on("pointerup", this.onPointerUp);
        stage.on("pointerupoutside", this.onPointerUp);
        stage.on("pointermove", this.onPointerMove);
        stage.on("wheel", this.onWheel);
    }

    private getEntityAtPosition(x: number, y: number): Entity | null {
        if (!this.world) return null;

        const inverseZoom = 1 / this.zoom;
        const px = (x - this.pan.x) * inverseZoom;
        const py = (y - this.pan.y) * inverseZoom;

        for (const entity of this.world.getEntities()) {
            if (!Position.hasComponent(entity)) continue;
            const dx = px - Position.X[entity];
            const dy = py - Position.Y[entity];
            const r = 20;
            if (dx * dx + dy * dy <= r * r) return entity;
        }

        return null;
    }

    private onPointerDown = (e: PointerEvent) => {
        const entity = this.getEntityAtPosition(e.clientX, e.clientY);

        if (entity !== null) {
            // Node dragging
            this.draggingNode = entity;
            this.dragOffsetX = Position.X[entity] - (e.clientX - this.pan.x) / this.zoom;
            this.dragOffsetY = Position.Y[entity] - (e.clientY - this.pan.y) / this.zoom;

            FixedPosition.add(entity);

            // Handle selection
            if (!e.shiftKey) {
                this.clearSelection();
            }

            Selected.add(entity);
        } else {
            // Start panning
            this.isPanning = true;
            this.panStart.x = e.clientX;
            this.panStart.y = e.clientY;

            if (!e.shiftKey) {
                this.clearSelection();
            }
        }
    };

    private onPointerMove = (e: PointerEvent) => {
        if (this.draggingNode !== null) {
            const entity = this.draggingNode;
            const newX = (e.clientX - this.pan.x) / this.zoom + this.dragOffsetX;
            const newY = (e.clientY - this.pan.y) / this.zoom + this.dragOffsetY;
            Position.X[entity] = newX;
            Position.Y[entity] = newY;
        } else if (this.isPanning) {
            const dx = e.clientX - this.panStart.x;
            const dy = e.clientY - this.panStart.y;
            this.pan.x += dx;
            this.pan.y += dy;
            this.panStart.x = e.clientX;
            this.panStart.y = e.clientY;
        }
    };

    private onPointerUp = (_e: PointerEvent) => {
        if (this.draggingNode !== null) {
            FixedPosition.remove(this.draggingNode);
        }

        this.draggingNode = null;
        this.isPanning = false;
    };

    private onWheel = (e: WheelEvent) => {
        const scale = 1.1;
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const worldX = (mouseX - this.pan.x) / this.zoom;
        const worldY = (mouseY - this.pan.y) / this.zoom;

        if (e.deltaY < 0) {
            this.zoom *= scale;
        } else {
            this.zoom /= scale;
        }

        // Zoom toward cursor
        this.pan.x = mouseX - worldX * this.zoom;
        this.pan.y = mouseY - worldY * this.zoom;
    };

    private clearSelection() {
        if (!this.world) return;

        for (const entity of this.world.getEntities()) {
            if (Selected.has(entity)) {
                Selected.remove(entity);
            }
        }
    }
}

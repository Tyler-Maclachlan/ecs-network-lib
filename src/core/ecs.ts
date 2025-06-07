export type Entity = number;

export class World {
    private nextId: Entity = 0;
    private entities: Set<Entity> = new Set();

    createEntity(): Entity {
        const entity = this.nextId++;
        this.entities.add(entity);
        return entity;
    }

    removeEntity(entity: Entity): void {
        this.entities.delete(entity);
    }

    getEntities(): Iterable<Entity> {
        return this.entities;
    }
}
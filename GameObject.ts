
abstract class GameObject {
    public context: CanvasRenderingContext2D;
    public id: string;
    public x: number;
    public y: number;
    public radius: number;
    public overlapRadius: number;
    public canvasWidth: number;

    constructor(context: CanvasRenderingContext2D, id: string, radius: number, canvasWidth: number) {
        this.context = context;
        this.id = id;
        this.radius = radius;
        this.canvasWidth = canvasWidth;
    }

    abstract reverseOrientation(): void;

    abstract draw(): void;

    abstract checkHit(xCoord: number, yCoord: number): boolean;

    abstract processHit(xCoord:number, yCoord:number): void;

    abstract drawHit(): void;

    public placementOverlap(objs: { [id: string]: GameObject }): boolean {
        let obj: GameObject;
        let distanceSquared: number;

        for (let key in objs) {
            obj = objs[key];

            if (obj.id !== this.id) {
                // Two circles intersect if, and only if, the distance between their centers is less than the sum of their radii.
                distanceSquared = (this.x - obj.x) ** 2 + (this.y - obj.y) ** 2
                if ((distanceSquared <= (this.overlapRadius + obj.overlapRadius) ** 2)) {
                    // Overlap
                    return true
                }
            }
        }

        // No overlap
        return false
    }

    public setCoords(xCoord: number, yCoord: number) {
        this.x = xCoord;
        this.y = yCoord;
    }

    abstract potentialCoords(canvas: HTMLCanvasElement): { [id: string]: number };
}





class Obstacle extends GameObject {

    private damageIdCounter: number = 0;
    private obstacleDamages: ObstacleDamage[] = [];

    constructor(context: CanvasRenderingContext2D, id: string, radius: number, canvasWidth: number) {
        super(context, id, radius, canvasWidth);
        this.overlapRadius = radius;
    }

    public reverseOrientation(): void {
        this.x = this.canvasWidth - this.x;
        for (let d of this.obstacleDamages) {
            d.reverseOrientation()
        }
    }

    public draw(): void {
        this.context.fillStyle = "black"
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.fill();

        for (let d of this.obstacleDamages) {
            d.draw()
        }
    }

    public checkHit(xCoord: number, yCoord: number): boolean {
        if (((xCoord - this.x) ** 2 + (yCoord - this.y) ** 2 <= this.radius ** 2)) {

            // If the coords are in any of the damage regions then it's not a hit
            for (let d of this.obstacleDamages) {
                if (((xCoord - d.x) ** 2 + (yCoord - d.y) ** 2 <= d.radius ** 2)) {
                    return false
                }
            }
            return true
        } else {
            return false
        }
    }

    public processHit(xCoord: number, yCoord: number) {

        let obstacleDamageRadius = 10;
        let o = new ObstacleDamage(this.context, "od" + this.damageIdCounter, obstacleDamageRadius, xCoord, yCoord, this, this.canvasWidth);
        this.obstacleDamages.push(o);
        this.damageIdCounter++;
    }

    public drawHit() {
        this.obstacleDamages[this.damageIdCounter - 1].draw()
    }

    public potentialCoords(canvas: HTMLCanvasElement): { [id: string]: number } {
        // Place soldier on side of canvas corresponding to it's team (at least initially - we can switch the left right later)
        // Also offset from side so soldier does not overlap with the edge 

        let xMin: number;
        let xMax: number;
        let yMin: number;
        let yMax: number;

        // Offset so gameObjects do not overlap the axis marks
        let yAxisOffset = this.context.measureText('-10').width + 6;
        let xAxisOffset = 6 + this.context.measureText('M').width;

        xMin = this.radius + yAxisOffset;
        xMax = canvas.width - this.radius - yAxisOffset;
        yMin = this.radius;
        yMax = canvas.height - this.radius - xAxisOffset;

        return {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax
        }
    }
}

class ObstacleDamage {

    public context: CanvasRenderingContext2D;
    public id: string;
    public x: number;
    public y: number;
    public radius: number;
    private obstacleX: number;
    private obstacleY: number;
    private obstacleRadius: number;
    private canvasWidth: number;
    private containedInObstacle: boolean;

    constructor(context: CanvasRenderingContext2D, id: string, radius: number, x: number, y: number, obstacle: Obstacle, canvasWidth: number) {
        this.context = context;
        this.id = id;
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.obstacleX = obstacle.x;
        this.obstacleY = obstacle.y;
        this.obstacleRadius = obstacle.radius;
        this.canvasWidth = canvasWidth;

        // Want to contain the drawing of damage to within the obstacle.
        // If the damage circle is entirely within the obstacle then just draw a circle -> simple.
        // However if the damage only partly overlaps with the obstacle then we want to just fill in the intersection of the damage circle and the
        // obstacle circle.

        let distanceSquared = (this.x - obstacle.x) ** 2 + (this.y - obstacle.y) ** 2
        if ((distanceSquared <= (this.radius - obstacle.radius) ** 2)) {
            this.containedInObstacle = true
        } else {
            this.containedInObstacle = false
        }
    }

    public reverseOrientation(): void {
        this.x = this.canvasWidth - this.x;
        this.obstacleX = this.canvasWidth - this.obstacleX;
    }

    public draw() {

        this.context.strokeStyle = "white"
        this.context.fillStyle = "white";

        if (this.containedInObstacle) {
            this.context.beginPath();
            this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            this.context.closePath();
        } else {

            // TODO: the angles could be pre-computed and stored for better performance - but would need to be handled appropriately in the reverseOrientation method

            // Calculate intersection of the circles, fill the area created by an arc between the intersection points of the damage circle (towards the centre of the obstacle) and 
            // the arc created between the intersection points of the obstacle circle around it's radius
            let intersectionPoints = this.circleIntersectionPoints(this.x, this.y, this.radius, this.obstacleX, this.obstacleY, this.obstacleRadius);

            let x1 = intersectionPoints[0][0];
            let y1 = intersectionPoints[0][1];
            let x2 = intersectionPoints[1][0];
            let y2 = intersectionPoints[1][1];

            // Arc on the ObstacleDamage circle
            let startAngle = Math.atan2(y1 - this.y, x1 - this.x);
            let endAngle = Math.atan2(y2 - this.y, x2 - this.x);

            // Arc on the Obstacle circle
            let obstacleStartAngle = Math.atan2(y2 - this.obstacleY, x2 - this.obstacleX);
            let obstacleEndAngle = Math.atan2(y1 - this.obstacleY, x1 - this.obstacleX);

            this.context.beginPath();
            this.context.arc(this.x, this.y, this.radius, startAngle, endAngle, false);
            this.context.arc(this.obstacleX, this.obstacleY, this.obstacleRadius, obstacleStartAngle, obstacleEndAngle);
            this.context.closePath();
        }
        this.context.stroke();
        this.context.fill();

    }

    private circleIntersectionPoints(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): number[][] {
        // https://stackoverflow.com/a/3349134
        let d = Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2)
        let a = (r0 ** 2 - r1 ** 2 + d ** 2) / (2 * d)
        let h = Math.sqrt(r0 ** 2 - a ** 2)

        // Midpoint between intersections of circles
        let x2 = x0 + a * (x1 - x0) / d;
        let y2 = y0 + a * (y1 - y0) / d;

        let point0x = x2 + (h / d) * (y1 - y0);
        let point0y = y2 - (h / d) * (x1 - x0);
        let point1x = x2 - (h / d) * (y1 - y0);
        let point1y = y2 + (h / d) * (x1 - x0);


        return [[point0x, point0y], [point1x, point1y]]
    }

}

class Soldier extends GameObject {
    public name: string;
    public facingDirection: string;
    public alive: boolean = true;
    public team: number;

    private nameTextOffset: number = 10;
    private funcHistory: string[] = [];
    private funcHistoryIndex: number = 0;

    constructor(context: CanvasRenderingContext2D, id: string, name: string, radius: number, team: number, canvasWidth: number) {
        super(context, id, radius, canvasWidth);
        this.context = context;
        this.name = name;
        this.team = team;

        this.overlapRadius = this.radius + this.nameTextOffset + 10; // So account for the name getting cut off by the overlap
    }

    public setFacingDirection(facingDirection: string) {
        this.facingDirection = facingDirection;
    }

    public potentialCoords(canvas: HTMLCanvasElement): { [id: string]: number } {
        // Place soldier on side of canvas corresponding to it's team (at least initially - we can switch the left right later)
        // Also offset from side so soldier does not overlap with the edge 

        let xMin: number;
        let xMax: number;
        let yMin: number;
        let yMax: number;

        if (this.facingDirection === "r") {
            xMin = this.radius;;
            xMax = canvas.width / 2 - this.radius;

        } else {
            xMin = canvas.width / 2 + this.radius;
            xMax = canvas.width / 2 + canvas.width / 2 - this.radius;
        }

        yMin = this.radius + this.nameTextOffset + 10; // Additional 10 for the height of the text
        yMax = canvas.height - this.radius

        return {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax
        }
    }

    public reverseOrientation(): void {
        this.x = this.canvasWidth - this.x;
        this.facingDirection = (this.facingDirection === "r") ? "l" : "r";
    }

    public draw(): void {

        if (!this.alive) {
            return
        }

        const rHead = this.radius;
        const rEye = this.radius / 5;
        const rPupil = this.radius / 100;

        // Angle of eye to head
        const theta = Math.PI / 4;

        const xHead = this.x;
        const yHead = this.y;

        this.context.strokeStyle = "black";

        // Head
        this.context.fillStyle = "yellow";
        this.context.beginPath();
        this.context.arc(xHead, yHead, rHead, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.stroke();
        this.context.fill();

        // Eye
        let xEye: number;
        if (this.facingDirection === "r") {
            xEye = xHead + rHead * Math.cos(theta) - rEye * Math.cos(theta);
        } else {
            xEye = xHead - rHead * Math.cos(theta) + rEye * Math.cos(theta);
        }
        const yEye = yHead - rHead * Math.sin(theta) + rEye * Math.sin(theta);

        this.context.fillStyle = "white";
        this.context.beginPath();
        this.context.arc(xEye, yEye, rEye, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.stroke();
        this.context.fill();

        // Pupil
        let xPupil: number;
        if (this.facingDirection === "r") {
            xPupil = xEye + rEye / 2;
        } else {
            xPupil = xEye - rEye / 2;
        }

        this.context.fillStyle = "black";
        this.context.beginPath();
        this.context.arc(xPupil, yEye, rPupil, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.stroke();
        this.context.fill();

        // Mouth
        if (this.facingDirection === "r") {
            this.context.moveTo(this.x + rHead / 2, this.y);
            this.context.lineTo(this.x + rHead, this.y);
        } else {
            this.context.moveTo(this.x - rHead, this.y);
            this.context.lineTo(this.x - rHead / 2, this.y);
        }
        this.context.stroke();

        // Name
        this.context.fillText(this.name, this.x - this.context.measureText(this.name).width / 2, this.y - rHead - this.nameTextOffset);
    }

    public checkHit(xCoord: number, yCoord: number): boolean {
        if (this.alive && ((xCoord - this.x) ** 2 + (yCoord - this.y) ** 2 <= this.radius ** 2)) {
            return true
        }
    }

    public processHit(): void {
        this.alive = false;
    }

    public drawHit() {
        this.context.strokeStyle = 'red';
        this.context.beginPath();

        // Diagonal line top left -> bottom right (canvas y coords are top to bottom)
        this.context.lineTo(this.x + this.radius * Math.cos(Math.PI / 4), this.y + this.radius * Math.sin(Math.PI / 4));
        this.context.lineTo(this.x + this.radius * Math.cos(5 * Math.PI / 4), this.y + this.radius * Math.sin(5 * Math.PI / 4));

        this.context.stroke();


        // Diagonal line top right -> bottom left (canvas y coords are top to bottom)
        this.context.beginPath();
        this.context.lineTo(this.x + this.radius * Math.cos(7 * Math.PI / 4), this.y + this.radius * Math.sin(7 * Math.PI / 4));
        this.context.lineTo(this.x + this.radius * Math.cos(3 * Math.PI / 4), this.y + this.radius * Math.sin(3 * Math.PI / 4));


        this.context.stroke();

    }

    public drawSelectionIndicator() {

        this.context.fillStyle = "red";
        // Name
        this.context.fillText(this.name, this.x - this.context.measureText(this.name).width / 2, this.y - this.radius - this.nameTextOffset);

        this.context.strokeStyle = "red";
        // Head
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius + 1, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.stroke();
    }


    public addToFuncHistory(funcString: string) {
        if (this.funcHistory[this.funcHistory.length - 1] !== funcString) {
            this.funcHistory.push(funcString);
        }
        this.funcHistoryIndex = this.funcHistory.length;
    }

    public prevFunc(): string {

        if (this.funcHistoryIndex > 0) {
            this.funcHistoryIndex -= 1;
        }
        return this.funcHistory[this.funcHistoryIndex];
    }

    public nextFunc(): string {

        if (this.funcHistoryIndex < this.funcHistory.length - 1) {
            this.funcHistoryIndex += 1;
            return this.funcHistory[this.funcHistoryIndex]
        }
        else if (this.funcHistoryIndex = this.funcHistory.length) {
            // Clear form
            return ""
        }
    }
}
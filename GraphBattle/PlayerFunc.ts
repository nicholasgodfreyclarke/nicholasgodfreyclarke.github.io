
class PlayerFunc {

    private canvas: HTMLCanvasElement;
    private funcString: string;
    private originSoldier: Soldier;
    private xStart: number;
    private yStart: number;
    private context: CanvasRenderingContext2D;
    private xScale;
    private yScale;
    public points: number[][];
    public hitEvents: object;
    public numPointsDrawn: number;

    private parsedFunc: Function;
    public parseError: string;


    constructor(canvas: HTMLCanvasElement, funcString: string, selectedSoldier: Soldier) {
        this.canvas = canvas;
        this.funcString = funcString;
        this.originSoldier = selectedSoldier;
        this.xStart = selectedSoldier.x + selectedSoldier.radius;
        this.yStart = selectedSoldier.y;

        this.context = canvas.getContext("2d");
        this.xScale = d3.scaleLinear().domain([0, 15]).range([0, canvas.width]);
        this.yScale = d3.scaleLinear().domain([0, 10]).range([0, canvas.height]);

        this.numPointsDrawn = 0;

        let parser = new FunctionParser(this.funcString);
        this.parsedFunc = parser.parsedFunc;
        this.parseError = parser.parseEquationError;

    }

    public calculatePath(objs: { [id: string]: GameObject }) {
        let xStart = this.xStart;
        let yStart = this.yStart;

        let points: number[][] = [];

        let yCoord: number;
        let obj: GameObject;
        let hitEvents = {};
        let y: number;
        let x: number;

        let values = {
            e: Math.E,
            pi: Math.PI,
            x: 0
        }

        // Translate the equation down to the x axis (which is at the soldier's mouth)
        values.x = 0;
        let offset = this.parsedFunc(values)

        // Evaluate the function every pixel value to the edge
        for (let xCoord: number = xStart; xCoord < this.canvas.width; xCoord += 1) {
            x = this.xScale.invert(xCoord - xStart);

            values.x = x;
            y = this.parsedFunc(values) - offset;

            // y = eval(this.funcString);
            // Canvas y coors are from top to bottom (not bottom to top)
            yCoord = this.yScale(y) * -1 + yStart;
            points.push([xCoord, yCoord]);

            // Check for hits
            for (let key in objs) {
                obj = objs[key];
                if (obj.checkHit(xCoord, yCoord) && obj.id !== this.originSoldier.id) {
                    obj.processHit(xCoord, yCoord);
                    hitEvents[xCoord] = obj.id;
                }
            }

            // Path stopping conditions
            if (xCoord in hitEvents) {
                if (objs[hitEvents[xCoord]] instanceof Obstacle) {
                    break;
                }
            } else if (xCoord >= this.canvas.width) {
                break
            } else if (xCoord <= 0) {
                break
            }
            else if (yCoord >= this.canvas.height) {
                break
            } else if (yCoord <= 0) {
                break
            }
        }

        this.hitEvents = hitEvents;
        this.points = points;
    }

    public draw(numPoints: number) {
        // The idea here is only drawn the additional line segements needed given the proportion of the 
        // way we are throught the function and the line segments we have already drawn
        this.context.strokeStyle = "black";
        this.context.beginPath();

        // Ensure the line segment is connected to the previous line
        if (this.numPointsDrawn > 0) {
            this.context.lineTo(this.points[this.numPointsDrawn - 1][0], this.points[this.numPointsDrawn - 1][1]);
        }

        // Start from where we left off in the last call and draw the additional line segments
        let xCoord;
        let yCoord;
        for (let i: number = this.numPointsDrawn; i < numPoints; i++) {
            xCoord = this.points[i][0];
            yCoord = this.points[i][1];

            this.context.lineTo(xCoord, yCoord);
        }
        this.context.stroke();

        // Store where we finished
        this.numPointsDrawn = numPoints;
    }

    public plotFunc(points: number[][], hitEvents, gameObjects) :JQuery.Deferred<any, any, any> {

        // It seems counter intuitive to pass points and hitEvents back to this class - given that they are class variables.
        // However in the future I would like it be able to handle external points and hitEvents for non local multiplayer

        // let ease = d3.easeCubicInOut;
        let ease = d3.easeLinear;
        const MAX_DURATION = 3000;
        // Max duration across whole screen of 3 seconds, actual duration of 3 secs * ratio of width travelled to total width
        let duration = MAX_DURATION * (points[points.length - 1][0] - points[0][0]) / this.canvas.width;
        let proportion: number;
        let numPoints: number;

        let r = $.Deferred();

        let numPointsChecked: number = 0;
        let timer = d3.timer((elapsed) => {
            // compute how far through the animation we are (0 to 1)
            proportion = Math.min(1, ease(elapsed / duration));
            // Calculate the number of points to plot
            numPoints = Math.floor(points.length * proportion);

            this.draw(numPoints);

            // Check hits and draw if necessary
            let xCoord: number;
            for (let i: number = numPointsChecked; i < this.numPointsDrawn; i++) {
                xCoord = points[i][0];

                if (xCoord in hitEvents) {
                    if (xCoord in hitEvents) {
                        gameObjects[hitEvents[xCoord]].drawHit();
                    }
                }
            }
            numPointsChecked = this.numPointsDrawn;

            // Slight pause after graphing function to assess damage
            if (elapsed >= duration + 1000) {
                timer.stop();
                r.resolve();
            }
        });

        return r;
    }
}

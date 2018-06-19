
class Game {

    // private soldiers: { [id: string]: Soldier; }
    public gameObjects: { [id: string]: GameObject } = {};
    public teamTurn: number;
    public teams: { [id: number]: Team } = {};
    public gameOver: boolean = false;

    private canvas: HTMLCanvasElement;
    private statusElement: HTMLParagraphElement;
    private context: CanvasRenderingContext2D;
    private turnReady: boolean = false;


    constructor(canvas: HTMLCanvasElement, statusElement: HTMLParagraphElement) {

        this.canvas = canvas;
        this.statusElement = statusElement;

        this.context = canvas.getContext("2d");

        this.teams[1] = new Team();
        this.teams[2] = new Team();

        // Randomly choose which team plays first
        this.teamTurn = this.getRandomInt(1, 2);

        this.initialiseGameObjects();

        this.drawGameObjects();

        this.teams[this.teamTurn].selectedSoldier().drawSelectionIndicator();

        this.turnReady = true;
        this.statusElement.innerText = "Ready (" + this.teams[this.teamTurn].selectedSoldier().name + "'s turn). Enter your function.";

    }

    private getRandomInt(min: number, max: number): number {
        // Utility function
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private initialiseGameObjects() {

        const SOLDIER_RADIUS = 10;
        const names = ["Nick", "Nancy", "Owen", "Henry", "Ben", "Vincent", "Lorcan", "Emma"]
        const obstacleMinRadius = 10;
        const obstacleMaxRadius = 50;
        const targetObstacleAreaProportion = 0.1;

        let potentialCoords;
        let xCoord: number;
        let yCoord: number;

        // Initialise obstacle placement on canvas
        let canvasArea = this.canvas.height * this.canvas.width;
        let obstacleArea = 0;
        let i = 0
        while ((obstacleArea / canvasArea) < targetObstacleAreaProportion) {
            let obstacleRadius = this.getRandomInt(obstacleMinRadius, obstacleMaxRadius);
            let obstacle = new Obstacle(this.context, "O" + i, obstacleRadius, this.canvas.width);

            potentialCoords = obstacle.potentialCoords(this.canvas);
            let validPlacement: boolean = false;
            while (!validPlacement) {

                xCoord = this.getRandomInt(potentialCoords.xMin, potentialCoords.xMax)
                yCoord = this.getRandomInt(potentialCoords.yMin, potentialCoords.yMax)
                obstacle.setCoords(xCoord, yCoord);

                if (!obstacle.placementOverlap(this.gameObjects)) {
                    validPlacement = true;
                }
            }

            this.gameObjects[obstacle.id] = obstacle;

            obstacleArea += Math.PI * obstacle.radius ** 2;

            console.log(obstacleArea / canvasArea);
            i++;
        }

        // Initialise soldier placement on canvas
        for (let i = 0; i < names.length; i++) {

            let teamNum: number;
            if (i < names.length / 2) {
                teamNum = 1;
            } else {
                teamNum = 2;
            }

            let soldier = new Soldier(this.context, "S" + i, names[i], SOLDIER_RADIUS, teamNum, this.canvas.width)
            if (soldier.team === this.teamTurn) {
                soldier.setFacingDirection("r");
            } else {
                soldier.setFacingDirection("l");
            }

            potentialCoords = soldier.potentialCoords(this.canvas)
            let validPlacement: boolean = false;
            while (!validPlacement) {

                xCoord = this.getRandomInt(potentialCoords.xMin, potentialCoords.xMax)
                yCoord = this.getRandomInt(potentialCoords.yMin, potentialCoords.yMax)

                soldier.setCoords(xCoord, yCoord);

                if (!soldier.placementOverlap(this.gameObjects)) {
                    validPlacement = true;
                }
            }

            this.gameObjects[soldier.id] = soldier;
            this.teams[teamNum].soldiers.push(soldier);
        }
    }


    public playTurn(funcString: string) {

        if (this.turnReady) {
            this.turnReady = false;
            let selectedSoldier = this.teams[this.teamTurn].selectedSoldier();

            let func = new PlayerFunc(this.canvas, funcString, selectedSoldier);

            if (func.parseError === null) {

                selectedSoldier.addToFuncHistory(funcString);

                func.calculatePath(this.gameObjects);
                let points: number[][];
                points = func.points;


                this.statusElement.innerText = "Plotting: " + funcString

                // $.proxy binds the object context to the function in the callback (similar to bind)
                func.plotFunc(points, func.hitEvents, this.gameObjects).done($.proxy(this.endTurn, this));

            } else {
                this.statusElement.innerText = func.parseError;
                this.turnReady = true;
            }
        }
    }

    private drawGameObjects() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawAxes();

        for (let key in this.gameObjects) {
            this.gameObjects[key].draw();
        }
    }

    private drawAxes() {
        let selectedSoldier = this.teams[this.teamTurn].selectedSoldier();

        let originX = selectedSoldier.x + selectedSoldier.radius;
        let originY = selectedSoldier.y;

        this.context.fillStyle = "black";
        this.context.strokeStyle = "black";

        // Positive X axis tick marks
        let xScale = d3.scaleLinear().domain([0, 15]).range([0, this.canvas.width]);
        let xTick = originX;
        let num = 0;
        while (xTick < this.canvas.width - 10) {
            this.context.beginPath();
            this.context.lineTo(xTick, this.canvas.height);
            this.context.lineTo(xTick, this.canvas.height - 3);
            this.context.closePath();
            this.context.stroke();

            this.context.fillText(String(num), xTick - this.context.measureText(String(num)).width / 2, this.canvas.height - 6);
            num++;

            xTick = xScale(xScale.invert(xTick) + 1);
        }

        // Negative X axis tick marks
        xTick = originX;
        num = 0;
        while (xTick > 10) {
            this.context.beginPath();
            this.context.lineTo(xTick, this.canvas.height);
            this.context.lineTo(xTick, this.canvas.height - 3);
            this.context.closePath();
            this.context.stroke();

            this.context.fillText(String(num), xTick - this.context.measureText(String(num)).width / 2, this.canvas.height - 6);
            num--;

            xTick = xScale(xScale.invert(xTick) - 1);
        }


        // Positive Y axis tick marks
        let yScale = d3.scaleLinear().domain([0, 10]).range([0, this.canvas.height]);
        let yTick = originY;
        num = 0;
        while (yTick < this.canvas.height - 10) {
            this.context.beginPath();
            this.context.lineTo(0, yTick);
            this.context.lineTo(3, yTick);
            this.context.closePath();
            this.context.stroke();

            this.context.fillText(String(num), 6, yTick + this.context.measureText('M').width / 2);
            num++;

            yTick = yScale(yScale.invert(yTick) + 1);
        }

        // Negative Y Axis tick marks
        yTick = originY;
        num = 0;
        while (yTick > 10) {
            this.context.beginPath();
            this.context.lineTo(0, yTick);
            this.context.lineTo(3, yTick);
            this.context.closePath();
            this.context.stroke();

            this.context.fillText(String(num), 6, yTick + this.context.measureText('M').width / 2);
            num--;

            yTick = yScale(yScale.invert(yTick) - 1);
        }

    }

    private endTurn() {

        let otherTeam = this.teamTurn === 1 ? 2 : 1;
        this.gameOver = (this.teams[otherTeam]).teamDefeated();

        if (!this.gameOver) {
            // Other team's turn
            this.teamTurn = (this.teamTurn === 1 ? 2 : 1);
            this.teams[this.teamTurn].incrementSelectedSoldierIndex();

            for (let key in this.gameObjects) {
                this.gameObjects[key].reverseOrientation();
            }

            this.drawGameObjects();
            this.teams[this.teamTurn].selectedSoldier().drawSelectionIndicator();
            this.turnReady = true;
            this.statusElement.innerText = "Ready (" + this.teams[this.teamTurn].selectedSoldier().name + "'s turn). Enter your function.";
        } else {
            this.statusElement.innerText = "Game over!"
        }
    }
}

var game: Game;

const ENTER_KEY = 13;
const ARROW_UP = 38;
const ARROW_DOWN = 40;

const MATH_FUNCS: {} = {
    "sin": Math.sin,
    "cos": Math.cos,
    "exp": Math.exp,
    "sqrt": Math.sqrt,
    "tan": Math.tan,
    "asin": Math.asin,
    "acos": Math.acos,
    "atan": Math.atan,
    "abs": Math.abs,
    "floor": Math.floor,
    "ceil": Math.ceil,
    "max": Math.max,
    "min": Math.min,
    "ln": function (x) { return Math.log(x); },
    "log": function (x) { return Math.log(x) / Math.log(10); },
    "sec": function (x) { return 1 / Math.cos(x); },
    "csc": function (x) { return 1 / Math.sin(x); },
    "cot": function (x) { return 1 / Math.tan(x); },
    "asec": function (x) { return Math.acos(1 / x); },
    "acsc": function (x) { return Math.asin(1 / x); },
    "acot": function (x) { return Math.atan(1 / x); },
    "sinh": function (x) { return (Math.exp(x) - Math.exp(-x)) / 2; },
    "cosh": function (x) { return (Math.exp(x) + Math.exp(-x)) / 2; },
    "tanh": function (x) { return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x)); },
    "asinh": function (x) { return Math.log(x + Math.sqrt(x * x + 1)); },
    "acosh": function (x) { return Math.log(x + Math.sqrt(x * x - 1)); },
    "atanh": function (x) { return 0.5 * Math.log((1 + x) / (1 - x)); },
    "sech": function (x) { return 2 / (Math.exp(x) + Math.exp(-x)); },
    "csch": function (x) { return 2 / (Math.exp(x) - Math.exp(-x)); },
    "coth": function (x) { return (Math.exp(x) + Math.exp(-x)) / (Math.exp(x) - Math.exp(-x)); },
    "asech": function (x) { return Math.log(1 / x + Math.sqrt(1 / x / x - 1)); },
    "acsch": function (x) { return Math.log(1 / x + Math.sqrt(1 / x / x + 1)); },
    "acoth": function (x) { return 0.5 * Math.log((1 + x) / (1 - x)); }
}


$('#functionInput').keypress(function (e) {

    if (e.which == ENTER_KEY) {
        let funcStr = <string>$(this).val();
        funcStr = funcStr.replace(/\n/g, "");
        $(this).val("");

        let g = <Game>game;
        g.playTurn(funcStr);

        return false;
    }
});

// Arrow keys are only triggered on key down
$('#functionInput').keydown(function (e) {
    if (e.which == ARROW_UP) {

        let selectedSoldier: Soldier = <Soldier>game.teams[game.teamTurn].selectedSoldier();
        $(this).val(selectedSoldier.prevFunc());

        return false;
    }
    else if (e.which == ARROW_DOWN) {

        let selectedSoldier: Soldier = <Soldier>game.teams[game.teamTurn].selectedSoldier();
        $(this).val(selectedSoldier.nextFunc());

        return false;
    }
});



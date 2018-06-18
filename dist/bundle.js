class GameObject {
    constructor(context, id, radius, canvasWidth) {
        this.context = context;
        this.id = id;
        this.radius = radius;
        this.canvasWidth = canvasWidth;
    }
    placementOverlap(objs) {
        let obj;
        let distanceSquared;
        for (let key in objs) {
            obj = objs[key];
            if (obj.id !== this.id) {
                // Two circles intersect if, and only if, the distance between their centers is less than the sum of their radii.
                distanceSquared = Math.pow((this.x - obj.x), 2) + Math.pow((this.y - obj.y), 2);
                if ((distanceSquared <= Math.pow((this.overlapRadius + obj.overlapRadius), 2))) {
                    // Overlap
                    return true;
                }
            }
        }
        // No overlap
        return false;
    }
    setCoords(xCoord, yCoord) {
        this.x = xCoord;
        this.y = yCoord;
    }
}
class Obstacle extends GameObject {
    constructor(context, id, radius, canvasWidth) {
        super(context, id, radius, canvasWidth);
        this.damageIdCounter = 0;
        this.obstacleDamages = [];
        this.overlapRadius = radius;
    }
    reverseOrientation() {
        this.x = this.canvasWidth - this.x;
        for (let d of this.obstacleDamages) {
            d.reverseOrientation();
        }
    }
    draw() {
        this.context.fillStyle = "black";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.context.closePath();
        this.context.fill();
        for (let d of this.obstacleDamages) {
            d.draw();
        }
    }
    checkHit(xCoord, yCoord) {
        if ((Math.pow((xCoord - this.x), 2) + Math.pow((yCoord - this.y), 2) <= Math.pow(this.radius, 2))) {
            // If the coords are in any of the damage regions then it's not a hit
            for (let d of this.obstacleDamages) {
                if ((Math.pow((xCoord - d.x), 2) + Math.pow((yCoord - d.y), 2) <= Math.pow(d.radius, 2))) {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
    processHit(xCoord, yCoord) {
        let obstacleDamageRadius = 10;
        let o = new ObstacleDamage(this.context, "od" + this.damageIdCounter, obstacleDamageRadius, xCoord, yCoord, this, this.canvasWidth);
        this.obstacleDamages.push(o);
        this.damageIdCounter++;
    }
    drawHit() {
        this.obstacleDamages[this.damageIdCounter - 1].draw();
    }
    potentialCoords(canvas) {
        // Place soldier on side of canvas corresponding to it's team (at least initially - we can switch the left right later)
        // Also offset from side so soldier does not overlap with the edge 
        let xMin;
        let xMax;
        let yMin;
        let yMax;
        xMin = this.radius;
        ;
        xMax = canvas.width - this.radius;
        yMin = this.radius;
        yMax = canvas.height - this.radius;
        return {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax
        };
    }
}
class ObstacleDamage {
    constructor(context, id, radius, x, y, obstacle, canvasWidth) {
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
        let distanceSquared = Math.pow((this.x - obstacle.x), 2) + Math.pow((this.y - obstacle.y), 2);
        if ((distanceSquared <= Math.pow((this.radius - obstacle.radius), 2))) {
            this.containedInObstacle = true;
        }
        else {
            this.containedInObstacle = false;
        }
    }
    reverseOrientation() {
        this.x = this.canvasWidth - this.x;
        this.obstacleX = this.canvasWidth - this.obstacleX;
    }
    draw() {
        this.context.strokeStyle = "white";
        this.context.fillStyle = "white";
        if (this.containedInObstacle) {
            this.context.beginPath();
            this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            this.context.closePath();
        }
        else {
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
    circleIntersectionPoints(x0, y0, r0, x1, y1, r1) {
        // https://stackoverflow.com/a/3349134
        let d = Math.sqrt(Math.pow((x0 - x1), 2) + Math.pow((y0 - y1), 2));
        let a = (Math.pow(r0, 2) - Math.pow(r1, 2) + Math.pow(d, 2)) / (2 * d);
        let h = Math.sqrt(Math.pow(r0, 2) - Math.pow(a, 2));
        // Midpoint between intersections of circles
        let x2 = x0 + a * (x1 - x0) / d;
        let y2 = y0 + a * (y1 - y0) / d;
        let point0x = x2 + (h / d) * (y1 - y0);
        let point0y = y2 - (h / d) * (x1 - x0);
        let point1x = x2 - (h / d) * (y1 - y0);
        let point1y = y2 + (h / d) * (x1 - x0);
        return [[point0x, point0y], [point1x, point1y]];
    }
}
class Soldier extends GameObject {
    constructor(context, id, name, radius, team, canvasWidth) {
        super(context, id, radius, canvasWidth);
        this.alive = true;
        this.nameTextOffset = 10;
        this.funcHistory = [];
        this.funcHistoryIndex = 0;
        this.context = context;
        this.name = name;
        this.team = team;
        this.overlapRadius = this.radius + this.nameTextOffset + 10; // So account for the name getting cut off by the overlap
    }
    setFacingDirection(facingDirection) {
        this.facingDirection = facingDirection;
    }
    potentialCoords(canvas) {
        // Place soldier on side of canvas corresponding to it's team (at least initially - we can switch the left right later)
        // Also offset from side so soldier does not overlap with the edge 
        let xMin;
        let xMax;
        let yMin;
        let yMax;
        if (this.facingDirection === "r") {
            xMin = this.radius;
            ;
            xMax = canvas.width / 2 - this.radius;
        }
        else {
            xMin = canvas.width / 2 + this.radius;
            xMax = canvas.width / 2 + canvas.width / 2 - this.radius;
        }
        yMin = this.radius + this.nameTextOffset + 10; // Additional 10 for the height of the text
        yMax = canvas.height - this.radius;
        return {
            xMin: xMin,
            xMax: xMax,
            yMin: yMin,
            yMax: yMax
        };
    }
    reverseOrientation() {
        this.x = this.canvasWidth - this.x;
        this.facingDirection = (this.facingDirection === "r") ? "l" : "r";
    }
    draw() {
        if (!this.alive) {
            return;
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
        let xEye;
        if (this.facingDirection === "r") {
            xEye = xHead + rHead * Math.cos(theta) - rEye * Math.cos(theta);
        }
        else {
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
        let xPupil;
        if (this.facingDirection === "r") {
            xPupil = xEye + rEye / 2;
        }
        else {
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
        }
        else {
            this.context.moveTo(this.x - rHead, this.y);
            this.context.lineTo(this.x - rHead / 2, this.y);
        }
        this.context.stroke();
        // Name
        this.context.fillText(this.name, this.x - this.context.measureText(this.name).width / 2, this.y - rHead - this.nameTextOffset);
    }
    checkHit(xCoord, yCoord) {
        if (this.alive && (Math.pow((xCoord - this.x), 2) + Math.pow((yCoord - this.y), 2) <= Math.pow(this.radius, 2))) {
            return true;
        }
    }
    processHit() {
        this.alive = false;
    }
    drawHit() {
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
    drawSelectionIndicator() {
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
    addToFuncHistory(funcString) {
        if (this.funcHistory[this.funcHistory.length - 1] !== funcString) {
            this.funcHistory.push(funcString);
        }
        this.funcHistoryIndex = this.funcHistory.length;
    }
    prevFunc() {
        if (this.funcHistoryIndex > 0) {
            this.funcHistoryIndex -= 1;
        }
        return this.funcHistory[this.funcHistoryIndex];
    }
    nextFunc() {
        if (this.funcHistoryIndex < this.funcHistory.length - 1) {
            this.funcHistoryIndex += 1;
            return this.funcHistory[this.funcHistoryIndex];
        }
        else if (this.funcHistoryIndex = this.funcHistory.length) {
            // Clear form
            return "";
        }
    }
}
class FunctionParser {
    constructor(funcString) {
        this.parseEquationError = null;
        let values = {
            e: Math.E,
            pi: Math.PI,
            x: 0
        };
        this.parsedFunc = this.parseEquation(funcString, values);
    }
    parseEquation(eq, values) {
        let outputFunc = null;
        let tokens;
        var e;
        let i;
        let pstart = -1;
        // Remove spaces
        e = eq.replace(/ /g, "");
        // Replace implied multiplation with *
        //  4x, 5pi, x(, 5(, etc
        e = e.replace(/([0-9])([a-df-z]|[a-z][a-z]|\()/ig, "$1*$2");
        e = e.replace(/(\))([0-9a-df-z]|[a-z][a-z]|\()/ig, "$1*$2");
        // Separate tokens with spaces - so can be split on spaces later
        // character or number followed by an operator or bracket
        e = e.replace(/([a-z0-9\.])([^a-z0-9\.])/ig, "$1 $2");
        e = e.replace(/([^a-z0-9\.])([a-z0-9\.])/ig, "$1 $2");
        // Separate brackets with spaces
        e = e.replace(/(\-|\)|\()/g, " $1 ");
        tokens = e.split(/ +/);
        for (i = 0; i < tokens.length; i++) {
            tokens[i] = tokens[i].replace(/ /g, "");
            tokens[i] = tokens[i].replace(/_/g, ".");
            if (tokens[i] == '') {
                tokens.splice(i, 1);
                i--;
            }
            else if (tokens[i].match(/^[a-z][a-z0-9]*$/i) && values[tokens[i]] != undefined) {
                tokens[i] = 'values.' + tokens[i];
            }
            else if (tokens[i].length > 0 && tokens[i].match(/^[a-z][a-z0-9]*$/i) && MATH_FUNCS[tokens[i]] == undefined) {
                this.parseEquationError = "invalid variable or function: " + tokens[i];
                return null;
            }
        }
        while (this.equationHasToken(tokens, '(') || this.equationHasToken(tokens, ')')) {
            pstart = -1;
            for (i = 0; i < tokens.length; i++) {
                if (tokens[i] == '(')
                    pstart = i;
                if (tokens[i] == ')' && pstart == -1) {
                    this.parseEquationError = "unmatched right parenthesis )";
                    return null;
                }
                if (tokens[i] == ')' && pstart != -1) {
                    tokens.splice(pstart, i - pstart + 1, tokens.slice(pstart, i + 1));
                    i = -1;
                    pstart = -1;
                }
            }
            if (pstart != -1) {
                this.parseEquationError = "unmatched left parenthesis (";
                return null;
            }
        }
        tokens = this.replaceFunctions(tokens);
        if (tokens == null) {
            return null;
        }
        tokens = this.replacePowers(tokens);
        if (tokens == null) {
            return null;
        }
        eval('outputFunc=function(values) { return ' + this.joinArray(tokens) + '; }');
        return outputFunc;
    }
    equationHasToken(tokens, tok) {
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] == tok) {
                return true;
            }
            ;
        }
        return false;
    }
    replacePowers(tokens) {
        if (tokens == null) {
            this.parseEquationError ? null : this.parseEquationError = "syntax error";
            return null;
        }
        for (i = 0; i < tokens.length; i++) {
            if (this.isArray(tokens[i])) {
                tokens[i] = this.replacePowers(tokens[i]);
                if (tokens[i] == null) {
                    this.parseEquationError ? null : this.parseEquationError = "syntax error";
                    return null;
                }
            }
        }
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] == '^') {
                if (tokens[i - 1] == null || tokens[i + 1] == null) {
                    this.parseEquationError = "^ requires two arguments, for example x^2 or (x+1)^(x+2).";
                    return null;
                }
                tokens.splice(i - 1, 3, ['Math.pow', ['(', tokens[i - 1], ',', tokens[i + 1], ')']]);
                i -= 2;
            }
        }
        return tokens;
    }
    replaceFunctions(tokens) {
        if (tokens == null) {
            this.parseEquationError ? null : this.parseEquationError = "syntax error";
            return null;
        }
        for (i = 0; i < tokens.length; i++) {
            if (this.isArray(tokens[i])) {
                tokens[i] = this.replaceFunctions(tokens[i]);
                if (tokens[i] == null) {
                    this.parseEquationError ? null : this.parseEquationError = "syntax error";
                    return null;
                }
            }
        }
        for (var i = 0; i < tokens.length; i++) {
            if (!this.isArray(tokens[i])) {
                if (MATH_FUNCS[tokens[i]] != undefined) {
                    if (tokens[i + 1] == null) {
                        this.parseEquationError = "function " + tokens[i] + " requires an argument.";
                        return null;
                    }
                    tokens[i] = 'MATH_FUNCS.' + tokens[i].toLowerCase();
                    tokens.splice(i, 2, new Array('(', tokens[i], tokens[i + 1], ')'));
                    i--;
                }
            }
        }
        return tokens;
    }
    joinArray(v) {
        var t = "";
        for (var i = 0; i < v.length; i++) {
            if (this.isArray(v[i])) {
                t += this.joinArray(v[i]);
            }
            else {
                t += v[i];
            }
        }
        return t;
    }
    isArray(v) {
        if (v == null) {
            return 0;
        }
        if (v.constructor.toString().indexOf("Array") == -1) {
            return false;
        }
        return true;
    }
}
class PlayerFunc {
    constructor(canvas, funcString, selectedSoldier) {
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
    calculatePath(objs) {
        let xStart = this.xStart;
        let yStart = this.yStart;
        let points = [];
        let yCoord;
        let obj;
        let hitEvents = {};
        let y;
        let x; // Typescript may complain that x is declared and not used -> but it is used in the eval of the funcString below
        let values = {
            e: Math.E,
            pi: Math.PI,
            x: 0
        };
        // Translate the equation down to the x axis (which is at the soldier's mouth)
        values.x = 0;
        let offset = this.parsedFunc(values);
        // Evaluate the function every pixel value to the edge
        for (let xCoord = xStart; xCoord < this.canvas.width; xCoord += 1) {
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
            }
            else if (xCoord >= this.canvas.width) {
                break;
            }
            else if (xCoord <= 0) {
                break;
            }
            else if (yCoord >= this.canvas.height) {
                break;
            }
            else if (yCoord <= 0) {
                break;
            }
        }
        this.hitEvents = hitEvents;
        this.points = points;
    }
    // public calculateHits(objs: { [id: string]: GameObject }) {
    //     let point: number[];
    //     let xCoord: number;
    //     let yCoord: number;
    //     let hitEvents = {};
    //     let obj: GameObject;
    //     for (point of this.points) {
    //         xCoord = point[0];
    //         yCoord = point[1];
    //         for (let key in objs) {
    //             obj = objs[key];
    //             if (obj.checkHit(xCoord, yCoord) && obj.id !== this.originSoldier.id) {
    //                 obj.processHit()
    //                 hitEvents[xCoord] = obj.id;
    //             }
    //         }
    //     }
    //     this.hitEvents = hitEvents;
    // }
    draw(numPoints) {
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
        for (let i = this.numPointsDrawn; i < numPoints; i++) {
            xCoord = this.points[i][0];
            yCoord = this.points[i][1];
            this.context.lineTo(xCoord, yCoord);
        }
        this.context.stroke();
        // Store where we finished
        this.numPointsDrawn = numPoints;
    }
}
class Team {
    constructor() {
        this.soldiers = [];
        this.selectedSoldierIndex = 0;
    }
    teamDefeated() {
        let numAlive = 0;
        for (let soldier of this.soldiers) {
            if (soldier.alive) {
                numAlive++;
            }
        }
        return numAlive === 0;
    }
    selectedSoldier() {
        return this.soldiers[this.selectedSoldierIndex];
    }
    incrementSelectedSoldierIndex() {
        let soldierFound = false;
        let i = this.selectedSoldierIndex;
        while (!soldierFound) {
            // If at the end of the array -> wrap around.
            if (i === this.soldiers.length - 1) {
                i = 0;
            }
            else {
                i++;
            }
            soldierFound = this.soldiers[i].alive;
        }
        this.selectedSoldierIndex = i;
    }
}
class Game {
    constructor(canvas) {
        // private soldiers: { [id: string]: Soldier; }
        this.gameObjects = {};
        this.teams = {};
        this.gameOver = false;
        this.turnReady = false;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.teams[1] = new Team();
        this.teams[2] = new Team();
        // Randomly choose which team plays first
        this.teamTurn = this.getRandomInt(1, 2);
        this.initialiseGameObjects();
        this.drawGameObjects();
        this.teams[this.teamTurn].selectedSoldier().drawSelectionIndicator();
        this.turnReady = true;
    }
    getRandomInt(min, max) {
        // Utility function
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    initialiseGameObjects() {
        const SOLDIER_RADIUS = 10;
        const names = ["Nick", "Nancy", "Owen", "Henry", "Ben", "Vincent", "Lorcan", "Emma"];
        const obstacleMinRadius = 10;
        const obstacleMaxRadius = 50;
        const targetObstacleAreaProportion = 0.1;
        let potentialCoords;
        let xCoord;
        let yCoord;
        // Initialise obstacle placement on canvas
        let canvasArea = this.canvas.height * this.canvas.width;
        let obstacleArea = 0;
        let i = 0;
        while ((obstacleArea / canvasArea) < targetObstacleAreaProportion) {
            let obstacleRadius = this.getRandomInt(obstacleMinRadius, obstacleMaxRadius);
            let obstacle = new Obstacle(this.context, "O" + i, obstacleRadius, this.canvas.width);
            potentialCoords = obstacle.potentialCoords(this.canvas);
            let validPlacement = false;
            while (!validPlacement) {
                xCoord = this.getRandomInt(potentialCoords.xMin, potentialCoords.xMax);
                yCoord = this.getRandomInt(potentialCoords.yMin, potentialCoords.yMax);
                obstacle.setCoords(xCoord, yCoord);
                if (!obstacle.placementOverlap(this.gameObjects)) {
                    validPlacement = true;
                }
            }
            this.gameObjects[obstacle.id] = obstacle;
            obstacleArea += Math.PI * Math.pow(obstacle.radius, 2);
            console.log(obstacleArea / canvasArea);
            i++;
        }
        // Initialise soldier placement on canvas
        for (let i = 0; i < names.length; i++) {
            let teamNum;
            if (i < names.length / 2) {
                teamNum = 1;
            }
            else {
                teamNum = 2;
            }
            let soldier = new Soldier(this.context, "S" + i, names[i], SOLDIER_RADIUS, teamNum, this.canvas.width);
            if (soldier.team === this.teamTurn) {
                soldier.setFacingDirection("r");
            }
            else {
                soldier.setFacingDirection("l");
            }
            potentialCoords = soldier.potentialCoords(this.canvas);
            let validPlacement = false;
            while (!validPlacement) {
                xCoord = this.getRandomInt(potentialCoords.xMin, potentialCoords.xMax);
                yCoord = this.getRandomInt(potentialCoords.yMin, potentialCoords.yMax);
                soldier.setCoords(xCoord, yCoord);
                if (!soldier.placementOverlap(this.gameObjects)) {
                    validPlacement = true;
                }
            }
            this.gameObjects[soldier.id] = soldier;
            this.teams[teamNum].soldiers.push(soldier);
        }
    }
    playTurn(funcString) {
        if (this.turnReady) {
            this.turnReady = false;
            let selectedSoldier = this.teams[this.teamTurn].selectedSoldier();
            let func = new PlayerFunc(this.canvas, funcString, selectedSoldier);
            selectedSoldier.addToFuncHistory(funcString);
            func.calculatePath(this.gameObjects);
            let points;
            points = func.points;
            // let ease = d3.easeCubicInOut;
            let ease = d3.easeLinear;
            const MAX_DURATION = 3000;
            // Max duration across whole screen of 3 seconds, actual duration of 3 secs * ratio of width travelled to total width
            let duration = MAX_DURATION * (points[points.length - 1][0] - points[0][0]) / this.canvas.width;
            let proportion;
            let numPoints;
            let numPointsChecked = 0;
            let timer = d3.timer((elapsed) => {
                // compute how far through the animation we are (0 to 1)
                proportion = Math.min(1, ease(elapsed / duration));
                // Calculate the number of points to plot
                numPoints = Math.floor(points.length * proportion);
                func.draw(numPoints);
                // Check hits and draw if necessary
                let xCoord;
                for (let i = numPointsChecked; i < func.numPointsDrawn; i++) {
                    xCoord = points[i][0];
                    if (xCoord in func.hitEvents) {
                        console.log('Killed');
                        if (xCoord in func.hitEvents) {
                            this.gameObjects[func.hitEvents[xCoord]].drawHit();
                        }
                    }
                }
                numPointsChecked = func.numPointsDrawn;
                if (elapsed >= duration + 1000) {
                    timer.stop();
                    this.endTurn();
                }
                // if (proportion === 1) {
                //     timer.stop();
                //     this.endTurn();
                // }
            });
        }
    }
    drawGameObjects() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let key in this.gameObjects) {
            this.gameObjects[key].draw();
        }
    }
    endTurn() {
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
        }
        else {
            alert("Game Over!");
        }
    }
}
var game;
const ENTER_KEY = 13;
const ARROW_UP = 38;
const ARROW_DOWN = 40;
const MATH_FUNCS = {
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
};
$('#functionInput').keypress(function (e) {
    if (e.which == ENTER_KEY) {
        let funcStr = $(this).val();
        funcStr = funcStr.replace(/\n/g, "");
        $(this).val("");
        let g = game;
        g.playTurn(funcStr);
        return false;
    }
});
// Arrow keys are only triggered on key down
$('#functionInput').keydown(function (e) {
    if (e.which == ARROW_UP) {
        let selectedSoldier = game.teams[game.teamTurn].selectedSoldier();
        $(this).val(selectedSoldier.prevFunc());
        return false;
    }
    else if (e.which == ARROW_DOWN) {
        let selectedSoldier = game.teams[game.teamTurn].selectedSoldier();
        $(this).val(selectedSoldier.nextFunc());
        return false;
    }
});
//# sourceMappingURL=bundle.js.map
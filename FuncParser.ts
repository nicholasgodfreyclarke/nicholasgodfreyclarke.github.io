

class FunctionParser {

    public parseEquationError: string = null;
    public parsedFunc :Function;
    
    constructor(funcString: string) {
        let values = {
            e: Math.E,
            pi: Math.PI,
            x: 0
        }

        this.parsedFunc = this.parseEquation(funcString, values)

    }

    private parseEquation(eq: string, values: object) {

        let outputFunc = null;
        let tokens;
        var e: string;
        let i: number;
        let pstart: number = -1;

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
            if (tokens[i] == '') { tokens.splice(i, 1); i--; }
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
                if (tokens[i] == '(') pstart = i;
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


    private equationHasToken(tokens, tok: string) {
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i] == tok) {
                return true
            };
        }
        return false;
    }

    private replacePowers(tokens) {
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

    private replaceFunctions(tokens) {
        if (tokens == null) {
            this.parseEquationError ? null : this.parseEquationError = "syntax error";
            return null;
        }
        for (i = 0; i < tokens.length; i++) {
            if (this.isArray(tokens[i])) {
                tokens[i] = this.replaceFunctions(tokens[i]);
                if (tokens[i] == null) {
                    this.parseEquationError ? null : this.parseEquationError = "syntax error"; return null;
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

    private joinArray(v) {
        var t = "";
        for (var i = 0; i < v.length; i++) {
            if (this.isArray(v[i])) {
                t += this.joinArray(v[i]);
            } else {
                t += v[i];
            }
        }
        return t;
    }

    private isArray(v) {
        if (v == null) {
            return 0;
        } if (v.constructor.toString().indexOf("Array") == -1) {
            return false;
        }
        return true;
    }

}
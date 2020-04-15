/**
 *
 * @type type Used by Equation.express
 */
import { Figure } from './figure'
import { Territory } from './territory'
import { Calculation } from './calculation'
import { average_stream, hashCode, intToRGB } from './helper_functions'

let variables = {
    "R": gettext("recovered"),
    "D": gettext("death"),
    "C": gettext("confirmed"),
    "T": gettext("confirmed"),
    "P": gettext("population"),
    "NR": gettext("newly recovered"),
    "ND": gettext("newly deceased"),
    "NC": gettext("newly confirmed"),
    "NT": gettext("newly tested"),
    "dC": gettext("confirmed derivation"),
    "dNC": gettext("newly confirmed derivation"),
    "dNR": gettext("newly recovered derivation"),
    "dND": gettext("newly deceased derivation"),
    "dNT": gettext("newly tested derivation"),
    "%": "100",
    "k": "1 000",
    "M": "1 000 000"
};
for (let v in variables) {
    variables[v] = " " + variables[v] + " ";
}
let units = {// since calculate.js cannot parse two paranthesis `(C)(100)` as multiplication, we have to manually define all shorthands
    "C%": "C*10^2", "Ck": "C*10^3", "CM": "C*10^6",
    "R%": "R*10^2", "Rk": "R*10^3", "RM": "R*10^6",
    "D%": "D*10^2", "Dk": "D*10^3", "DM": "D*10^6",
    "T%": "T*10^2", "Tk": "T*10^3", "TM": "T*10^6"
};

export class Equation {
    constructor(expression = "", active = true, figure_id = null, y_axis = 1, checked_names = [], starred_names = [], type = Equation.TYPE_LINE, aggregate = false) {
        /**
         * @property {Territory[]} chosen territories to be processed
         */
        this.checked = checked_names.map(name => Territory.get_by_name(name));
        //console.log("Equation", this.checked, checked_names);
        /**
         * @property {Territory[]} chosen
         */
        this.starred = starred_names.map(name => Territory.get_by_name(name));
        this.expression; // current function
        this.hash; // small hash of the function, used to modify equation colour a little bit
        this.set_expression(expression);
        this._valid = null; // check if this expression is valid
        this.active = active;
        this.$element = null;

        Equation.equations.push(this);

        this.id = Equation.equations.length;
        this.set_figure(Figure.get(figure_id || 1));
        this.y_axis = y_axis;


        this._type = type; // int; line, bar, stacked by equation, territory
        this.aggregate = aggregate;
//        this.percentage = percentage; // the stack should be seen as percentage

        this.build_html();
    }

    static serialize() {
        Editor.setup["equation"] = Equation.current.id;
        return Equation.equations.map(p => {
            return [p.expression,
                p.active,
                p.figure.id,
                p.y_axis,
                p.checked.map(t => t.get_name()),
                p.starred.map(t => t.get_name()),
                p._type,
                p.aggregate
//                p.percentage
            ];
        });
    }

    static deserialize(data) {
        Equation.equations = [];
        data.forEach((d) => new Equation(...d));
        if (Equation.equations.length) {
            Equation.equations[Editor.setup["equation"] - 1 || 0].focus();
        }
    }

    set_figure(figure) {
        if (this.figure) {
            this.figure.remove_equation(this);
        }
        this.figure = figure.add_equation(this);
    }

    get valid() {
        return this._valid;
    }
    set valid(val) {
        if (this.$element) {
            this.$element.toggleClass("invalid", val === false);
        }
        this._valid = val;
    }

    /**
     *
     * @param {bool} clean Clean the old current equation-
     * @returns {Equation}
     */
    focus(clean = true) {
        let cp = Equation.current;
        if (clean && cp && cp !== this) { // kick out the old equation
            if (cp.checked && cp.expression) { // show only if it is worthy
                cp.$element.removeClass("edited");
                //cp.$element.show();
            } else {
                cp.remove(false);
            }
        }
        Territory.equation = Equation.current = this;
        Editor.$equation.val(this.expression);
        $("#equation-type").data("ionRangeSlider").update({from: this.type});
        if (this.$element) {
            this.$element.addClass("edited");
        }
        $("#sum-territories").prop("checked", this.aggregate);
        //$("#percentage").prop("checked", this.percentage);
        this.figure.focus();
        this.refresh_html();
        return this;
    }

    dom_setup() {
        Object.assign(Equation.current, {
            type: Editor.setup["equation-type"],
            aggregate: Editor.setup["sum-territories"]
                    //percentage: Editor.setup["percentage"]
        });
        //$("#percentage").parent().toggle(Editor.setup["equation-type"] >= Equation.TYPE_STACKED_EQUATION); // show/hide percentage checkbox if the equation uses stacked bar
        delete Editor.setup["equation-type"];
        delete Editor.setup["sum-territories"];
        //delete Editor.setup["percentage"];
        this.refresh_html();
    }

    remove(focus_next = true) {
        let without_me = Equation.equations.filter(p => p !== this);

        if (this === Equation.current) {
            if (without_me.length) {
                if (focus_next) {
                    without_me[0].focus(false);
                }
            } else {
                // we cannot remove the last equation, just clear the text
                Editor.$equation.val("").focus();
                this.set_expression("");
                this.refresh_html();
                return;
            }
        }

        this.figure.remove_equation(this);
        Equation.equations = without_me;
        this.$element.hide(500, function () {
            $(this).remove();
        });
    }

    get type() {
        if (this.figure.type === Figure.TYPE_LOG_DATASET) {
            return Equation.TYPE_LINE;
        }
        if (this.figure.type === Figure.TYPE_PERCENT_TIME && this._type === Figure.TYPE_LINEAR_TIME) {
            return Equation.TYPE_STACKED_EQUATION;
        }
        return this._type;
    }
    set type(v) {
        this._type = v;
    }

    set_expression(expression) {
        if (expression !== null) {
            this.expression = expression;
            // 'C' is the default equation, let the colour be as I am used to
            this.hash = (expression === "C") ? 0 : hashCode(expression) % 20 * 5;
//            console.log("Color",expression, this.hash, hashCode(expression));
        }
    }

    /**
     * Assure the equation is in the equation stack
     */
    build_html() {
        let s = '<input type="number" min="1" class="equation-figure" value="' + this.figure.id + '" title="' + gettext("If you change the number, you place the equation on a different figure.") + '"/>';
        let t = '<input type="number" min="1" max="5" class="y-axis" value="' + this.y_axis + '" title="' + gettext("Independent y-axis scale.") + '"/>';
        this.$element = $("<div><span class=name></span>" + s + t + "<span class='shown btn btn-light'>👁</span><span class='remove btn btn-light'>×</span></div>")
                .data("equation", this)
                .prependTo($("#equation-stack"));
        this.refresh_html();
    }

    icon() {
        switch (this.type) {
            case Equation.TYPE_BAR:
                return "<span title='bars displayed'> ❘ </span>";
            case Equation.TYPE_STACKED_EQUATION:
                return "<span title='stacked by equation'> ☰ ";
            case Equation.TYPE_STACKED_TERRITORY:
                return "<span title='stacked by territory'> 🏳 </span>";
            case Equation.TYPE_LINE:
            default:
                return "";
        }
    }

    refresh_html(expression = null) {
        this.set_expression(expression);
//        if (!this.$element) {
//            return;
//        }

        let name = escape(this.expression) + this.icon() + " (" + (this.aggregate ? "∑ " : "") + this.checked.length + " " + gettext("countries") + ")";
        $("> .name", this.$element).html(name);
        if (this.active) {
            this.$element.addClass("active");
        }
        if (this.valid === false) {
            this.$element.addClass("invalid");
        }

        // allow multiple figures
        //console.log("SHOW EQUATION FIGURE?", Editor.setup["equation-figure"]);
        $(".equation-figure", this.$element).toggle(Boolean(parseInt(Editor.setup["equation-figure-switch"])));
        $(".y-axis", this.$element).toggle(Boolean(parseInt(Editor.setup["y-axis-independency-switch"])));

        // hide remove buttons if there is last equation
        $(".remove", $("#equation-stack")).toggle(Equation.equations.length > 1);
    }

    get_name(highlight = false) {
        // XX starred first
        let s;
        let n = this.checked.length;
        if (n < 4) {
            s = this.checked.map(t => t.get_name()).join(", ");
        } else {
            s = n + " " + gettext("territories");
        }
        if (highlight) {
            s = " *** " + s + " ***";
        }
        return s;
    }

    get_title() {
        return this.get_name() + " (" + this.express(variables).trim() + ")";
    }

    /**
     * If sum-territories territory is null
     * @type type
     */
    territory_info(territory = null) {
        if (territory) {
            return [
                territory.get_name(),
                territory.get_label(true),
                this.starred.indexOf(territory) > -1,
                this.id + "" + territory.dom_id];
        } else {
            return [this.get_name(), this.get_name(), false, this.id];
    }
    }

    /**
     * Get expression color
     * @returns {#RGB}
     */
    color() {
        switch (this.expression) {
            case "C":
                return "#0000FF";
            case "R":
                return "#29AC76";
            case "D":
                return "#A11E00";
            default:
                return intToRGB(hashCode((this.hash + "").repeat(10)))
        }
    }

    /**
     *
     * @param {type} territory
     * @param {type} star If null, star will be toggled.
     * @returns {bool} has star
     */
    set_star(territory, star = null) {
        if (!territory) {
            return false;
        }
        return territory.set_star(null, this);
//
//        let has = this.starred.indexOf(territory) > -1; // XX can be re-implemented by dict to get more performance
//        if (star === null) {
//            star = !has;
//        }
//        if (star && !has) {
//            this.starred.push(territory);
//        }
//        if (!star && has) {
//            this.starred = this.starred.remove(territory);
//        }
//        return star;
    }

    /**
     * @returns {Array} Sorted by chosen countries.
     */
    static get_data(equations = []) {
        let title = [];
        let result = [];
        let outbreak_population = Editor.setup["outbreak-mode"] ? 1 : 0;
        let outbreak_threshold = Editor.setup["outbreak-on"] ? parseInt(Editor.setup["outbreak-value"]) : 0;
        let boundaries = [Number.POSITIVE_INFINITY, 0, 0]; // min, max, outbreak population percentil
        for (let p of equations) {
            p.valid = null;
            let aggregated = [];
            for (let t of p.checked) {
                let chart_data = [];
                let outbreak_start = null;
                let ignore = true;

                let averagable = (data) => {
                    if (Editor.setup["average"]) {
                        return average_stream(data, 7);
                    } else {
                        return v => data[v];
                    }
                };

                let C = averagable(t.data["confirmed"]); // the length of C must be the same as of Territory.header
                let R = averagable(t.data["recovered"]);
                let D = averagable(t.data["deaths"]);
                let T = averagable(t.data["tested"]);


                let last_vars = null;
                for (let j = 0; j < Territory.header.length; j++) {
                    // append the data starting with threshold (while threshold can be number of confirmed cases totally or confirmed cases in population
                    let c = C(j);
                    if (ignore && // we have not yet passed outbreak
                            (!outbreak_threshold // there is no outbreak
                                    ||
                                    ((outbreak_population && c >= outbreak_threshold * t.population / 100000) // outbreak determined by population
                                            || (!outbreak_population && c >= outbreak_threshold) // outbreak determined by constant number of casesz
                                            ))
                            ) {
                        outbreak_start = j;
                        ignore = false;
                    }
                    if (!ignore) {
                        // value calculation

                        let vars = {
                            "R": R(j),
                            "D": D(j),
                            "C": c,
                            "T": T(j),
                            "P": t.population,
                            "k": "1000",
                            "M": 1000000
                        };

                        if (last_vars) {
                            vars["NR"] = vars["R"] - last_vars["R"]; // == dR
                            vars["ND"] = vars["D"] - last_vars["D"]; // == dD
                            vars["NC"] = vars["C"] - last_vars["C"] + vars["NR"] + vars["ND"];
                            vars["NT"] = vars["T"] - last_vars["T"]; // == dT

                            vars["dC"] = vars["C"] - last_vars["C"];

                            vars["dNC"] = vars["NC"] - last_vars["NC"];
                            vars["dNR"] = vars["NR"] - last_vars["NR"];
                            vars["dND"] = vars["ND"] - last_vars["ND"];
                            vars["dNT"] = vars["NT"] - last_vars["NT"];
                        } else {
                            vars["NR"] = vars["R"]; // == dR
                            vars["ND"] = vars["D"]; // == dD
                            vars["NC"] = vars["C"];
                            vars["NT"] = vars["T"]; // = dT

                            vars["dC"] = vars["C"];

                            vars["dNC"] = vars["NC"];
                            vars["dNR"] = vars["NR"];
                            vars["dND"] = vars["ND"];
                            vars["dNT"] = vars["NT"];
                        }

                        last_vars = vars;


                        // Since the Calculation does not work with default `*` operatation (ex: `(1)1` is not treated as `(1)*1`)
                        // we adopt this buggy workaround.
//                        parenth_vars = [];
//                        for (let key in vars) {
//                            parenth_vars[key] = "(" + vars[key] + ")";
//                        }
                        // XX
//                        let numeral = [];
//                        let s = "";
//                        for (let l of p.express(vars)) { // strip out spaces
//                            if (l !== " ") {
//                                s += l;
//                            }
//                        }
//                        console.log("Vars", vars);
//                        console.log("Express", p.express(vars));
//                        console.log("S", s);
//                        for (let i in s) {
//                            let c = s[i];
//                            if (c === "(") { // prepend `*` before any parenthesis, if there is not any other operator
//                                if (s[i - 1] && !(// this is not string beggining
//                                        (s[i - 1] && "!^*/+-,".indexOf(s[i - 1]) > -1) // there are not any operator
//                                        || (s[i - 3] && s.substr(i - 3, 3) === "min") // nor a min or sqrt function
//                                        || (s[i - 4] && s.substr(i - 4, 4) === "sqrt")
//                                        )) {
//                                    numeral.push("*");
//                                }
//                            }
//                            numeral.push(c);
//                            if (c === ")") { // append `*` if it is not end of string nor there is any operator
//                                if (s[i * 1 + 1] && "!^*/+-,".indexOf(s[i * 1 + 1]) === -1) {
//                                    numeral.push("*");
//                                }
//                            }
//                        }
//                        console.log("Numeral" , numeral);
//                        let result = Calculation.calculate(numeral.join(""));
//                        console.log("CALC", vars, p.express(vars, true));
                        let result;
                        try {
                            result = p.express(vars, true);
                        } catch (e) {
                            if (e instanceof NaNException) {
                                // any of the variables was replaced by NaN
                                // ex: data missing for this day
                                continue;
                            } else {
                                throw e; // something other happened
                            }
                        }

                        result = Calculation.calculate(result);
                        $("#equation-alert").hide();
                        if (typeof (result) === "string") { // error encountered
                            if (p.expression.trim()) {
                                $("#equation-alert").show().html("<b>" + gettext("Use one of the following variables") + ": <code>C R D T NC NR ND NT dC dNC dNR dND dNT P M k</code></b> (" + escape(result) + ")");
                            }
                            p.valid = false;
                            break;
                        } else {
                            boundaries = [
                                Math.min(result, boundaries[0]),
                                Math.max(result, boundaries[1]),
                                t.population
                            ];
                            if (p.figure.type === Figure.TYPE_LOG_DATASET) {
                                chart_data.push({x: vars["C"], y: result}); // XXX
//                                chart_data.push({x: C[j], y: result});
                            } else {
                                chart_data.push(result);
                            }
                        }

                    }
                }
                if (p.aggregate) {
                    aggregated = aggregated.sumTo(chart_data);
                } else {
                    result.push([p, t, chart_data, outbreak_start]);
                }
            }
            if (p.valid === false) {
                break;
            } else {
                p.valid = true;
            }
            if (p.aggregate) {
                result.push([p, null, aggregated, null]); // if aggregated, we do not tell outbreak_start since every agg. country has different
                title.push(gettext("Sum of") + " " + p.get_title());
            } else {
                title.push(p.get_title());
            }
        }
//        console.log("Equation data: ", result);
        return [result, boundaries, title];
    }

    /**
     * Replace variables in the expression string by vars.
     * (Note that in JS isNaN("1000") === false and isNaN("1000+1") === true. So when resolving an expression we have to compare every replacement apart.)
     * @param {type} vars
     * @param {type} check_NaN If true, we instist every variable should be number.
     * @returns {String}
     */
    express(vars, check_NaN = false) {
        return this.expression
                .replace(/(C%)|(Ck)|(CM)|(R%)|(Rk)|(RM)|(D%)|(Dk)|(DM)|(T%)|(Tk)|(TM)/g, m => units[m]) // first replace units ex: `C% => C * 100` because calculation.js cannot multiply by default when parsing `(C)(100)`
                .replace(/(dNC)|(dNR)|(dND)|(dNT)|(dC)|(NC)|(ND)|(NR)|(NT)|[CRDTPkM]/g, m => {
                    let v = vars[m];
                    if (check_NaN && isNaN(v)) {
                        throw new NaNException();
                    }
                    return v;
                });
    }
}

function NaNException() {}

/**
 *
 * @type Equation
 */
Equation.current = null;
Equation.equations = [];

Equation.TYPE_LINE = 0;
Equation.TYPE_BAR = 1;
Equation.TYPE_STACKED_EQUATION = 2;
Equation.TYPE_STACKED_TERRITORY = 3;

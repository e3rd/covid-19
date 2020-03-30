setup = setup || {};
$plot = $plot || {};

/**
 *
 * @type type Used by Plot.express
 */
let variables = {
    "R": "recovered",
    "D": "death",
    "C": "confirmed",
    "P": "population",
    "NR": "newly recovered",
    "ND": "newly deceased",
    "NC": "newly confirmed",
    "dC": "confirmed derivation",
    "dNC": "newly confirmed derivation",
    "dND": "newly deceased derivation",
    "dNR": "newly recovered derivation",
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
    "D%": "D*10^2", "Dk": "D*10^3", "DM": "D*10^6"
};


class Plot {
    constructor(expression = "", active = true, figure_id = null, y_axis = 1, checked_names = [], starred_names = []) {
        /**
         * @property {Territory[]} chosen territories to be processed
         */
        this.checked = checked_names.map(name => Territory.get_by_name(name));
        console.log("Plot", this.checked, checked_names);
        /**
         * @property {Territory[]} chosen
         */
        this.starred = starred_names.map(name => Territory.get_by_name(name));
        this.expression = expression;
        this._valid = null; // check if this expression is valid
        this.active = active;
        this.$element = null;

        Plot.plots.push(this);

        // we need to implement this method because of sum-territories that may return Plot to refresh function (that want id)
        this.id = Plot.plots.length;
        this.set_figure(Figure.get(figure_id || 1));
        this.y_axis = y_axis;

        this.build_html();
        /*        if (add_to_stack) {
         this.$element.show();
         //this.assure_stack();
         }*/
    }

    static serialize() {
        return Plot.plots.map(p => {
            return [p.expression,
                p.active,
                p.figure.id,
                p.y_axis,
                p.checked.map(t => t.get_name()),
                p.starred.map(t => t.get_name())];
        });
    }

    static deserialize(data) {
        Plot.plots = [];
        data.forEach((d) => new Plot(...d));
        if (Plot.plots.length) {
            Plot.plots[0].focus();
        }
    }

    set_figure(figure) {
        if (this.figure) {
            this.figure.remove_plot(this);
        }
        this.figure = figure.add_plot(this);
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
     * @param {bool} clean Clean the old current plot-
     * @returns {Plot}
     */
    focus(clean = true) {
        let cp = Plot.current_plot;
        if (clean && cp && cp !== this) { // kick out the old plot
            if (cp.checked && cp.expression) { // show only if it is worthy
                cp.$element.removeClass("edited");
                //cp.$element.show();
            } else {
                cp.remove(false);
            }
        }
        Territory.plot = Plot.current_plot = this;
        $plot.val(this.expression);
        if (this.$element) {
            this.$element.addClass("edited");
        }
        return this;
    }

    remove(focus_next = true) {
        let without_me = Plot.plots.filter(p => p !== this);

        if (this === Plot.current_plot) {
            if (without_me.length) {
                if (focus_next) {
                    without_me[0].focus(false);
                }
            } else {
                // we cannot remove the last plot, just clear the text
                $plot.val("").focus();
                this.expression = "";
                this.refresh_html();
                return;
            }
        }

        this.figure.remove_plot(this);
        Plot.plots = without_me;
        this.$element.hide(500, function () {
            $(this).remove();
        });
    }

    /**
     * Assure the plot is in the plot stack
     */
    build_html() {
        let s = '<input type="number" min="1" class="plot-figure" value="' + this.figure.id + '" title="If you change the number, you place the plot on a different figure."/>';
        let t = '<input type="number" min="1" max="5" class="y-axis" value="' + this.y_axis + '" title="Independent y-axis scale"/>';
        this.$element = $("<div><span class=name></span>" + s + t + "<span class='shown btn btn-light'>👁</span><span class='remove btn btn-light'>×</span></div>")
                .data("plot", this)
                .prependTo($("#plot-stack"));
        this.refresh_html();
    }

    refresh_html(expression = null) {
        if (expression !== null) {
            this.expression = expression;
        }
//        if (!this.$element) {
//            return;
//        }

        let name = this.expression + " (" + this.checked.length + " countries)";
        $("> .name", this.$element).html(name);
        if (this.active) {
            this.$element.addClass("active");
        }
        if (this.valid === false) {
            this.$element.addClass("invalid");
        }

        // allow multiple figures
        //console.log("SHOW PLOT FIGURE?", setup["plot-figure"]);
        $(".plot-figure", this.$element).toggle(Boolean(parseInt(setup["plot-figure-switch"])));
        $(".y-axis", this.$element).toggle(Boolean(parseInt(setup["y-axis-independency-switch"])));

        // hide remove buttons if there is last plot
        $(".remove", $("#plot-stack")).toggle(Plot.plots.length > 1);
    }

    get_name(highlight = false) {
        // XX starred first
        let s;
        let n = this.checked.length;
        if (n < 4) {
            s = this.checked.map(t => t.get_name()).join(", ");
        } else {
            s = n + " territories";
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
                territory.get_name(true),
                this.starred.indexOf(territory) > -1,
                this.id + "" + territory.id];
        } else {
            return [this.get_name(), this.get_name(), false, this.id];
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
    static get_data(plots = []) {
        let title = [];
        let result = [];
        let outbreak_population = setup["outbreak-mode"] ? 1 : 0;
        let outbreak_threshold = setup["outbreak-on"] ? parseInt(setup["outbreak-value"]) : 0;
        let boundaries = [Number.POSITIVE_INFINITY, 0, 0]; // min, max, outbreak population percentil
        for (let p of plots) {
            p.valid = null;
            let aggregated = [];
            for (let t of p.checked) {
                let C = t.data["confirmed"]; // the length of C must be the same as of Territory.header
                let R = t.data["recovered"];
                let D = t.data["deaths"];
                let chart_data = [];
                let outbreak_start = null;
                let ignore = true;

                let last_vars = null;
                for (let j = 0; j < Territory.header.length; j++) {
                    // append the data starting with threshold (while threshold can be number of confirmed cases totally or confirmed cases in population
                    if (ignore && // we have not yet passed outbreak
                            (!outbreak_threshold // there is no outbreak
                                    ||
                                    ((outbreak_population && C[j] >= outbreak_threshold * t.population / 100000) // outbreak determined by population
                                            || (!outbreak_population && C[j] >= outbreak_threshold) // outbreak determined by constant number of casesz
                                            ))
                            ) {
                        outbreak_start = j;
                        ignore = false;
                    }
                    if (!ignore) {

                        // value calculation
                        let vars = {
                            "R": R[j],
                            "D": D[j],
                            "C": C[j],
                            "P": t.population,
                            "k": "1000",
                            "M": 1000000
                        };

                        if (last_vars) {
                            vars["NR"] = R[j] - last_vars["R"]; // == dR
                            vars["ND"] = D[j] - last_vars["D"]; // == dD
                            vars["NC"] = C[j] - last_vars["C"] + vars["NR"] + vars["ND"];

                            vars["dC"] = C[j] - last_vars["C"];

                            vars["dNC"] = vars["NC"] - last_vars["NC"];
                            vars["dNR"] = vars["NR"] - last_vars["NR"];
                            vars["dND"] = vars["ND"] - last_vars["ND"];
                        } else {
                            vars["NR"] = R[j]; // == dR
                            vars["ND"] = D[j]; // == dD
                            vars["NC"] = C[j];

                            vars["dC"] = C[j];

                            vars["dNC"] = vars["NC"];
                            vars["dNR"] = vars["NR"];
                            vars["dND"] = vars["ND"];
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
//                        console.log("CALC", vars, p.express(vars));
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
                        $("#plot-alert").hide();
                        if (typeof (result) === "string") { // error encountered
                            if (p.expression.trim()) {
                                $("#plot-alert").show().html("<b>Use one of the following variables: <code>C R D NC NR ND dC dNC dNR dND P M k</code></b> (" + result + ")");
                            }
                            p.valid = false;
                            break;
                        } else {
                            boundaries = [
                                Math.min(result, boundaries[0]),
                                Math.max(result, boundaries[1]),
                                t.population
                            ];
                            chart_data.push(result);
                        }

                    }
                }
                if (setup["sum-territories"]) {
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
            if (setup["sum-territories"]) {
                result.push([p, null, aggregated, outbreak_start]);
                title.push("Sum of " + p.get_title());
            } else {
                title.push(p.get_title());
            }
        }
//        console.log("Plot data: ", result);
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
                .replace(/(C%)|(Ck)|(CM)/g, m => units[m]) // first replace units ex: `C% => C * 100` because calculation.js cannot multiply by default when parsing `(C)(100)`
                .replace(/(dNC)|(dND)|(dNR)|(dC)|(NC)|(ND)|(NR)|[CRDPkM]/g, m => {
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
 * @type Plot
 */
Plot.current_plot = null;
Plot.plots = [];


setup = setup || {};
$plot = $plot || {};

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
    "dNR": "newly recovered derivation"
};
for (let v in variables) {
    variables[v] = " " + variables[v] + " ";
}


class Plot {
    constructor(expression = "", active = true, figure_id = null, checked_names = [], starred_names = []) {
        /**
         * @property {Territory[]} chosen territories to be processed
         */
        this.checked = checked_names.map(name => Territory.get_by_name(name));
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
        this.$element = $("<div><span class=name></span>" + s + "<span class='shown btn btn-light'>👁</span><span class='remove btn btn-light'>×</span></div>")
                .data("plot", this)
                //.hide()
                //.addClass("edited")
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
        $(".plot-figure", this.$element).toggle(Boolean(parseInt(setup["plot-figure"])));

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
        if(highlight) {
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
        let outbreak_threshold = setup["outbreak-on"] ? parseInt(setup["outbreak-threshold"]) : 0;
        let boundaries = [Number.POSITIVE_INFINITY, 0];
        for (let p of plots) {
            p.valid = null;
            let aggregated = [];
            for (let t of p.checked) {
                let C = t.data["confirmed"];
                let R = t.data["recovered"];
                let D = t.data["deaths"];
                let outbreak_data = [];
                let ignore = true;

                let last_vars = null;
                for (let j = 0; j < C.length; j++) {
                    if (C[j] >= outbreak_threshold) { // append the data starting with threshold
                        ignore = false;
                    }
                    if (!ignore) {

                        // value calculation
                        let vars = {
                            "R": R[j],
                            "D": D[j],
                            "C": C[j],
                            "P": t.population
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
                        let result = Calculation.calculate(p.express(vars));
                        $("#plot-alert").hide();
                        if (typeof (result) === "string") { // error encountered
                            if (p.expression.trim()) {
                                $("#plot-alert").show().html("<b>Use one of the following variables: <code>C R D NC NR ND dC dNC dNR dND P</code></b> (" + result + ")");
                            }
                            p.valid = false;
                            break;
                        } else {
                            boundaries = [Math.min(result, boundaries[0]), Math.max(result, boundaries[1])];
//                            outbreak_data.push(Math.round(result * 10000) / 10000);
                            outbreak_data.push(Math.round(result));
                        }

                    }
                }
                if (setup["sum-territories"]) {
                    aggregated = sumArrays(aggregated, outbreak_data);
                } else {
                    result.push([p, t, outbreak_data]);
                }
            }
            if (p.valid === false) {
                break;
            } else {
                p.valid = true;
            }
            if (setup["sum-territories"]) {
                result.push([p, null, aggregated]);
                title.push("Sum of " + p.get_title());
            } else {
                title.push(p.get_title());
            }
        }
        //console.log("Plot data: ", result);
        return [result, boundaries, title];
    }

    express(vars) {
        return this.expression.replace(/(dNC)|(dND)|(dNR)|(dC)|(NC)|(ND)|(NR)|[CRDP]/g, m => vars[m]);
    }
}

/**
 *
 * @type Plot
 */
Plot.current_plot = null;
Plot.plots = [];


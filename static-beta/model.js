/**
 * Territory class

 */
let counter = 0;
class Territory {

    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.toggled = false;
        this.shown = true;
        this.is_starred = false;
        this.id = "t" + (++counter);
        this.data = {"confirmed": [], "deaths": [], "recovered": []};
        this.population = null;

        /** @type {Territory[]} */
        this.parents = [];
        /** @type {Territory[]} */
        this.children = [];

        Territory.id_list.push(this);
        Territory[type][name] = this; // store to ex: Territory.states
    }

    add_data(data, type = "confirmed") {
//        if (this.name === "United Kingdom" || (this.parents.some(p => p.name === "United Kingdom"))) {
//            console.log("Sčítám", this.name, this.data[type], data);
//        }
        data = data.map(d => parseInt(d));
        if (!this.data[type].length) {
            this.data[type] = data;
        } else {
            this.data[type] = this.data[type].map((num, idx) => {
                return num + data[idx];
            });
        }

        this.parents.forEach(p => p.add_data(data, type));
    }

    /**
     * @returns {String} Name of the territory. (Possible quotes around the name stripped.)
     */
    get_name(hightlightable = false) {
        let s = this.name;
        if (s.substring && s.substring(0, 1) === '"' && s.substring(-1, 1) === '"') {
            s = s.substr(1, s.length - 2);
        }
        if (this.type === Territory.COUNTRY && this.children.length && this.children.some((ch) => ch.name === s)) {
            s += " (Region)";
        }
        if (hightlightable && this.is_starred) {
            s = " *** " + s + "***";
        }
        return s;
    }

    get is_active() {
        return this.plot.checked.indexOf(this) > -1;
    }

    set_active(check = true) {
        this.$activate_button.prop("checked", check);
        if (!Territory.loading_freeze) {
            if (check) {
                this.plot.checked.push(this);
//                if (!Territory.parent_freeze) {
//                    refresh();
//                }
            } else {
                this.plot.checked = this.plot.checked.filter(e => e !== this); // remove from chosens
//                if (!Territory.parent_freeze) {
//                    refresh();
//                }
            }
            if (!Territory.parent_freeze) {
                console.log("CHILDREN CHECK!!!");
                this.parents.forEach(p => p.some_children_active(check));
                Plot.current_plot.refresh_html();
            }
    }
    }

    static uncheck_all() {
        Territory.parent_freeze = true;
        Territory.id_list.forEach(t => t.set_active(false));
        Territory.parent_freeze = false;
        refresh();
    }

    some_children_active(set = true) {
        let off = null;
        //console.log("ZDEE true", set === true, this.children.every(ch => ch.is_active), this.children);
        if (!set) {
            off = true;
        } else if (this.children.every(ch => ch.$activate_button.prop("checked"))) { // XX if its a performance issue, may be delayed
            off = false;
            console.log("OFF FALSE");
        }
        if (off !== null) {
            this.$child_activate_button.toggleClass("off", off);
        }

        this.parents.forEach(p => p.some_children_active(set));
    }

    /**
     *
     * @param {type} set If null, star toggled.
     * @returns {undefined}
     */
    set_star(set = null) {
        if (set === null) {
            set = !(this.plot.starred.indexOf(this) > -1);
        }
        $("> span:eq(1)", this.$element).toggleClass("off", !set);
        if (!Territory.loading_freeze) {
            if (set) {
                this.plot.starred.push(this);
            } else {
                this.plot.starred = this.plot.starred.filter(e => e !== this); // remove from starred
            }
        }
        return this.is_starred = set;
    }

    /**
     * Hide the territory (if not checked) and its descendants
     * @returns {undefined}
     */
    hide() {
        if (!this.is_active) {
            this.shown = false;
            this.$element.hide(1000);
        }
        this.children.forEach(ch => ch.hide());
    }

    /**
     * Show the territory and its descendants
     * @returns {undefined}
     */
    show() {
        this.shown = true;
        this.$element.show(1000);
        this.children.forEach(ch => ch.show());
    }

    get $element() {
        return $("#" + this.id);
    }

    get $child_activate_button() {
        return $("> span:eq(3)", this.$element);
    }

    get $activate_button() {
        return $("> input", this.$element);
    }

    get plot() {
        return Plot.current_plot;
    }

    static set plot(plot) {
        Territory.loading_freeze = true;
        console.log("DAVAM STATY", plot.checked);
        Territory.id_list.forEach(t => t.set_active(plot.checked.indexOf(t) > -1));
        Territory.id_list.forEach(t => t.set_star(plot.starred.indexOf(t) > -1));
        Territory.loading_freeze = false;
    }

    get_html() {
        let disabled = this.data["confirmed"].filter(d => d !== "0").length ? "" : " (zero)";
        let s = "<div id='" + this.id + "'>";
        s += "<input type=checkbox />";
        //s += "<span>unicode star</span>"; // XXX
        s += "<span>" + this.get_name() + "</span>" + disabled;
        s += " <span class='off'>☆</span> ";
        if (this.children.length) {
            s += "<span>👁</span>"; // XX save to hash
            s += " <span class='off'>✓</span> ";
        }
        if (this.population) {
            s += " <i>(" + number_format(this.population) + ")</i>";
        }
        s += "</div>";
        return s;
    }

    add_child(t) {
        //let t = Territory.get(name, type);
        this.children.push(t);
        this.population += t.population;
        t.parents.push(this);
        return this;
    }

    /**
     * If there any visible and non-active children, hide it, else show all.
     * @returns {undefined}
     */
    toggle_children_visibility() {
        let off;
        // is there any visible descendant that is not checked
        if (this.children.some((child) => (child.shown && !child.is_active) || child.children.some((grand_ch) => (grand_ch.shown && !grand_ch.is_active)))) {
            // there are, we may hide them
            off = true;
            this.children.forEach((child) => child.hide());
        } else {
            // nothing more to hide, show them all
            off = false;
            this.children.forEach((child) => child.show());
        }
        $("> span:eq(2)", this.$element).toggleClass("off", off);
    }

    /**
     * If there any checked children, uncheck them all, else check all.
     * @returns {undefined}
     */
    toggle_children_checked() {
        Territory.parent_freeze = true;
        let any_checked_hide_all = this.children.some((child) => child.is_active);
        this.children.forEach((child) => child.set_active(!any_checked_hide_all));
        $("> span:eq(3)", this.$element).toggleClass("off", any_checked_hide_all);
        Territory.parent_freeze = false;
    }

    static get(name, type, population = null) {
        let key = name + "_" + type;
        if (!(key in Territory.territories)) {
            Territory.territories[key] = new Territory(name, type);
        }

        Territory.territories[key].population += population;
        return Territory.territories[key];
    }

    /**
     * Get by extended name (ex: United Kingdom (Region))
     * @param {type} name
     * @returns {o}
     */
    static get_by_name(name) {
        for (let o of Territory.id_list) {
            if (o.get_name() === name) {
                return o;
            }
        }
    }

    /**
     * Get territory by its id.
     * @param {String} id (Territory.id), ex: t15 -> will return 15th territory
     * @returns {Territory}
     */
    static get_id(id) {
        return Territory.id_list[parseInt(id.substr(1)) - 1];
    }

    /**
     * @param {type} csv Raw data from github
     */
    static build(csv, type) {
        let lines = csv.split("\n");

        let headers = lines[0].split(",").slice(4); // XX add dates or something
        if (headers.length && headers[headers.length - 1] === "") {
            headers.slice(0, -1); // strip last empty field
        }
        Territory.header = headers;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) {
                continue;
            }
            let line = splitCsv(lines[i]);
            let data = line.slice(4);
            if (data.length && data[data.length - 1] === "") {
                data.slice(0, -1); // strip last empty field
            }
            let t = Territory.get(line[1], Territory.COUNTRY);
            if (line[0]) {
                let ch = Territory.get(line[0], Territory.STATE);
                t.add_child(ch);
                ch.add_data(data, type);
            }
            t.add_data(data, type);
            t.parents.forEach(p => p.add_data(data));
        }
    }

}

// static attributes ("static" keyword not yet supported in FF)

Territory.STATE = "states";
Territory.COUNTRY = "countries";
Territory.CONTINENT = "continents";

Territory.territories = {};
Territory.id_list = []; // sorted by id
Territory.states = {}; // ex:Czechia, Texas
Territory.countries = {}; // ex: USA, China
Territory.continents = {};
Territory.parent_freeze = false;
Territory.loading_freeze = false;
Territory.header = [];


class Plot {
    constructor(expression = "", active = true, checked_names = [], starred_names = [], add_to_stack = false) {
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
        this.figure = "1"; // figure number, type: string

        this.build_html();
        /*        if (add_to_stack) {
         this.$element.show();
         //this.assure_stack();
         }*/
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
            //XXX jestli stojconsole.log("V POHODE", Plot.current_plot.expression, Plot.current_plot.checked.length);
            if (cp.checked && cp.expression) { // show only if it is worthy
                cp.$element.removeClass("edited");
                //cp.$element.show();
            } else {
                cp.remove();
            }
        }
        Territory.plot = Plot.current_plot = this;
        $plot.val(this.expression);
        if (this.$element) {
            this.$element.addClass("edited");
        }
        return this;
    }

    remove() {
        console.log("ZDE se utOPIT", this, Plot.plots);
        let without_me = Plot.plots.filter(p => p !== this);
        console.log("2");

        if (this === Plot.current_plot) {
            console.log("3");
            if (without_me.length) {
                console.log("4");
                without_me[0].focus(false);
            } else {
                // we cannot remove the last plot, just clear the text
                $plot.val("").focus();
                this.expression = "";
                this.refresh_html();
                return;
            }
        }

        console.log("5");
        Plot.plots = without_me;
        this.$element.hide(500, function () {
            $(this).remove();
        });
    }

    /**
     * Assure the plot is in the plot stack
     */
    build_html() {
        let s = '<input type="number" min="1" class="plot-figure" value="1" title="If you change the number, you place the plot on a different figure."/>';
        this.$element = $("<div><span class=name></span>" + s + "<span class='shown btn btn-light'>👁</span><span class='remove btn btn-light'>×</span></div>")
                .data("plot", this)
                //.hide()
                .addClass("edited")
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
        console.log("SHOW PLOT FIGURE?", setup["plot-figure"]);
        $(".plot-figure", this.$element).toggle(Boolean(parseInt(setup["plot-figure"])));

        console.log("HOOOOOOOOOO", $("> span[class=remove]", this.$element).length, this.$element);
        // hide remove buttons if there is last plot
        $(".remove", $("#plot-stack")).toggle(Plot.plots.length > 1);
    }

    static deserialize(data) {
        //console.log("ZDEEEEEEEEEEE5", Plot.current_plot);
        Plot.plots = [];
        data.forEach((d) => new Plot(d[0], d[1], d[2], d[3], data.length > 1));
        if (Plot.plots.length) {
            Plot.plots[0].focus();
        }
    }

    static serialize() {
        return Plot.plots.map(p => {
            return [p.expression,
                p.active,
                p.checked.map(t => t.get_name()),
                p.starred.map(t => t.get_name())];
        });
    }

    get_name() {
        // XXXX starred first, state how many countries for stack
        let s;
        let n = this.checked.length;
        if (n < 4) {
            s = this.checked.map(t => t.get_name()).join(", ");
        } else {
            s = n + " territories";
        }
        if (Plot.plots.length > 1) {
            s += " (" + this.expression + ")";
        }
        return s;
    }

    /**
     * If sum-territories territory is null
     * @type type
     */
    territory_info(territory = null) {
        //console.log("COMING HERE");
        if (territory) {
            return [territory.get_name(), territory.get_name(true), territory.is_starred, territory.id];
        } else {
            return [this.get_name(), this.get_name(), false, this.id];
    }
    }

    /**
     * @returns {Array} Sorted by chosen countries.
     */
    static get_data(figure_id = null) {
        let result = [];
        let outbreak_threshold = setup["outbreak-on"] ? parseInt(setup["outbreak-threshold"]) : 0;
        let boundaries = [Number.POSITIVE_INFINITY, 0];
        console.log("Figures: ", figure_id, Plot.plots.filter(p => p.active && (figure_id === null || p.figure === figure_id)));
        for (let p of Plot.plots.filter(p => p.active && (figure_id === null || p.figure === figure_id))) {
            p.valid = null;
            let aggregated = [];
//            if (p === Plot.current_plot) { // I think this may be ignored
//                Plot.expression = setup["plot"];
//            }
            for (let t of p.checked) {
                let C = t.data["confirmed"];
                let R = t.data["recovered"];
                let D = t.data["deaths"];
                let outbreak_data = [];
                let ignore = true;

                //console.log("Terr", t, t.data);
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
                        let result = Calculation.calculate(p.expression.replace(/(dNC)|(dND)|(dNR)|(dC)|(NC)|(ND)|(NR)|[CRDP]/g, m => vars[m]));
                        $("#plot-alert").hide();
                        if (typeof (result) === "string") { // error encountered
                            if (p.expression.trim()) {
                                $("#plot-alert").show().html("<b>Use one of the following variables: <code>C R D NC NR ND dC dNC dNR dND P</code></b> (" + result + ")");
                            }
                            //console.log("PLOT INVALID", p.expression, p);
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
            //console.log("INVALID???", p.valid);
            if (p.valid === false) {
                break;
            } else {
                //console.log("PLOT DATA VALID", p);
                p.valid = true;
            }
            if (setup["sum-territories"]) {
                result.push([p, null, aggregated]);
            }
            //console.log("PLOT END");
        }
        console.log("Plot data: ", result);
        return [result, boundaries];
    }
}

/**
 *
 * @type Plot
 */
Plot.current_plot = null;
Plot.plots = [];


// Country categorising
var european_countries = [
    "Austria",
    "Belgium",
    "Bulgaria",
    "Croatia",
    "Cyprus",
    "Czechia",
    "Denmark",
    "Estonia",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Hungary",
    "Ireland",
    "Italy",
    "Latvia",
    "Lithuania",
    "Luxembourg",
    "Malta",
    "Netherlands",
    "Poland",
    "Portugal",
    "Romania",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
    "United Kingdom"];
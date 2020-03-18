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
            if (!Territory.parent_freeze) {
                console.log("CHILDREN CHECK!!!");
                this.parents.forEach(p => p.some_children_active(check));
            }
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
        s += "</div>";
        return s;
    }

    add_child(t) {
        //let t = Territory.get(name, type);
        this.children.push(t);
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

    static get(name, type) {
        let key = name + "_" + type;
        if (!(key in Territory.territories)) {
            Territory.territories[key] = new Territory(name, type);
        }
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

        let headers = lines[0].split(","); // XX add dates or something
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


class Plot {
    constructor(expression = "", checked_names = [], starred_names = []) {
        /**
         * @property {Territory[]} chosen territories to be processed
         */
        this.checked = checked_names.map(name => Territory.get_by_name(name));
        /**
         * @property {Territory[]} chosen
         */
        this.starred = starred_names.map(name => Territory.get_by_name(name));
        this.expression = expression;

        Plot.plots.push(this);

        // we need to implement this method because of sum-territories that may return Plot to refresh function (that want id)
        this.id = Plot.plots.length;
    }

    focus() {
        return Territory.plot = Plot.current_plot = this;
    }

    static deserialize(data) {
        Plot.plots = [];
        data.forEach((d) => new Plot(d[0], d[1], d[2]));
        if (Plot.plots.length) {
            Plot.plots[0].focus();
        }
    }

    static serialize() {
        return Plot.plots.map(p => {
            return [p.expression,
                p.checked.map(t => t.get_name()),
                p.starred.map(t => t.get_name())];
        });
    }

    get_name() {
        let n = this.checked.length;
        if (n < 4) {
            return this.checked.map(t => t.get_name()).join(", ");
        } else {
            return n + " territories";
        }
    }
    /**
     * We need to implement this method because of sum-territories -> in that case method refresh receive Plot instead of Territory
     * @type type
     */
    get is_starred() {
        return false;
    }

    /**
     * @returns {Array} Sorted by chosen countries.
     */
    static get_data() {
        let result = [];   // countries with outbreak
        let outbreak_threshold = parseInt(setup["outbreak-threshold"]);
        for (let p of Plot.plots) {
            let aggregated = [];
            if (p === Plot.current_plot) {
                Plot.expression = setup["plot"];
            }
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
                            "C": C[j]
                        };

                        if (last_vars) {
                            vars["NR"] = R[j] - last_vars["R"]; // == dR
                            vars["ND"] = D[j] - last_vars["D"]; // == dD
                            vars["NC"] = C[j] - last_vars["C"] + vars["NR"] + vars["ND"];

                            vars["dC"] = C[j] - last_vars["C"];

                            vars["dNC"] = vars["NC"] - last_vars["NC"];
                            vars["dNR"] = vars["NR"] - last_vars["NR"];
                            vars["dND"] = vars["ND"] - last_vars["ND"];
//                         vars["P"] = t.population;  XX
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
                        let result = Calculation.calculate(Plot.current_plot.expression.replace(/(dNC)|(dND)|(dNR)|(dC)|(NC)|(ND)|(NR)|[CRD]/g, m => vars[m]));
                        $("#plot-alert").hide();
                        if (typeof (result) === "string") { // error encountered
                            if (Plot.current_plot.expression.trim()) {
                                $("#plot-alert").show().html("<b>" + result + "</b> Use one of the following variables: <i>C R D NC NR ND dC dNC dNR dND</i>");
                            }
                            return false;
                        } else {
                            outbreak_data.push(Math.round(result * 100) / 100);
                        }

                    }
                }
                if (setup["sum-territories"]) {
                    aggregated = sumArrays(aggregated, outbreak_data);
                } else {
                    result.push([t, outbreak_data]);
                }
            }
            if (setup["sum-territories"]) {
                result.push([p, aggregated]);
            }
        }
        console.log("Plot data", result);
        return result;
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
/**
 * Territory class

 */
let counter = 0;
class Territory {

    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.toggled = false;
        this.shown = false;
        this.id = "t" + (++counter);
        this.data = {"confirmed": []};

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

        if (!this.data[type].length) {
            this.data[type] = data;
        } else {
            this.data[type] = this.data[type].map((num, idx) => {
                return parseInt(num) + parseInt(data[idx]);
            });
    }
    }

    /**
     * @returns {String} Name of the territory. (Possible quotes around the name stripped.)
     */
    get_name() {
        let s = this.name;
        if (s.substring && s.substring(0, 1) === '"' && s.substring(-1, 1) === '"') {
            s = s.substr(1, s.length - 2);
        }
        if (this.type === Territory.COUNTRY && this.children.length && this.children.some((ch) => ch.name === s)) {
            s += " (Region)";
        }
        return s;
    }

    get checked() {
        return this.plot.checked.indexOf(this) > -1;
    }

    uncheck() {
        this.plot.checked = this.plot.checked.filter(e => e !== this); // remove from chosens
        this.$element.find("input").prop("checked", false);
        if (!Territory.refresh_freeze) {
            refresh();
        }
    }

    check() {
        this.plot.checked.push(this);
        this.$element.find("input").prop("checked", true);
        if (!Territory.refresh_freeze) {
            refresh();
        }
    }

    /**
     * Hide the territory and its children
     * @returns {undefined}
     */
    hide() {
        this.shown = false;
        this.$element.hide(1000);
        this.children.forEach(ch => ch.hide());
    }

    /**
     * Show the territory and its children
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

    get plot() {
        return Plot.current_plot;
    }

    get_html() {
        let s = "<div id='" + this.id + "'>";
        s += "<input type=checkbox />";
        //s += "<span>unicode star</span>"; // XXX
        s += "<span>" + this.get_name() + "</span>";
        if (this.children.length) {
            s += "<span>👁</span>"; // XXX
            s += " <span>✓</span> ";
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
     * If there any visible children, hide it, else show all.
     * @returns {undefined}
     */
    toggle_children_visibility() {
        if (this.children.some((child) => child.shown || child.children.some((grand_ch) => grand_ch.shown))) { // is there any visible children
            this.children.forEach((child) => child.hide());
        } else {
            this.children.forEach((child) => child.show());
        }
    }

    /**
     * If there any checked children, uncheck them all, else check all.
     * @returns {undefined}
     */
    toggle_children_checked() {
        Territory.refresh_freeze = true;
        if (this.children.some((child) => child.checked)) {
            this.children.forEach((child) => child.uncheck());
        } else {
            this.children.forEach((child) => child.check());
        }
        Territory.refresh_freeze = false;
        refresh();
    }

    static get(name, type) {
        let key = name + "_" + type;
        if (!(key in Territory.territories)) {
            Territory.territories[key] = new Territory(name, type);
        }
        return Territory.territories[key];
    }

    static get_by_name(name) {
        for (let o of Territory.territories) {
            if (o.get_name() === name) {
                return o;
            }
        }
    }

    /**
     *
     * @param {String} id (Territory.id), ex: t15 -> will return 15th territory
     * @returns {Territory}
     */
    static get_id(id) {
        return Territory.id_list[parseInt(id.substr(1)) - 1];
    }

    /**
     * @param {type} csv Raw data from github
     */
    static build(csv) {
        let lines = csv.split("\n");

        let headers = lines[0].split(","); // XX add dates or something
        for (let i = 1; i < lines.length; i++) {
            let line = splitCsv(lines[i]);
            let data = line.slice(4);

            let t = Territory.get(line[1], Territory.COUNTRY);
            if (line[0]) {
                let ch = Territory.get(line[0], Territory.STATE);
                t.add_child(ch);
                ch.add_data(data);
            }
            t.add_data(data);
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
Territory.refresh_freeze = false;


class Plot {
    constructor(checked_names = [], starred_names = []) {
        /**
         * @property {Territory[]} chosen territories to be processed
         */
        this.checked = checked_names.map(name => Territory.get_by_name(name));
        /**
         * @property {Territory[]} chosen
         */
        this.starred = starred_names.map(name => Territory.get_by_name(name));
        
        Plot.plots.push(this);

    }

    focus() {
        return Plot.current_plot = this;
    }

    static deserialize(data) {
        Plot.plots = [];
        data.forEach((d) => new Plot(d[0], d[1]));
    }

    static serialize() {
        return Plot.plots.map(p => {
            return [p.checked.map(t => t.get_name()), p.starred.map(t => t.get_name())]
        });
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
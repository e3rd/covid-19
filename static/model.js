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

        /** @type {Territory[]} */
        this.parents = [];
        /** @type {Territory[]} */
        this.children = [];

        Territory.id_list.push(this);
        Territory[type][name] = this; // store to ex: Territory.states
    }

    /**
     * @returns {String} Name of the territory. (Possible quotes around the name stripped.)
     */
    get_name() {
        let s = this.name;
        if (s.substring && s.substring(0, 1) === '"' && s.substring(-1, 1) === '"') {
            s = s.substr(1, s.length - 2);
        }
        return s;
    }

    get checked() {
        return this.plot.chosen.indexOf(this) > -1;
    }

    uncheck() {
        this.plot.chosen = this.plot.chosen.filter(e => e !== this); // remove from chosens
        this.$element.find("input").prop("checked", false);
    }

    check() {
        Territory.current_plot.chosen.push(this);
        this.$element.find("input").prop("checked", true);
    }

    hide() {
        this.shown = false;
        this.$element.hide(1000);
    }

    show() {
        this.shown = true;
        this.$element.show(1000);
    }

    get $element() {
        return $("#" + this.id);
    }

    get plot() {
        return Territory.current_plot;
    }

    get_html() {
        let s = "<div id='" + this.id + "'>";
        s += "<input type=checkbox />";
        //s += "<span>unicode star</span>"; // XXX
        if (this.type !== Territory.states) {
            s += "<span>👁</span>"; // XXX
            s += " <span>✓</span> ";
        }
        s += "<span>" + this.get_name() + "</span>";
        s += "</div>";
        return s;
    }

    add_child(name, type) {
        this.children.push(Territory.get(name, type));
        return this;
    }

    /**
     * If there any visible children, hide it, else show all.
     * @returns {undefined}
     */
    toggle_children_visibility() {
        if (this.children.some((child) => child.shown)) { // is there any visible children
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
        console.log(this.children);
        if (this.children.some((child) => child.checked)) {
            this.children.forEach((child) => child.uncheck());
        } else {
            this.children.forEach((child) => child.check());
        }
    }

    static get(name, type) {
        let key = name + "_" + type;
        if (!(key in Territory.territories)) {
            Territory.territories[key] = new Territory(name, type);
        }
        return Territory.territories[key];
    }

    /**
     *
     * @param {String} id (Territory.id), ex: t15 -> will return 15th territory
     * @returns {Territory}
     */
    static get_id(id) {
        return Territory.id_list[parseInt(id.substr(1)) - 1];
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
/**
 *
 * @type Plot
 */
Territory.current_plot = null;



class Plot {
    constructor() {
        /**
         * @property {Territory[]} chosen territories to be processed
         */
        this.checked = [];
        /**
         * @property {Territory[]} chosen
         */
        this.starred = [];
    }

    focus() {
        Territory.current_plot = this;
    }
}
var plot = new Plot(); // current plot
plot.focus();





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
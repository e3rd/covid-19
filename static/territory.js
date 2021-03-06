/**
 * Territory class

 */
import { Equation } from './equation'
import { territories } from './mappings'
import { number_format, splitCsv } from './helper_functions'
import { refresh } from './editor'

let counter = 0;
export class Territory {

    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.label = name;
        this.toggled = false;
        this.shown = this.type === Territory.CONTINENT;  // by default, every countries are hidden
        this.is_starred = false;
        this.is_eye_on = null;
        this.id = ++counter;
        this.dom_id = "t" + (this.id);
        this.data = {"confirmed": [], "deaths": [], "recovered": [], "tested": []};
        this.population = null;

        /** @type {Territory[]} */
        this.parents = [];
        /** @type {Territory[]} */
        this.children = [];
        this.mainland = null; // COUNTRY United Kingdom has its mainland STATE United Kingdom

        Territory.id_list.push(this);
        Territory[type][name] = this; // store to ex: Territory.states
    }

    /**
     * Add this data to the territory and all of its parents.
     * @param {type} data
     * @param {type} type
     * @returns {undefined}
     */
    add_data(data, type) {
//        if (this.name === "United Kingdom" || (this.parents.some(p => p.name === "United Kingdom"))) {
//            console.log("Adding", this.name, this.data[type], data);
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

    add_data_all(data) {
        ["confirmed", "deaths", "recovered"].forEach(type => {
            if (data[type].length) {
                this.add_data(data[type], type);
            }
        });
    }

    /**
     * @returns {String} Name of the territory.
     */
    get_name() {
        return this.name
    }

    /**
     * @returns {String} Label of the territory. (Possible quotes around the name stripped.)
     */
    get_label(hightlightable = false) {
        let label = this.label;
        if (this.type === Territory.REGION && this.mainland) {
            label += " (" + gettext("Region") + ")";
        }
        if (hightlightable && this.is_starred) {
            label = " *** " + label + "***";
        }
        return label;
    }

    get is_active() {
        return this.equation.checked.indexOf(this) > -1;
    }

    set_active(check = true) {
        this.$activate_button.prop("checked", check);
        if (!Territory.loading_freeze) {
            if (check) {
                this.equation.checked.push(this);
            } else {
                this.equation.checked = this.equation.checked.filter(e => e !== this); // remove from chosens
            }
            if (!Territory.parent_freeze) {
                this.parents.forEach(p => p.some_children_active(check));
                Equation.current.refresh_html();
            }
        }
        return this;
    }

    static uncheck_all() {
        Territory.parent_freeze = true;
        Territory.id_list.forEach(t => t.set_active(false));
        Territory.parent_freeze = false;
        refresh();
    }

    /**
     * Child tells its parent that one of its children becomes (not) active.
     * @param {type} set
     * @returns {undefined}
     */
    some_children_active(set = true) {
        let off = null;
        if (!set) {
            off = true;
        } else if (this.children.every(ch => ch.$activate_button.prop("checked"))) { // XX if its a performance issue, may be delayed
            off = false;
        }
        if (off !== null) {
            this.$child_activate_button.toggleClass("off", off);
    }

    //this.parents.forEach(p => p.some_children_active(set));
    }

    /**
     * Check if there is at least one hidden child.
     * @returns {bool}
     */
    any_hidden_child() {
        return this.children.some(ch => !ch.shown);
        //  X|| ch.children.some(grand_ch => !grand_ch.shown)
    }

    /**
     *
     * @param {type} set If null, star toggled.
     * @returns {undefined}
     */
    set_star(set = null, equation = null) {
        if (equation === null) {
            equation = this.equation;
        }
        if (set === null) {
            set = !(equation.starred.indexOf(this) > -1);
        }
        $("> span:eq(1)", this.$element).toggleClass("off", !set);
        if (!Territory.loading_freeze) {
            if (set) {
                equation.starred.push(this);
            } else {
                equation.starred = equation.starred.filter(e => e !== this);
            }
        }
        return this.is_starred = set;
    }

    /**
     * Hide the territory's descendants and the territory itself if it is not checked ( = active) and all of the parents tell this should be hidden.
     * Example: United Kingdom Region tells its children to hide but United Kingdom Country remains visible if other European countries remain (Europe eye is on and Europe is shown).
     * @returns {undefined}
     */
    hide() {
//        if (this.parents.indexOf(Territory.get("Europe", Territory.CONTINENT)) > -1) {
        let just_hidden = false;

        if (this.shown && !this.is_active && !this.parents.some(p => p.is_eye_on && p.shown)) {
            // hide only if it is not active
            // and if there are no visible parent with its eye icon in the on state
            this.shown = false;
            this.$element.hide(1000);
            just_hidden = true;
        }

        let eye_on = this.is_eye_on;
        this.is_eye_on = false;
        if (this.children.sum(ch => ch.hide())) {
            this.eye(false);
            return true;
        } else {
            this.is_eye_on = eye_on;
        }

        return just_hidden;
    }

    /**
     * Show the territory. Do not show its descendants.
     * @returns {undefined}
     */
    show() {
        this.shown = true;
        this.$element.show(1000).find("span:eq(3)");
        this.eye();
        //this.children.forEach(ch => ch.show());
    }

    get $element() {
        return $("#" + this.dom_id);
    }

    get $child_activate_button() {
        return $("> span:eq(3)", this.$element);
    }

    get $activate_button() {
        return $("> input", this.$element);
    }

    get equation() {
        return Equation.current;
    }

    static set equation(equation) {
        Territory.loading_freeze = true;
        Territory.id_list.forEach(t => {
            let active = equation.checked.indexOf(t) > -1;
            let star = equation.starred.indexOf(t) > -1;
            t.set_active(active);
            t.set_star(star);
            if (active || star) {
                t.show();
            }
        });
//        Territory.id_list.forEach(t => t.set_active(equation.checked.indexOf(t) > -1));
//        Territory.id_list.forEach(t => t.set_star(equation.starred.indexOf(t) > -1));
        Territory.loading_freeze = false;
    }

    get_html() {
        let v = this.shown ? "" : " style='display:none'";
        let disabled = Object.values(this.data).filter(d => d !== "0").length ? "" : " (" + gettext("zero") + ")";
        let s = "<div " + v + "id='" + this.dom_id + "' data-sort='" + this.get_name() + "'>";
        s += "<input type=checkbox />";
        s += "<span>" + this.get_label() + "</span>" + disabled;
        s += " <span class='off'>☆</span> ";
        if (this.children.length) {
            s += "<span class='off'>👁</span>"; // XX save to hash
            s += " <span class='off'>✓</span> ";
        }
        if (this.population) {
            s += " <i>(" + number_format(this.population) + ")</i>";
        }
        s += "</div>";
        return s;
    }

    /**
     * Add population number to this and its parents.
     * @param {type} n
     * @returns {undefined}
     */
    add_population(n) {
        this.population += n;
        this.parents.forEach(p => p.add_population(n));
    }

    /**
     * Add this territory as a child and add its population.
     * @param {Territory} t
     * @param {bool} propagate_data If true, we add data of the child to our data.
     * @returns {Territory}
     */
    add_child(t, propagate_data = true) {
        if (this.children.indexOf(t) === -1) { // not already added
            this.children.push(t);
            this.population += t.population;
            t.parents.push(this);
        }
        if (propagate_data) {
            this.add_data_all(t.data);
        }
        return this;
    }

    /**
     * Toggle the eye icon shown or hidden. If not set, it will be in the on=shown state only if there is no hidden child.
     * @param {bool|null} set
     */
    eye(set = null) {
        if (set === null) {
            set = !this.any_hidden_child();
        }
        $("> span:eq(2)", this.$element).toggleClass("off", !set);
    }

    /**
     * XIf there any visible and non-active children, hide it, else show all.
     * If there any hidden child, show them all. Else hide all non-active children and their children.
     * @returns {undefined}
     */
    toggle_children_visibility() {
        if (this.any_hidden_child()) {
            this.is_eye_on = true;
            this.children.forEach(ch => ch.show());
        } else {
            this.is_eye_on = false;
            if (!this.children.sum(ch => ch.hide())) {
                // no child was hidden, they are all active or have another eye-on parent
                this.is_eye_on = true;
            }
        }
//
//        // is there any visible descendant that is not checked
//        if (this.children.some((child) => (child.shown && !child.is_active) || child.children.some((grand_ch) => (grand_ch.shown && !grand_ch.is_active)))) {
//            // there are, we may hide them
//            off = true;
//            this.children.forEach((child) => child.hide());
//        } else {
//            // nothing more to hide, show them all
//            off = false;
//            this.children.forEach((child) => child.show());
//        }
        this.eye(this.is_eye_on);
    }

    /**
     * XIf there any checked children, uncheck them all, else check all.
     * If there is any unchecked child, check them all, else uncheck all.
     * @returns {undefined}
     */
    toggle_children_checked() {
        Territory.parent_freeze = true;
        let any_unchecked_check_all = this.children.some((child) => !child.is_active);
        this.children.forEach((child) => child.set_active(any_unchecked_check_all));
        $("> span:eq(3)", this.$element).toggleClass("off", !any_unchecked_check_all);
        Territory.parent_freeze = false;
        Equation.current.refresh_html();
    }

    /**
     *
     * @param {type} name
     * @param {type} type
     * @param {type} population
     * @returns {Territory}
     */
    static get(name, type, population = null) {
        // strip possible CSV quotes: "Korea, South" -> Korea, South
        if (name.substring && name.substring(0, 1) === '"' && name.substring(-1, 1) === '"') {
            name = name.substr(1, name.length - 2);
        }

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
        console.error("Territory", name, "not found.");
    }

    /**
     * Get territory by its id.
     * @param {String} id (Territory.dom_id), ex: t15 -> will return 15th territory
     * @returns {Territory}
     */
    static get_by_dom_id(id) {
        return Territory.id_list[parseInt(id.substr(1)) - 1];
    }

    /** Create Territory objects.
     * @param {type} csv Raw data from github
     */
    static build(csv, type) {
        let lines = csv.split("\n");

        let headers = lines[0].split(",").slice(4); // XX add dates or something
        if (headers.length && headers[headers.length - 1] === "") {
            headers.slice(0, -1); // strip last empty field
        }
        // data sheets have sometimes different length but start at the same day. We pick the longest.
        if (headers.length > Territory.header.length) {
            Territory.header = headers.map(h => new Date(h));
        }

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) {
                continue;
            }
            let line = splitCsv(lines[i]);
            let data = line.slice(4);
            if (data.length && data[data.length - 1] === "") {
                data.slice(0, -1); // strip last empty field
            }

            let t;
            if (!line[0]) { // this is country
                t = Territory.get(line[1], Territory.COUNTRY);
                t.add_data(data, type);
            } else { // this is state & region
                t = Territory.get(line[1], Territory.REGION);
                let ch = Territory.get(line[0], Territory.STATE);
                t.add_child(ch, false);
                ch.add_data(data, type);
            }
        }
    }

    // Raw data from MVCR
    static build_json(json) {
        let data_cz = json.data.map(d => d["testy-celkem"]);

        let start = Date.from_dmy(json.data[0]["datum"]);
        let i = Territory.header.findIndex(h => !(h < start)); // JS cannot simple tell if dates are equal
        if(i === -1) {
            console.error("Cannot bind czech tests date.");
            return false;
        }
        Territory.get("Czechia", Territory.COUNTRY).add_data((new Array(i).fill(0)).concat(data_cz), "tested");
    }

    /**
     *
     * Call this when all sources were built.
     * 1. This connects REGION to mainland COUNTRIES.
     * 2. Map continents and population to REGION/COUNTRIES.
     *
     * Ex: In the USA REGION: NY STATE, there is no COUNTRY USA.
     *     In the UK REGION: UK COUNTRY (mainland), Isle of Man STATE
     *
     * @returns {undefined}
     */
    static finalize() {
        // connect regions to its mainland countries
        Object.values(Territory.regions).forEach(r => {
            let mainland = Territory.countries[r.name];

            if (mainland) { // mainland UK Country exists for UK Region (but no US Country)
                r.add_child(mainland);
                r.mainland = mainland;
            }
        });

        // build continents
        territories.forEach(el => {
            let continent = Territory.get(el.continent, Territory.CONTINENT);
            continent.label = el.label;
            el.countries.forEach(el => {
                let region = Territory.regions[el.name];
                let country = Territory.countries[el.name];
                let territory = country || region;

                // check if country has been found in the datasheets
                if (territory) {
                    territory.label = el.label
                    if (el.pop !== "") {
                        // add population preferably to the country that will propagate it to its region if its mainland (UK)
                        // or to the region if no mainland (USA)
                        territory.add_population(parseInt(el.pop));
                    }

                    if (region && country) {
                        continent.add_child(region); // add the region to the continent and add its data
                        continent.add_child(country, false); // will not add its data to the continent, already done by the region
                    } else {
                        continent.add_child(territory); // add the data to the continent
                    }
                }
            });
            world.add_child(continent); // add continent data to the world
        });

        // other continent
        Object.values(Territory.territories).filter(t => !t.parents.length && t.type !== Territory.CONTINENT).forEach(t => default_territory.add_child(t));
    }
}

// static attributes ("static" keyword not yet supported in FF)

Territory.STATE = "states";
Territory.COUNTRY = "countries";
Territory.REGION = "regions";
Territory.CONTINENT = "continents";

Territory.territories = {}; // [name_type => object]
Territory.id_list = []; // sorted by id
Territory.states = {}; // ex: Isle of Man, Texas
Territory.countries = {}; // ex: Czechia, United Kingdom (mainland w/o provinces), not USA
Territory.regions = {}; // ex: United Kingdom, USA, China
Territory.continents = {};
Territory.parent_freeze = false;
Territory.loading_freeze = false;
Territory.header = [];




export const world = Territory.get("World", Territory.CONTINENT);
const default_territory = Territory.get("Other", Territory.CONTINENT); // here comes countries that are not stated in mapping.js
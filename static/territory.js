/**
 * Territory class

 */
var setup = setup || {};
let counter = 0;
class Territory {

    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.toggled = false;
        this.shown = this.type === Territory.CONTINENT;  // by default, every countries are hidden
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
            } else {
                this.plot.checked = this.plot.checked.filter(e => e !== this); // remove from chosens
            }
            if (!Territory.parent_freeze) {
                this.parents.forEach(p => p.some_children_active(check));
                Plot.current_plot.refresh_html();
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
     * Tell the parent this territory is/not active.
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

        this.parents.forEach(p => p.some_children_active(set));
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
    set_star(set = null, plot = null) {
        if (plot === null) {
            plot = this.plot;
        }
        if (set === null) {
            set = !(plot.starred.indexOf(this) > -1);
        }
        $("> span:eq(1)", this.$element).toggleClass("off", !set);
        if (!Territory.loading_freeze) {
            if (set) {
                plot.starred.push(this);
            } else {
                plot.starred = plot.starred.filter(e => e !== this);
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
        this.eye(false);
        this.children.forEach(ch => ch.hide());
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
        Territory.id_list.forEach(t => {
            let active = plot.checked.indexOf(t) > -1;
            let star = plot.starred.indexOf(t) > -1;
            t.set_active(active);
            t.set_star(star);
            if (active || star) {
                t.show();
            }
        });
//        Territory.id_list.forEach(t => t.set_active(plot.checked.indexOf(t) > -1));
//        Territory.id_list.forEach(t => t.set_star(plot.starred.indexOf(t) > -1));
        Territory.loading_freeze = false;
    }

    get_html() {
        let v = this.shown ? "" : " style='display:none'";
        let disabled = this.data["confirmed"].filter(d => d !== "0").length ? "" : " (zero)";
        let s = "<div " + v + "id='" + this.id + "' data-sort='" + this.get_name() + "'>";
        s += "<input type=checkbox />";
        s += "<span>" + this.get_name() + "</span>" + disabled;
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

    add_child(t) {
        if (this.children.indexOf(t) === -1) { // not already added
            this.children.push(t);
            this.population += t.population;
            t.parents.push(this);
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
        let off;
        if (this.any_hidden_child()) {
            off = false;
            this.children.forEach(ch => ch.show());
        } else {
            off = true;
            this.children.forEach(ch => ch.hide());
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
        this.eye(!off);
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
        Plot.current_plot.refresh_html();
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
        console.error("Territory", name, "not found.");
    }

    /**
     * Get territory by its id.
     * @param {String} id (Territory.id), ex: t15 -> will return 15th territory
     * @returns {Territory}
     */
    static get_id(id) {
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
            Territory.header = headers;
        }
        let default_territory = Territory.get("Other", Territory.CONTINENT); // here comes countries that are not stated in mapping.js

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
            let ch = Territory.get(line[0] ? line[0] : line[1], Territory.STATE);
//            console.log("LINE", line[0] ? line[0] : line[1], line[0]);
            t.add_child(ch);
            ch.add_data(data, type);

            // unknown continent
            if (!t.parents.length) {
                default_territory.add_child(t);
            }
            //t.add_data(data, type);
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



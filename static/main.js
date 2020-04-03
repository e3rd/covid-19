/**
 * Input field DOM
 *  * `dom_setup` method will register it to the `setup` variable
 *  * rewritten in (Plot|Figure).focus()
 *
 */

// definitions
var ready_to_refresh = false;
//var url_pattern = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-';
var url_pattern = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_';
var just_stored_hash = ""; // determine if hash change is in progress

$(function () {
    // Show show cases or editor
    if (!chart_id) {
        show_menu = false;
        $("#showcases").fadeIn(500).on("click", "a", function () {
            $("#showcases").hide();
            $("main").fadeIn(2000);
            history.pushState(null, "", $(this).attr("href"));
            load_hash();
            return false;
        });
    }


    // DOM configuration

    // canvas configuration
    $("#canvas-container").on("mouseleave", "canvas", function () {
        $(this).data("figure").mouse_leave(); // unhighlight dataset on mouse leave
    });

    // init sliders
    $("#chart-size").ionRangeSlider({
        skin: "big",
        grid: false,
        min: $("#chart-size").attr("min"),
        max: $("#chart-size").attr("max"),
        from: $("#chart-size").val(),
        postfix: " %",
        onChange: Figure.chart_size
    });

    // display menu
    $("#mouse-drag").ionRangeSlider({
        skin: "big",
        grid: false,
        values: Figure.MOUSE_DRAG
    });
    $("#tooltip-sorting").ionRangeSlider({
        skin: "big",
        grid: false,
        values: Figure.TOOLTIP_SORTING
    });
    $("#color-style").ionRangeSlider({
        skin: "big",
        grid: false,
        values: Figure.COLOR_STYLE
    });
    $("#dataset-labels").ionRangeSlider({
        skin: "big",
        grid: false,
        values: Figure.DATASET_LABELS
    });
//        * checkbox (wheel zooming) XXXXXXxx
//               * color menu: default (by territory, slightly different), by plot, by static kontrastní dict [červená, bílá, zelená, ...]
//        * toggle dataset default / label / values / off


    // axes menu
    $("#plot-type").ionRangeSlider({
        skin: "big",
        grid: false,
        values: ["line", "bar", "stacked by plot", "stacked by territory"]
    });
    $("#axes-type").ionRangeSlider({
        skin: "big",
        grid: false,
        values: ["linear / time", "log / time", "percent / time", "log / dataset"]
    });

    $("#day-range").ionRangeSlider({
        skin: "big",
        type: "double",
        grid: true,
        min: 0,
        max: 100,
        to: 100,
        from: 0
    });

    $("#outbreak-threshold").ionRangeSlider({
        skin: "big",
        grid: true,
        from: 1,
        values: [1]
    });// XXX.data("bound-$input", $("#outbreak-value"));

//    $("#outbreak-value").change(function () {
//        // update corresponding slider to have to nearest value possible
//        //console.log("Outbreak value change to VAL:", $(this).val());
//        alert("55");
//        set_slider($("#outbreak-threshold"), $(this).val());
//    });

    // single day switch
    $("#single-day").change(function () {
        // it is more intuitive "to" value becomes the single day
        let ion = $("#day-range").data("ionRangeSlider");
        let single = $(this).prop("checked");
        let was_single = ion.options.type === "single";
        if (single !== was_single) {
            let o = {type: single ? "single" : "double"};
            let c = ion.result;
            if (single) { // changing to single day
                o._from = c.from;
                o.from = c.to;
            } else { // changing to multiple day
                o.from = ion.options._from;
                o.to = c.from;
                if (o.to <= o.from) { // we have moved "to" value before previously stored "from" value, reset it
                    o.from = 0;
                }
            }
            ion.update(o);
        }

    }).change();

    // disabling outbreak will disable its range
    $("#outbreak-on").change(function () {
        $("#outbreak-threshold, #outbreak-value, #outbreak-mode").parent().toggle($(this).prop("checked"));
    }).change();

    // refresh on input change
    // every normal input change will redraw chart
    // (we ignore sliders and .copyinput (#export-link would cause recursion)
    $("#setup input:not(.irs-hidden-input):not(.nohash)").change(refresh);

    // sliders input change
    $("#setup input.irs-hidden-input").each(function () {
        let ion = $(this).data("ionRangeSlider");
        let opt = $(this).data("ionRangeSlider").options;
        if ($(this).closest("#view-menu").length) {
            // we are in the view menu DOM context
            opt.onFinish = refresh; // each change in the view menu should be remembered (note that its onFinish event is rewritten)
            return;
        }

        // we are in the main application DOM context
//        let $input = $(this).data("bound-$input"); // bound input to the slider
        let $legend = $($(this).attr("data-legend"));
        let $input = $($(this).attr("data-input")); // bound input to the slider
        $(this).data("has-bound-input", $input.length > 0);

        if ($legend.length) {
            ion.update({hide_from_to: true}); // stop current value being shown at the top
        }

        opt.onFinish = dom_setup;
        // do not change window hash when moving input slider
        let clb = opt.onChange; // keep previously defined callback
        let old_val = null;
        opt.onChange = () => {
            let {from, to} = $(this).data("ionRangeSlider").result;

            clb ? clb() : null; // call another callback
            if ($input.length || $legend.length) {
                let val = opt.values.length ? opt.values[from] : from;
                $input.val(val);  // if there is a bound input, change its value accordingly
                $legend.html(val);
            }

            // ignore if not changed
            if (old_val && old_val + "" === [from, to] + "") { // when dragging mouse, just clicking on the slider would cause this to be fired
                return;
            }
            old_val = [from, to];
            refresh(false);
        };

    });
    // refresh on plot change
    $plot.keyup(function () {
        let v = $(this).val();
        if ($(this).data("last") !== v) {
            Plot.current.refresh_html(v);
            refresh();
            $(this).data("last", v);
        }
    });
    // place plot on a different figure
    $("#plot-stack").on("change", ".plot-figure", function () {
        let plot = $(this).parent().data("plot").focus();
        plot.set_figure(Figure.get($(this).val() * 1).focus());
        refresh(false);
    });
    // place plot on a different Y axe
    $("#plot-stack").on("change", ".y-axis", function () {
        let plot = $(this).parent().data("plot").focus();
        plot.y_axis = $(this).val();
        if (plot.active) {
            // possible chartjs bug – if I did not toggle the plot activity, Y axis would appear but data would stay still wrongly linked to the old Y axis
            plot.active = false;
            refresh(false);
            plot.active = true;
            refresh(false);
        }
    });
    // possibility to add a new plot
    $("#plot-new").click(() => {
        let cp = Plot.current;
        if (!cp.valid) {
            alert("This plot expression is invalid");
            $plot.focus();
            return;
        }
        //Plot.current.assure_stack();
        $plot.val("");
        let p = new Plot();
        p.checked = Object.assign(cp.checked);
        p.starred = Object.assign(cp.starred);
        p.focus().refresh_html();
        $plot.focus();
    });
    // clicking on a plot stack curve label
    $("#plot-stack").on("click", "> div", function (event) {
        let plot = $(this).data("plot");
        if (event.target === $("span.remove", $(this))[0]) { // delete plot
            $(this).data("plot").remove();
        } else if (event.target === $("span.shown", $(this))[0]) { // toggle hide
            $(this).toggleClass("active", plot.active = !plot.active);
        } else {
            plot.focus();
//                if (event.target === $("span.name", $(this))[0]) { // re-edit
//            plot.focus();
//        }
            return;
        }
        refresh();
    });
    //reset zoom ready
    $("#reset-zoom").on("click", "a", Figure.reset_zoom);

    // download PNG
    $("#export-image").click(() => {
        $("canvas").each(function () {
            exportCanvasAsPNG(this, $(this).data("figure").chart.options.title.text);
        });
    });
    // download CSV
    $("#export-csv").click(() => {
        $("canvas").each(function () {
            downloadFile(...$(this).data("prepared_export"));
        });
    });
    // download JSON
    $("#export-json").click(() => {
        $("canvas").each(function () {
            let f = $(this).data("figure");
            downloadFile(f.chart.options.title.text + ".json", f.export_json());
        });
    });

    // uncheck all
    $("#uncheck-all").click(() => {
        Territory.uncheck_all();
    });

    // toggle help cursor
    $("#help-switch").change(function () {
        if ($(this).prop("toggled")) {
            let aaa = $('[title]').tooltipster();
            console.log("check mee", aaa); // XXX
        } else {

        }
    });

    // refresh share menu
    $("#share-menu-button").click(() => {
        export_thumbnail();
        $("#share-facebook").attr("href", "http://www.facebook.com/sharer.php?u=" + window.location.href);
    });
    $("#share-facebook").click(function () {
        window.open(this.href, 'facebookwindow', 'left=20,top=20,width=600,height=700,toolbar=0,resizable=1');
        return false;
    });

    // copy input
    $("input.copyinput").prop("readonly", true).click(function () {
        this.select();
    });


    // runtime
    $.when(// we need to build Territory objects from CSV first
            $.get(url_pattern + "confirmed_global.csv", (data) => Territory.build(data, "confirmed")),
            $.get(url_pattern + "deaths_global.csv", (data) => Territory.build(data, "deaths")),
            $.get(url_pattern + "recovered_global.csv", (data) => Territory.build(data, "recovered")),
            ).then(() => {
        Territory.finalize();

        // setup options according to data boundaries
        $("#day-range").data("ionRangeSlider").update({max: Territory.header.length});

        // build territories
        let $territories = $("#territories");
        let td = (col_id, storage) => {
            let text = [];
            for (let o of Object.values(storage)) {
                text.push(o.get_html());
            }
            $("> div:eq(" + col_id + ")", $territories).append(text.join("")).sorting("> div", "data-sort");
        };
        td(0, Territory.states);
        td(1, Territory.countries);
        td(1, Territory.regions);
        td(2, Territory.continents);
        world.eye(); // world starts toggled
        $("> div", $territories).on("click", "> div", function (event) {
            let t = Territory.get_by_dom_id($(this).attr("id"));
            if (event.target === $("span:eq(1)", $(this))[0]) { // un/star all
                if (t.set_star(null) && !t.is_active) {
                    t.set_active();
                }
            } else if (event.target === $("span:eq(2)", $(this))[0]) { // hide/show all
                t.toggle_children_visibility();
            } else if (event.target === $("span:eq(3)", $(this))[0]) { // un/check all
                t.toggle_children_checked();
            } else if (event.target.type !== "checkbox") { // toggle clicked territory
                $("input:checkbox", $(this)).click();
            } else {
                t.set_active($(event.target).prop("checked"));
            }
            // XXpossible performance issue: the event fires twice
            refresh();
        });

        // view menu
        let view_change = function () {
            // switches -> show/hide DOM sections
            let target = $(this).attr("data-target");
            let $el;
            if (target) {
                $el = $(target);
            } else {
                $el = $("#" + $(this).attr("id").slice(0, -"-switch".length));
            }
            if ($el.length) {
                $el.toggle($(this).prop("checked"));
            }

            // Checkbox inheritance, will show/hide children checkboxes
            // Checkbox is visible only if its data-parent is both checked and visible ( = not hidden due to its data-parent)
            $("#setup [data-parent]").each(function () {
                let $parent = $($(this).attr("data-parent"));
                $(this).parent().toggle($parent.prop("checked") && $parent.parent().is(":visible"));

            });
        };
        $(".custom-control-input").change(view_change).each(view_change);


        // document events
        window.addEventListener('hashchange', () => {
            console.log("HASH change event");
            load_hash();
        }, false);
        window.onpopstate = function () {
            console.log("POPSTATE change event");
            load_hash();
            //alert(`location: ${document.location}, state: ${JSON.stringify(event.state)}`);
        };
        dom_setup(false);
        load_hash();


        // start plotting
//        if (!Figure.current) {
//            (new Figure()).focus();
//        }
        if (!Plot.current) {
            console.debug("Plot.current -> creating new", setup["plot"], setup);
            (new Plot(setup["plot-expression"])).focus(); // initialize a plot and give it initial math expression from DOM
            for (let country of ["Czechia", "Italy"]) { // X ["Czechia", "United Kingdom"] european_countries
                Territory.get_by_name(country, Territory.COUNTRY).set_active().show();
            }
        }
        refresh(set_ready = true);

        // loading effect
        if (show_menu) { // show cases are shown instead of the editor
            $("main").fadeIn(2000);
            ready_to_refresh = false;
            $("#view-menu input").change(); // even though all input triggered change event in load_hash, if `main` is invisible, this had no effect (ex: #view-menu child is not displayed if off even though its parent is on)
            ready_to_refresh = true;
        }
    });
});



/**
 * window.hash -> `setup` -> DOM
 * @returns {undefined}
 */
function load_hash() {
    console.log("Load hash trying ...");
    try {
        let hash = "{" + decodeURI(window.location.hash.substr(1)) + "}";
        console.log("Hash", /*hash, just_stored_hash, */" (having val: ", setup["outbreak-value"]);
        if (hash === just_stored_hash || hash === "{}") {
            console.log("... just stored.");
            return;
        }
        just_stored_hash = hash;
        setup = JSON.parse(hash);
    } catch (e) {
        console.warn("... cannot parse");
        return;
    }
    console.log("... load hash now!", setup);
    let original = ready_to_refresh; // block many refreshes issued by every $el.change call
    ready_to_refresh = false;
    for (let key in setup) {
        let val = setup[key];

        // handle keys that `refresh` does not handle: plots and chart-size
        if (key === "plots" || key === "figures") {
            continue; // will be handled later since it is important figures are deserialized earlier
        } else if (key === "chart-size") {
            Figure.chart_size({"from": val});
        }

        // key may be a DOM element too
        let $el = $("#" + key);
        if (!key in setup || !$el.length) {
            continue;
        }
        if ((ion = $el.data("ionRangeSlider"))) {
            if (ion.options.type === "double") {
                if (key === "day-range" && val[2] === val[1]) {
                    // if we shared day range till 10 and that was the maximum day, use current maximum day and shift the "from" day
                    if (val[0] !== 0) {
                        // ex: "from" day was "7 days ago" when link bookmarked, restore this to be "7 days ago" too
                        // XX I am not sure this is the expected behaviour. Sometimes you just want your chart to start the 1st Mar or something.
                        val[0] += ion.options.max - val[1];
                    }
                    val[1] = ion.options.max;
                }
                ion.update({from: val[0], to: val[1]});
            } else {
                if (!$el.data("has-bound-input")) {
                    //   val = r.options.values.length ? r.options.values[r.result.from] : r.result.from;
                    ion.update({from: val});
                }
                continue; // we will not trigger $el.change event because bound-$input will trigger it for us
            }
        } else if ($el.attr("type") === "checkbox" || $el.attr("type") === "radio") {
            $el.prop("checked", val);
        } else {
            $el.val(val);
        }

//        if ($el.attr("id").indexOf("outbreak-") > -1) {
//            console.log("ZDE changuju", $el.attr("id"), val);
//        }
        $el.change();
    }

    // process parameters whose order is important
    let val;
    if ((val = setup["figures"])) {
        Figure.deserialize(val);
    }
    if ((val = setup["plots"])) {
        Plot.deserialize(val);
    }


//    console.log("Refresh!");
    ready_to_refresh = original;
    refresh(false);
}


/*
 * DOM -> `setup`
 * @param {type} load_from_hash
 * @param {type} allow_window_hash_change
 * @returns {undefined}
 */
function dom_setup(allow_window_hash_change = true) {
    // read all DOM input fields
    $("#setup input:not(.nohash)").each(function () {
        // Load value from the $el to setup.
        $el = $(this);
        let key = $el.attr("id");
        let val;
        if ((ion = $el.data("ionRangeSlider"))) {
            if (ion.options.type === "double") {
                if (key === "day-range") {
                    // add maximum day so that we are able to update maximum day when shared
                    val = [ion.result.from, ion.result.to, ion.options.max];
                } else {
                    val = [ion.result.from, ion.result.to];
                }
            } else {
                val = ion.result.from;
            }
        } else if ($el.attr("type") === "checkbox" || $el.attr("type") === "radio") {
            val = $el.prop("checked") ? 1 : 0;
        } else {
            val = $el.val();
        }
        setup[key] = val;
    });

    // convert global input fields to plot attributes
    // these parameters were handled by their respective object
    // more over, there is no need to save them in hash, they are reconstructed on (Figure|Plot).focus
    if (Plot.current) {
        Plot.current.dom_setup();
    }

    if (Figure.current) {
        Figure.current.dom_setup();
    }

    if (allow_window_hash_change) {
        // save to hash
        setup["plots"] = Plot.serialize();
        setup["figures"] = Figure.serialize();

        // ignore day-range from unique hash -> day-range can very but thumbnail will stay the same
        // Default day-range (all days) is longer every day and the hash for the same chart would vary.
        let day_range = setup["day-range"];
        delete setup["day-range"];
        chart_id = hashFnv32a(JSON.stringify(setup), true);
        setup["day-range"] = day_range;

        let s = just_stored_hash = JSON.stringify(setup);
        let state = s.substring(1, s.length - 1);
        history.pushState(null, "", "chart=" + chart_id + "#" + state);
//        window.location.hash = s.substring(1, s.length - 1); XX
        //console.log("Hash stored with val: ", setup["outbreak-value"]);
}
}





/**
 *
 * @param {bool|Event} event True -> make refresh possible further on. False -> refresh but do not change window hash (would stop slider movement). Event -> callback from an input change, no special action.
 * @returns {Boolean}
 */
function refresh(event = null) {
    // pass only when ready
    if (event === true) {
        ready_to_refresh = true;
    } else if (!ready_to_refresh) {
        return false;
    }
    // assure `setup` is ready
    let can_redraw_sliders = event !== false;
//    console.log("REFRESH CALLED", event, can_redraw_sliders);
    dom_setup(typeof (event) !== "boolean"); // refresh window.location.hash only if we came here through a DOM event, not through load (event === false || true). We want to conserve chart_id in the hash till the thumbnail can be exported if needed.
    $("#export-data").html(""); // reset export-data, will be refreshed in Figure.refresh/Figure.prepare_export


    // build chart data
    // process each country
    let boundaries = Object.values(Figure.figures).map(f => f.refresh()); // XX we may refresh current figure only if not loading. But that imply we have to set Outbreak and Days range independent.

    // XX all figures have the same outbreak and day range, this is not ideal
    if (can_redraw_sliders) {
        let max = Math.max(...boundaries.map(i => i[1])); // boundary total max

        if (setup["outbreak-mode"]) {
            max = Math.min(max * 100000 / boundaries.map(i => i[2]).sum());
        }
        let values;
        if (!isFinite(max)) { // all values can be NaN, ex: when toggling outbreak mode to population
            max = setup["outbreak-value"];
            values = [1, 2, 3, 4, 5, 6, 7, 8, 9, setup["outbreak-value"]];
        } else {
            values = logslider(1, 100, 1, max);
        }
        // console.log("Refresh_ change threshold to:", values, $("#outbreak-threshold").data("ionRangeSlider").result.from, values[ $("#outbreak-threshold").data("ionRangeSlider").result.from]);
        $("#outbreak-threshold").data("values", values).data("ionRangeSlider").update({
            values: values
        });
        set_slider($("#outbreak-threshold"), setup["outbreak-value"]);
    }

    $("#export-link").val(window.location.href);
}


function set_slider($slider, val, init_position = null) {
//    console.log("Set slider", $slider.attr("id"), val, init_position);
    let r = $slider.data("ionRangeSlider");
    let o = {};
    if (init_position) {
        r.options.values = range(init_position);
        r.options.values[init_position] = val;
        o["from"] = init_position;
    } else if (r.options.values.length) {
        let index = 0;
        for (let i in r.options.values) {
            if (val <= r.options.values[i]) { // this is the chosen position, slighly greater than the wanted value
                index = i;
                break;
            }
        }
        if (index >= r.options.values.length) { // we have not found the position - put there the greatest
            index = r.options.values.length;
        }
//        console.log("Changed value", r.options.values, index);
        r.options.values[index] = parseInt(val);
//        console.log("Changed values:", r.options.values);
        o["from"] = index;
        //$slider.update({from: index});

    } else {
        //let o = {from: val};
        o["from"] = val;
        if (r.result.max < val) {
            o["max"] = val;
        }
    }
//    console.log("Updating", $slider.attr("id"), o);
    r.update(o);
}

function export_thumbnail() {
    // resize the canvas and upload to the server
    console.log("Exporting thumbnail");
    $.ajax({
        url: window.location.pathname + "/upload", // /chart=HASH/upload
        method: "post",
        data: {"png": exportCanvasAsPNG(make_thumbnail($("canvas")[0]))}
    });
}
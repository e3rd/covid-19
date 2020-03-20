// definitions
var ready_to_refresh = false;
var url_pattern = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-';
var just_stored_hash = ""; // determine if hash change is in progress

$(function () {
    // DOM configuration

    // canvas configuration
    $("#canvas-container").on("mouseleave", "canvas", function () {
        Figure.get($(this).attr("id").substr("figure-".length)).mouse_leave(); // unhighlight dataset on mouse leave
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
        values: [1] //Xrange(101)
    }).data("bound-input", $("#outbreak-value"));

    $("#outbreak-value").change(function () {
        // update corresponding slider to have to nearest value possible
        //console.log("Outbreak value change to VAL:", $(this).val());
        set_slider($("#outbreak-threshold"), $(this).val());
    });

    // disabling outbreak will disable its range
    $("#outbreak-on").change(function () {
        $("#outbreak-threshold, #outbreak-value").parent().toggle($(this).prop("checked"));
    });

    // refresh on input change
    $("#setup input:not(.irs-hidden-input)").change(refresh); // every normal input change
    $("#setup input.irs-hidden-input").each(function () { // sliders
        if ($(this).closest(".custom-handler").length) {
            return;
        }
        let opt = $(this).data("ionRangeSlider").options;
        let $input = $(this).data("bound-input");
        if ($input) {
            $input.data("bound-slider", $(this));
        }

        opt.onFinish = refresh;
        // do not change window hash when moving input slider
        opt.onChange = () => {
            if ($input) {
                let r = $(this).data("ionRangeSlider").result;
                let val = opt.values ? opt.values[r.from] : r.from;
                $input.val(val);
            }
            refresh(false);
        };
    });
    // refresh on plot change
    $plot.keyup(function () {
        let v = $(this).val();
        if ($(this).data("last") !== v) {
            Plot.current_plot.refresh_html(v);
            refresh();
            $(this).data("last", v);
        }
    });
    // place plot on a different figure
    $("#plot-stack").on("change", ".plot-figure", function () {
        let plot = $(this).parent().data("plot").focus();
        plot.set_figure(Figure.get($(this).val()));
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
        let cp = Plot.current_plot;
        if (!cp.valid) {
            alert("This plot expression is invalid");
            $plot.focus();
            return;
        }
        //Plot.current_plot.assure_stack();
        $plot.val("");
        let p = (new Plot()).focus();
        p.checked = Object.assign(cp.checked);
        p.starred = Object.assign(cp.starred);
        p.refresh_html();
        $plot.focus();
    });
    // clicking on a plot stack curve label
    $("#plot-stack").on("click", "> div", function (event) {
        let plot = $(this).data("plot");
        if (event.target === $("span.name", $(this))[0]) { // re-edit
            plot.focus();
        } else {
            if (event.target === $("span.remove", $(this))[0]) { // delete plot
                $(this).data("plot").remove();
            } else if (event.target === $("span.shown", $(this))[0]) { // toggle hide
                $(this).toggleClass("active", plot.active = !plot.active);
            }
            refresh();
        }
    });
    //reset zoom ready
    $("#reset-zoom").on("click", "a", Figure.reset_zoom);








    // runtime
    $.when(// we need to build Territory objects from CSV first
            $.get(url_pattern + "Confirmed.csv", (data) => Territory.build(data, "confirmed")),
            $.get(url_pattern + "Deaths.csv", (data) => Territory.build(data, "deaths")),
            $.get(url_pattern + "Recovered.csv", (data) => Territory.build(data, "recovered")),
            ).then(() => {

        // setup options according to data boundaries
        $("#day-range").data("ionRangeSlider").update({max: Territory.header.length});

        // build territories
        let $territories = $("#territories");
        let td = (col_id, storage) => {
            let text = [];
            for (let o of Object.values(storage)) {
                text.push(o.get_html());
            }
            $("> div:eq(" + col_id + ")", $territories).append(text.join(""));
        };
        td(0, Territory.states);
        td(1, Territory.countries);
        td(2, Territory.continents);
        $("> div", $territories).on("click", "> div", function (event) {
            let t = Territory.get_id($(this).attr("id"));
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
            refresh();
        });

        // view menu switches parts of the program on/off
        let view_change = function () {
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
        };
        $(".custom-control-input").change(view_change).each(view_change);


        // document events
        window.addEventListener('hashchange', () => {
            console.log("HASH change event");
            load_hash();
        }, false);
        refresh_setup(false);
        load_hash();


        // start plotting
        if (!Plot.plots.length) {
            console.debug("Plot.current -> creating new", setup["plot"], setup);
            (new Plot(setup["plot"])).focus(); // current plot
            for (let country of ["Czechia", "Italy"]) { // X ["Czechia", "United Kingdom"] european_countries
                Territory.get_by_name(country, Territory.COUNTRY).set_active().show();
            }
        } else {
            console.debug("Plot.current -> using old");
            Plot.plots[0].focus();
        }
        refresh(set_ready = true);
        //Figure.chart_size();

        // loading effect
        $("main").show();
        //$("main").fadeIn(1000); XXX
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
        //console.log("Hash", hash, just_stored_hash, " (having plot: ", setup["plot"]);
        if (hash === just_stored_hash || hash === "{}") {
            return;
        }
        setup = JSON.parse(hash);
    } catch (e) {
        return;
    }
    console.log("... load hash now!", setup);
    for (let key in setup) {
        let val = setup[key];

        // handle keys that `refresh` does not handle: plots and chart-size
        if (key === "plots") {
            Plot.deserialize(val);
            continue;
        } else if (key === "chart-size") {
            Figure.chart_size({"from": val});
        }

        // key may be a DOM element too
        let $el = $("#" + key);
        if (!key in setup || !$el.length) {
            continue;
        }
        if ((r = $el.data("ionRangeSlider"))) {
            if (r.options.type === "double") {
                r.update({from: val[0], to: val[1]});
//           X } else if ($el.data("bound-input")) {
//                console.log("load hash ion set input", $el.attr("id"));
//                set_slider($el, $el.data("bound-input").val(), val);
//                continue; // we will not trigger $el.change event because bound-input will trigger it for us
            } else {
                val = r.options.values ? r.options.values[r.result.from] : r.result.from;

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
//    console.log("Refresh!");
    refresh();
}


/*
 * DOM -> `setup`
 * @param {type} load_from_hash
 * @param {type} allow_window_hash_change
 * @returns {undefined}
 */
function refresh_setup(allow_window_hash_change = true) {
    let thr = null;
    $("#setup input").each(function () {
        // Load value from the $el to setup.
        $el = $(this);
        let key = $el.attr("id");
        let val;
        if ((r = $el.data("ionRangeSlider"))) {
            if (r.options.type === "double") {
                val = [r.result.from, r.result.to];
            } else {
                // val = r.options.values ? r.options.values[r.result.from] : r.result.from;
                val = r.result.from;
            }
        } else if ($el.attr("type") === "checkbox" || $el.attr("type") === "radio") {
            val = $el.prop("checked") ? 1 : 0;
        } else {
            val = $el.val();
        }
        //console.log("Refresh setup", key, "from", setup[key], " to ", $el.val());
        setup[key] = val;
    });

    if (allow_window_hash_change) {
        // save to hash
        setup["plots"] = Plot.serialize();
        let s = just_stored_hash = JSON.stringify(setup);
        window.location.hash = s.substring(1, s.length - 1);
        //console.log("Hash stored with plot: ", setup["plot"]);
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
    refresh_setup(can_redraw_sliders);


    // build chart data
    // process each country
    let boundaries = Object.values(Figure.figures).map(f => f.refresh());

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
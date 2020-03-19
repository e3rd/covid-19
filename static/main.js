// definitions
var ready_to_refresh = false;
var url_pattern = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-';
var just_stored_hash = ""; // determine if hash change is in progress

$(function () {
    //
    // DOM configuration
    $("#day-range").ionRangeSlider({
        skin: "big",
        type: "double",
        grid: true,
        min: 0,
        max: 100, //XX setup["day-range"][1],
        to: 100, //XXsetup["day-range"][1],
        from: 0
    });

    $("#outbreak-threshold").ionRangeSlider({
        skin: "big",
//        type: "double",
        grid: true,
        min: 0,
        max: 50
    });

    $("#outbreak-value").change(function () {
        let ion = $("#outbreak-threshold").data("ionRangeSlider");
        let v = {from: $(this).val()};
        if (ion.options.max < $(this).val()) {
            v["max"] = $(this).val();
        }
        ion.update(v);
    });

    // disabling outbreak will disable its range
    $("#outbreak-on").change(function () {
        $("#outbreak-threshold, #outbreak-value").parent().toggle($(this).prop("checked"));
    });
    /*$("#outbreak-on").click(outbreak_range);
     outbreak_range.call($("#outbreak-on")); // will immediately disable outbreak (changing the DOM default behaviour to off)*/

    // refresh on input change
    $("#setup input:not(.irs-hidden-input)").change(refresh); // every normal input change
    $("#setup input.irs-hidden-input").each(function () { // sliders
        let opt = $(this).data("ionRangeSlider").options;
        opt.onFinish = refresh;
        // do not change window hash when moving input slider
        opt.onChange = () => {
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
        let id = $(this).val();
        Figure.get(id); // assure it exists
        plot.figure = id;
        refresh(false);
    });
    // possibility to add a new plot
    $("#plot-new").click(() => {
        console.log(Plot.current_plot, "PLOOOOO", Plot.current_plot.valid);
        let cp = Plot.current_plot;
        if (!cp.valid) {
            alert("This plot expression is invalid");
            $plot.focus();
            return;
        }
        //Plot.current_plot.assure_stack();
        console.log("Resets $plot.val");
        $plot.val("");
        let p = (new Plot()).focus();
        p.checked = Object.assign(cp.checked);
        p.starred = Object.assign(cp.starred);
        p.refresh_html();
        console.log("OP fokusu", cp.checked.length, p.checked.length);
        $plot.focus();
    });
    // clicking on plot stack
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

        // draw territories
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
        // XX? $("#uncheck-all").click(Territory.uncheck_all);

        // document events
        window.addEventListener('hashchange', () => {
            console.log("HASH change event");
            //load_hash();
        }, false);
        refresh_setup(true, false);


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

        // toggle chart size
        $("#big-chart").change(Figure.chart_size);
        Figure.chart_size();

        // start plotting
        if (!Plot.plots.length) {
            console.debug("Plot.current -> creating new", setup["plot"], setup);
            (new Plot(setup["plot"])).focus(); // current plot
            for (let country of ["Czechia", "Italy"]) { // X ["Czechia", "United Kingdom"] european_countries
                Territory.get_by_name(country, Territory.COUNTRY).set_active();
            }
        } else {
            console.debug("Plot.current -> using old");
            Plot.plots[0].focus();
        }
        refresh(set_ready = true);

        // loading effect
        $("main").show();
        //$("main").fadeIn(1000); XXX
    });
});



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
        if (key === "plots") {
            Plot.deserialize(val);
            continue;
        }
        let $el = $("#" + key);
        if (!key in setup) {
            continue;
        }
        if ((r = $el.data("ionRangeSlider"))) {
            if (r.options.type === "double") {
                r.update({from: val[0], to: val[1]});
            } else {
                r.update({from: val});
            }
        } else if ($el.attr("type") === "checkbox") {
            $el.prop("checked", val);
        } else {
            $el.val(val);
        }
    }
    $("#outbreak-on").change();
    refresh();
}


function refresh_setup(load_from_hash = false, allow_window_hash_change = true) {
    $("#setup input").each(function () {
        // Load value from the $el to setup.
        $el = $(this);
        let key = $el.attr("id");
        let val;
        if ((r = $el.data("ionRangeSlider"))) {
            if (r.options.type === "double") {
                val = [r.result.from, r.result.to];
            } else {
                val = r.result.from;
            }
        } else if ($el.attr("type") === "checkbox") {
            val = $el.prop("checked") ? 1 : 0;
        } else {
            val = $el.val();
        }
        //console.log("Refresh setup", key, "from", setup[key], " to ", $el.val());
        setup[key] = val;
    });

    if (load_from_hash) {
        //console.log("Call load_hash from refresh_setup");
        load_hash();
    } else if (allow_window_hash_change) {
        $("#outbreak-value").val(setup["outbreak-threshold"]);
        // save to hash
        setup["plots"] = Plot.serialize();
        let s = just_stored_hash = JSON.stringify(setup);
        console.log("STORIGN hash", s); // XXX
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
    refresh_setup(false, can_redraw_sliders);


    // build chart data
    // process each country
    let boundary_total_max = Math.max(Object.values(Figure.figures).map(f => f.refresh()));

    // XX all figures have the same outbreak and day range, this is not ideal
    if (can_redraw_sliders) {
        $("#outbreak-threshold").data("ionRangeSlider").update({
            //min: boundaries[0],
            max: boundary_total_max
        });

        //console.log("MIN", boundary_max);
}
}


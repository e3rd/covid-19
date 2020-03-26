// definitions
var ready_to_refresh = false;
//var url_pattern = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-';
var url_pattern = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_';
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
        $("#outbreak-threshold, #outbreak-value, #outbreak-mode").parent().toggle($(this).prop("checked"));
    }).change();

    // refresh on input change
    // every normal input change will redraw chart
    // (we ignore sliders and .copyinput (#export-link would cause recursion)
    $("#setup input:not(.irs-hidden-input):not(.nohash)").change(refresh);

    // sliders input change
    $("#setup input.irs-hidden-input").each(function () {
        let opt = $(this).data("ionRangeSlider").options;
        if ($(this).closest(".custom-handler").length) {
            // we are in the view menu DOM context
            opt.onFinish = refresh_setup; // each change in the view menu should be remembered (note that its onFinish event is rewritten)
            return;
        }

        // we are in the main application DOM context
        let $input = $(this).data("bound-input");
        if ($input) {
            $input.data("bound-slider", $(this));
        }

        opt.onFinish = refresh;
        // do not change window hash when moving input slider
        opt.onChange = () => {
            if ($input) {
                let r = $(this).data("ionRangeSlider").result;
                let val = opt.values.length ? opt.values[r.from] : r.from;
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
        let p = new Plot();
        p.checked = Object.assign(cp.checked);
        p.starred = Object.assign(cp.starred);
        p.focus().refresh_html();
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
        td(2, Territory.continents);
        world.eye(); // world starts toggled
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
            } else if ($el.data("bound-input")) {
//                console.log("load hash ion set input", $el.attr("id"));
//                set_slider($el, $el.data("bound-input").val(), val);
                continue; // we will not trigger $el.change event because bound-input will trigger it for us
            } else {
                //   val = r.options.values.length ? r.options.values[r.result.from] : r.result.from;
                r.update({from: val});
                continue;

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
    ready_to_refresh = original;
    refresh(false);
}


/*
 * DOM -> `setup`
 * @param {type} load_from_hash
 * @param {type} allow_window_hash_change
 * @returns {undefined}
 */
function refresh_setup(allow_window_hash_change = true) {
    $("#setup input:not(.nohash)").each(function () {
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
        let state = s.substring(1, s.length - 1);
        state_hash = hashFnv32a(state, true);
        history.pushState(null, "", "chart=" + state_hash + "#" + state);
//        window.location.hash = s.substring(1, s.length - 1); XX
        console.log("Hash stored with val: ", setup["outbreak-value"]);
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
    refresh_setup(can_redraw_sliders);
    $("#export-data").html(""); // reset export-data, will be refreshed in Figure.refresh/Figure.prepare_export


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

    // XXX when clicked on copy link

    console.log("Exporting thumbnail");
    $.ajax({
        url: window.location.pathname + "/upload", // /chart=HASH/upload
        method: "post",
        data: {"png": exportCanvasAsPNG(make_thumbnail($("canvas")[0]))}
    });
}
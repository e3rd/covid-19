// definitions
var setup = {};
var chart = null; // chart instance
var just_stored_hash = ""; // determine if hash change is in progress
let url_pattern = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-';
let ready_to_refresh = false;
var $plot = $("#plot");

$(function () {
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
        opt.onChange = (a, b, c) => {
            console.log("AAA", a, b, c);
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
        let id = $(this).val();
        Figure.get(id); // assure it exists
        Plot.current_plot.figure = id;
        refresh(false);
    });
    // possibility to add a new plot
    $("#plot-new").click(() => {
        console.log(Plot.current_plot, "PLOOOOO", Plot.current_plot.valid);
        let cp = Plot.current_plot;
        if (!cp.valid) {
            alert("This plot expression is invalid");
            return;
        }
        //Plot.current_plot.assure_stack();
        console.log("Resets $plot.val");
        $plot.val("");
        let p = (new Plot()).focus();
        p.checked = Object.assign(cp.checked);
        p.starred = Object.assign(cp.starred);
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
            load_hash();
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
        console.log("PROKO CHECKED", $("#big-chart").prop("checked"), setup);
        Figure.chart_size();

        // start plotting
        if (!Plot.plots.length) {
            console.log("CREATING NEW", setup["plot"], setup);
            (new Plot(setup["plot"])).focus(); // current plot
            for (let country of ["Czechia", "Italy"]) { // X ["Czechia", "United Kingdom"] european_countries
                Territory.get_by_name(country, Territory.COUNTRY).set_active();
            }
        } else {
            console.log("USING OLD");
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
    console.log("... LOAD HASH NOW!", setup);
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
        window.location.hash = s.substring(1, s.length - 1);
        //console.log("Hash stored with plot: ", setup["plot"]);
}
}



class Figure {
    constructor(id) {
        this.chart = null;
        this.id = id;
        Figure.figures[id] = this;

        this.$element = $("<canvas />", {id: "figure-" + id}).appendTo(("#canvas-container"));
    }

    static get(id) {
        let f;
        if (id in Figure.figures) {
            f = Figure.figures[id];
        } else {
            f = new Figure(id);
        }
        return f;
    }

    static chart_size() {
        $("#canvas-container").toggleClass("big", $("#big-chart").prop("checked"));
        Object.values(Figure.figures).forEach(f => f.chart && f.chart.resize());
        console.log("SIZE", Object.values(Figure.figures), $("#big-chart").prop("checked"));
    }

    static reset_zoom() {
        for (let o of Object.values(Figure.figures)) {
            let chart = o.chart;
            chart.resetZoom();
            chart.config.options.plugins.zoom.pan.enabled = false;
            chart.config.options.plugins.zoom.zoom.enabled = true;
        }
        $("#reset-zoom").fadeOut(500);
    }

    remove() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.$element.remove();
    }

    init_chart() {
        return this.chart = new Chart(this.$element, {
            type: 'line',
            data: {},
            options: {
                title: {
                    display: false,
                    text: ""
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
//                    callbacks: {
//                        label: function (tooltipItem, data) {
//                            var label = data.datasets[tooltipItem.datasetIndex].label || '';
//
//                            if (label) {
//                                label += ': ';
//                            }
//                            label += Math.round(tooltipItem.yLabel * 100) / 100;
//                            return label;
//                        }
//                    }
                },

                scales: {
                    xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true
                            }
                        }],
                    yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: 'Total confirmed cases'
                            },
                            ticks: {
                                callback: function (value, index, values) {
                                    return Number(value.toString());
                                }
                            }
                        }]
                },
                plugins: {
                    zoom: {
                        // Container for pan options
                        pan: {
                            // Boolean to enable panning
                            enabled: false,

                            // Panning directions. Remove the appropriate direction to disable
                            // Eg. 'y' would only allow panning in the y direction
                            // A function that is called as the user is panning and returns the
                            // available directions can also be used:
                            //   mode: function({ chart }) {
                            //     return 'xy';
                            //   },
                            mode: 'xy',

                            rangeMin: {
                                // Format of min pan range depends on scale type
                                x: null,
                                y: null
                            },
                            rangeMax: {
                                // Format of max pan range depends on scale type
                                x: null,
                                y: null
                            },

                            // On category scale, factor of pan velocity
                            speed: 20,

                            // Minimal pan distance required before actually applying pan
                            threshold: 10,

                            // Function called while the user is panning
                            onPan: function ( {chart}) {
                                console.log(`I'm panning!!!`);
                            },
                            // Function called once panning is completed
                            onPanComplete: function ( {chart}) {
                                console.log(`I was panned!!!`);
                            }
                        },

                        // Container for zoom options
                        zoom: {
                            // Boolean to enable zooming
                            enabled: true,

                            // Enable drag-to-zoom behavior
//                        drag: true,

//                         Drag-to-zoom effect can be customized
                            drag: {
                                borderColor: 'rgba(225,225,225,0.3)',
                                borderWidth: 5,
                                backgroundColor: 'rgb(225,225,225)',
                                animationDuration: 0
                            },

                            // Zooming directions. Remove the appropriate direction to disable
                            // Eg. 'y' would only allow zooming in the y direction
                            // A function that is called as the user is zooming and returns the
                            // available directions can also be used:
                            //   mode: function({ chart }) {
                            //     return 'xy';
                            //   },
                            mode: 'xy',

                            rangeMin: {
                                // Format of min zoom range depends on scale type
                                x: null,
                                y: null
                            },
                            rangeMax: {
                                // Format of max zoom range depends on scale type
                                x: null,
                                y: null
                            },

                            // Speed of zoom via mouse wheel
                            // (percentage of zoom on a wheel event)
                            speed: 0.1,

                            // On category scale, minimal zoom level before actually applying zoom
                            sensitivity: 3,

                            // Function called while the user is zooming
                            onZoom: function ( {chart}) {
                                console.log(`I'm zooming!!!`);
                            },
                            // Function called once zooming is completed
                            onZoomComplete: function ( {chart}) {
                                chart.config.options.plugins.zoom.pan.enabled = true;
                                chart.config.options.plugins.zoom.zoom.enabled = false;
                                $("#reset-zoom").show(); // XX might work for every chart independently
                                //this.enabled = false;
                                console.log(this, chart);
                                console.log(`I was zoomed!!!`);
                            }
                        }
                    }
                }
            }
        });
    }
}
Figure.figures = {};
Figure.get(1); // create the default figure


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
    let longest_data = 0;
    let datasets = {};
    let boundary_max = 0;
    for (let figure_id in Figure.figures) {
        let [plot_data, boundaries] = Plot.get_data(figure_id);

        let figure = Figure.get(figure_id);
        let chart = figure.chart;

        if (!plot_data.length) { // error when processing plot function formula
            figure.remove();
            continue;
        }
        boundary_max = Math.max(boundary_max, boundaries[1]);

        /**
         *
         * @type {Territory|Plot} territory If sum-territories is on, we receive Plot
         */
        for (let [plot, territory, data] of plot_data) {
            // choose only some days in range
            if (!data.length) {
                continue;
            }
            let chosen_data = [];
            let [name, label, starred, id] = plot.territory_info(territory);
            let color = "#" + intToRGB(hashCode(name));
            //console.log("Dataset", label, starred, id);
            for (let i = setup["day-range"][0]; i < data.length && i < setup["day-range"][1]; i++) {
                chosen_data.push(data[i]);
            }

            longest_data = Math.max(longest_data, setup["day-range"][0] + chosen_data.length);
            //console.log("Longest", longest_data, chosen_data.length, chosen_data);
            //console.log("Territory", territory.name, territory.is_starred);
            // push new dataset
            let dataset = {
                type: 'line',
                borderColor: color,
                label: label,
                data: chosen_data,
                borderWidth: starred ? 6 : 3,
                fill: false,
                backgroundColor: color,
                id: id
            };
            datasets[id] = dataset;
        }
        let r = range(setup["day-range"][0], Math.min(longest_data, setup["day-range"][1]));
        //console.log(r, longest_data);
        let labels = setup["outbreak-on"] ? r.map(String) : r.map(day => Territory.header[parseInt(day)]);

        // update chart data
        if (!chart) {
            chart = figure.init_chart();
            chart.data = {datasets: Object.values(datasets), labels: labels};
        } else {
            // update just some datasets, do not replace them entirely (smooth movement)
            chart.data.labels = labels;
            let removable = [];
            // update changed
            for (let o of chart.data.datasets) {
                if (o.id in datasets) { // update changes
                    let d = datasets[o.id];
                    o.data = d.data;
                    o.borderWidth = d.borderWidth;
                    o.label = d.label;
                    delete datasets[o.id];
                } else {
                    removable.push(o);
                }
            }
            // remove unused
            chart.data.datasets = chart.data.datasets.filter((el) => !removable.includes(el));
            // insert new
            Object.values(datasets).forEach(el => chart.data.datasets.push(el));
        }
        if (!chart.data.datasets.length) {
            console.log(Object.values(datasets), "No data");
            chart.options.title.text = "No data";
            chart.options.title.display = true;
        } else {
            chart.options.title.text = Plot.plots.filter(p => p.active).map(p => p.get_name()).join(", ");
            chart.options.title.display = true;
        }
        chart.options.scales.xAxes[0].scaleLabel.labelString = `Days count since >= ${setup["outbreak-threshold"]} confirmed cases`;
        chart.options.scales.yAxes[0].type = setup["log-switch"] ? "logarithmic" : "linear";
        chart.update();
    }

    // XX all figures have the same outbreak and day range, this is not ideal
    if (can_redraw_sliders) {
        $("#outbreak-threshold").data("ionRangeSlider").update({
            //min: boundaries[0],
            max: boundary_max
        });

        console.log("MIN", boundary_max);
}
}


setup = setup || {};
let DATASET_BORDER = {
    true: 6,
    false: 3
};


class Figure {
    constructor(type = Figure.TYPE_LOG_TIME) {
        this.type = type;
        this.last_type = null;

        this.chart = null;
//        this.id = id * 1;

        Figure.figures.push(this);
        this.id = Figure.figures.length;
        this.plots = [];

        this.$element = $("<canvas />", {id: "figure-" + this.id}).appendTo($("#canvas-container")).data("figure", this);

        this.check_canvas_container();
        $("#canvas-container").sorting("> canvas");

        this.hovered_dataset;
        this.datasets_used;
        Figure.chart_size();

        this.is_line;  // if any "line" present = "line"
    }

    static serialize() {
//        setup["figure"] = Figure.current.id;
        return Object.values(Figure.figures).map(p => {
            return [p.type];
        });
    }

    static deserialize(data) {
        data.forEach((d) => new Figure(...d));
//        if (Figure.figures.length) {
//            Figure.figures[setup["figure"]-1 || 0].focus();
//        }
    }

    focus() {
        Figure.current = this;
        let ion = $("#axes-type").data("ionRangeSlider");
        ion.update({from: this.type});
        ion.options.onChange(); // on load time, make this write aloud the legend (ex: "log/time")
        return this;
    }

    dom_setup() {
        let v = Figure.current.type = setup["axes-type"];
        let hide = [Figure.TYPE_LOG_DATASET, Figure.TYPE_PERCENT_TIME].indexOf(v) > -1;

        // only if we are not in Figure.TYPE_LOG_DATASET mode we can change from line to bar etc.
        // XX Disable this functionality too for Figure.TYPE_PERCENT_TIME. Here we should still have the possibility to change between STACKED_PLOT|TERRITORY.
        $("#plot-type").closest(".range-container").toggle(!hide);
        this.plots.forEach(p => p.refresh_html()); // XX this is not so elegant; we want to refresh all plots (icon might have changed) but Plot.current has already been refreshed
//
//        $("#plot-type").data("ionRangeSlider").update({
//            from_fixed: false
//        });
//        this.plots.forEach(p=> p.refresh_html()); // refresh icon

        delete setup["axes-type"];
    }

    check_canvas_container() {
        $("#canvas-container").toggleClass("multiple", Object.keys(Figure.figures).length > 1);
    }

    add_plot(plot) {
        this.plots.push(plot);
        return this;
    }
    remove_plot(plot) {
        this.plots = this.plots.filter(it => it !== plot);
        return this;
    }

    /**
     * Assure the figure exists and returns it.
     * @param {type} id
     * @returns {Figure}
     */
    static get(id) {
        id -= 1;
        let f;
        if (id in Figure.figures) {
            f = Figure.figures[id];
        } else {
            f = new Figure();
        }
        return f;
    }

    /*
     * Change size of all the figures.
     * @param {Object} e.from => value
     */
    static chart_size(e) {
        if (e) {
            this.default_size = e.from;
        }
        $("#canvas-container").css("width", this.default_size + "%");
        Object.values(Figure.figures).forEach(f => f.chart && f.chart.resize());
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
        this.check_canvas_container();
    }

    /**
     * Unhighlight dataset on mouse leave
     * @returns {undefined}
     */
    mouse_leave() {
        if (this.hovered_dataset !== null && this.chart) {
            this.unhighlight(this.hovered_dataset);
            this.hovered_dataset = null;
            this.chart.update();
            this.chart.update();  // ChartJS 2.9.3 bug: when changing bar chart, it gets reflected on the second `update` call
        }
    }

    /**
     * Get dataset meta properties
     * @param {type} dataset_id
     * @returns {undefined}
     */
    meta(dataset_id) {
        return this.datasets_used[this.chart.data.datasets[dataset_id].id];
    }

    /**
     * Resets the width according to `star` parameter of this.meta property
     * @param {type} dataset_id
     * @returns {undefined}
     */
    unhighlight(dataset_id) {
        let m = this.meta(dataset_id);
        Object.assign(this.chart.data.datasets[dataset_id], {
            borderWidth: DATASET_BORDER[m.star],
            borderColor: m.borderColor,
            backgroundColor: m.backgroundColor
        });
    }

    hover(i) {
        // is already hovered
        if (i === this.hovered_dataset) {
            return;
        } else if (this.hovered_dataset !== null) {
            // unhover old dataset
            this.unhighlight(this.hovered_dataset);
        }

        // hightlight new dataset
        this.hovered_dataset = i;
        let m = this.meta(i);
        Object.assign(this.chart.data.datasets[i], {
            borderWidth: this.is_line ? 10 : 5,
            borderColor: this.is_line ? m.highlightColor : "red",
            backgroundColor: m.highlightColor
        });
        this.chart.update();
        this.chart.update(); // ChartJS 2.9.3 bug: when changing bar chart, it gets reflected on the second `update` call
    }

    init_chart(type = "line", percentage = false) {
        let figure = this;
        Chart.plugins.unregister(ChartDataLabels); // XX line should be remove since ChartDataLabels 1.0
        this.hovered_dataset = null;
        return this.chart = new Chart(this.$element, {
            type: type, // changed to bar if there is no line plot
            data: {},
            plugins: [ChartDataLabels],
            options: {
                legend: {
                    onHover: function (_, item) {
                        figure.hover(item.datasetIndex);
                    }
                },
                onClick: function (evt) {
                    // toggle star on any curve -> if the curve is territory, it is starred as well
                    // this function can receive data (all data on index)
                    let e = this.getElementAtEvent(evt);
                    if (e.length) {
                        let i = e[0]._datasetIndex;
                        let dst = figure.meta(i);
                        let star, label;
                        if (dst.territory) {
                            star = dst.plot.set_star(dst.territory);
                            label = dst.territory.get_name(true);
                        } else { // this is not territory but another curve (aggregated sum of territories)
                            star = !dst.star;
                            label = dst.plot.get_name(star);
                        }
                        dst.star = star;
                        figure.unhighlight(i);
                        this.data.datasets[i].label = label;
                        this.update();
                    }
                },
                onHover: function (evt) {
                    // highlight hovered line
                    let e = this.getElementAtEvent(evt);
                    if (e.length) {
                        figure.hover(e[0]._datasetIndex);
                    }
                },
                title: {
                    display: true,
                    text: "Empty"
                },
                tooltips: {
                    mode: 'index', // mode: 'x' when scatter
                    intersect: false,
                    itemSort: (a, b, data) => b.yLabel - a.yLabel, // sort by value XXX make this togglable
//                    itemSort:  (a, b, data) => data.datasets[b.datasetIndex].label > data.datasets[a.datasetIndex].label ? 1:-1, // sort by dataset name
//                    itemSort: (a, b, data) => { // sort by plot name, then by dataset name
//                        console.log("HU", data.datasets[b.datasetIndex], ctx.meta(b.datasetIndex).plot.expression);
//                        let [i, j] = [ctx.meta(b.datasetIndex).plot.expression, ctx.meta(a.datasetIndex).plot.expression];
//                        if (i === j) {
//                            return data.datasets[b.datasetIndex].label > data.datasets[a.datasetIndex].label ? -1 : 1;
//                        }
//                        return i > j ? 1 : -1;
//                    },
                    callbacks: {
                        title: function (el) {
                            if (setup["outbreak-on"]) {
                                if (setup["outbreak-mode"]) {
                                    return "Population outbreak day " + el[0].xLabel; // XXX replace by label
                                }
                                return "Confirmed case outbreak day " + el[0].xLabel;
                            } else {
                                return new Date(el[0].xLabel).toYMD();
                            }
                        },
                        label: function (el, data) {
                            let label = data.datasets[el.datasetIndex].label || '';
                            if (el.datasetIndex === figure.hovered_dataset) {
                                label = "→ " + label;
                            }

                            if (this.type === Figure.TYPE_LOG_DATASET) { // Absolute numbers axe X
                                label += ` (${el.xLabel}, ${el.yLabel})`; // XXX replace by yLabel => value
                            } else {
                                // Timeline axe X
                                if (label) {
                                    label += ': ';
                                }
                                label += Math.round(el.yLabel * 10000) / 10000;
                                if (setup["outbreak-on"]) {
                                    let start = figure.meta(el.datasetIndex).outbreak_start;
                                    if (start) { // if aggregating, outbreak_start is not known
                                        let day = Territory.header[parseInt(start) + parseInt(el.xLabel)];
                                        label += " (" + (new Date(day).toYMD()) + ")";
                                    }
                                }
                            }

                            return label;
                        }
                    }
                },
                scales: {
                    xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true
                            },
                            stacked: true,
                            id: "normal"
//                        }, { // Xfor unknown reasons, this is not needed
//                            display: false, // this axis is invisible but allows the bars to be stacked
//                            stacked: false,
//                            id: "stacked"
                        }
                    ],
                    yAxes: range(1, 6).map(i => { // create 5 available axes
                        return {
                            display: false,
                            id: i,
                            scaleLabel: {
                                display: true,
                                labelString: i === 1 ? "Cases" : 'Axe ' + i
                            },
                            ticks: {
                                callback: function (value, index, values) {
                                    if (figure.type === Figure.TYPE_PERCENT_TIME) {
                                        return value + " %";
                                    }
                                    return Math.round(value * 1000) / 1000;
                                }
                            }
                        };
                    })
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
                                console.log(`I was zoomed!!!`);
                            }
                        }
                    },
                    datalabels: {
                        display: false,
                        color: 'white',
                        backgroundColor: function ( {dataset}) {
                            return dataset.backgroundColor;
                        },
                        borderRadius: 4,
                        font: {
                            weight: 'bold'
                        },
                        formatter: function (value, item) {
                            if (figure.type === Figure.TYPE_LOG_DATASET) {
                                return "";
                            }
                            try {
                                return figure.is_line ? value : item.dataset.label;
                            } catch (e) {

                            }
                        }
                    },
                    stacked100: {
                        enable: percentage,
                        replaceTooltipLabel: false
                    }
                },
                animation: {
                    onComplete: () => {
                        if (this.id === 1 && REFRESH_THUMBNAIL === chart_id && show_menu) {
                            // chartjs animation finshed, we can alter the image.
                            // But only if chart_id would not change meanwhile (we did not move sliders)
                            REFRESH_THUMBNAIL = 0;
                            export_thumbnail();
                        }
                    }
                }
            }
        });
    }

    refresh() {
        let longest_data = 0;
        let datasets = {};
        let datasets_used_last = this.datasets_used;
        this.datasets_used = {};

        let plots = this.plots.filter(p => p.active);
        let [plot_data, boundaries, title] = Plot.get_data(plots);
        this.plot_data = plot_data;
        let y_axes = new Set();

        /**
         *
         * @type {Territory|null} territory Null if sum-territories is on.
         */
        for (let [plot, territory, data, outbreak_start] of plot_data) {
            // choose only some days in range
            if (!data.length) {
                continue;
            }
            let chosen_data = [];
            let [name, label, starred, id] = plot.territory_info(territory);
            let color = adjust("#" + intToRGB(hashCode(name)), plot.hash);

            // XX we may save performance if we pass day-range to Plot.get_data.
            //  However, this might change the calculation of the outbreak start.
            if (setup["single-day"]) {
                chosen_data.push(data[setup["day-range"]]);
            } else {
                for (let i = setup["day-range"][0]; i < data.length && i < setup["day-range"][1]; i++) {
                    chosen_data.push(data[i]);
                }
            }

            longest_data = Math.max(longest_data, setup["day-range"][0] + chosen_data.length);
            //console.log("Longest", territory.name, longest_data, chosen_data.length, chosen_data);
            //console.log("Territory", territory.name, territory.is_starred);

            // hide the country from the figure if it has no data (ex: because of the date range settings)
            if (!chosen_data.length) {
                continue;
            }
            let border_color = plot.type === Plot.TYPE_STACKED_TERRITORY ? 'rgba(0,0,0,1)' : color; // colours of the same territory are hardly distinguishable
            // push new dataset
            let dataset = datasets[id] = {
                type: plot.type ? 'bar' : 'line',
//                borderColor: color,
//                borderColor: adjust(color, -100),
                label: label + (plots.length > 1 ? " (" + plot.expression + ")" : ""),
                data: chosen_data,
                fill: false,
                id: id,
                xAxisID: "normal", // Xfor unknown reason, this is not needed this.type === Figure.TYPE_LOG_DATASET || plot.type <= Plot.TYPE_BAR ? "normal" : "stacked",
                stack: plot.type > Plot.TYPE_BAR ? (plot.type === Plot.TYPE_STACKED_TERRITORY ? (territory ? territory.id : null) : "p" + plot.id) : id,
                yAxisID: parseInt(plot.y_axis),
                borderWidth: DATASET_BORDER[starred],
                borderColor: border_color,
                backgroundColor: color
            };
            this.datasets_used[id] = {// available through this.meta(i)
                plot: plot,
                territory: territory,
                star: false,
                outbreak_start: outbreak_start,
                type: plot.type,
                backgroundColor: color,
                borderColor: border_color,
                highlightColor: adjust(color, +40)
            };
            y_axes.add(parseInt(plot.y_axis));
//            console.log("Dataset color", id, label, color, adjust(color, 40), adjust(color, -40));
//            console.log("Dataset", label, chosen_data);
            //console.log("Push name", plot.get_name(), plot.id, territory);
        }
        let r = range(setup["day-range"][0], Math.min(longest_data, setup["day-range"][1]));
        let labels = this.type === Figure.TYPE_LOG_DATASET ? null : (setup["outbreak-on"] ? r.map(String) : r.map(day => Territory.header[parseInt(day)]));



        // destroy current chart if needed
        this.is_line = !setup["single-day"] && Object.values(datasets).some(d => d.type === "line");// ChartJS cannot dynamically change line type (dataset left align) to bar (centered). We have bar if single day (centered) and if there is no line plot.
        let percentage = this.type === Figure.TYPE_PERCENT_TIME; // Stacked percentage if at least one plot has it
        if (this.chart && (
                (this.chart.config.type === "line") !== this.is_line || // cannot change dynamically line to bar
                this.chart.config.options.plugins.stacked100.enable !== percentage // cannot turn on/off stacked100 plugin dynamically
                )) {
            this.chart = this.chart.destroy();
        }

        // update chart data
        if (!this.chart) {
            this.chart = this.init_chart(this.is_line ? "line" : "bar", percentage);
            this.chart.data = {datasets: Object.values(datasets), labels: labels};
        } else {
            // update just some datasets, do not replace them entirely (smooth movement)
            this.chart.data.labels = labels;
            let removable = [];
            // update changed
            for (let i in this.chart.data.datasets) { // for each current dataset
                let o = this.chart.data.datasets[i];
                if (o.id in datasets) { // check if there if current dataset still present
                    let d = datasets[o.id];
                    let last = datasets_used_last[o.id];
                    if (last && last.type > Plot.TYPE_LINE && last.type !== this.datasets_used[o.id].plot.type) { // if plot.type changed from the last type to a non-line, hard update
                        // (probably) due to a bug in ChartJS, if (ex.) bar changes to stacked smoothly, the change is not visible, it remains non-stacked,
                        // do a hard update of the dataset (not smooth movement)
                        this.chart.data.datasets[i] = d;
                    } else {
                        // even though we change all current dataset properties but without swapping the object itself,
                        // smooth change will not re-render plot-create animation
                        for (const [key, prop] of Object.entries(d)) {
                            o[key] = prop;
                        }
                    }
                    delete datasets[o.id];
                } else { // current dataset is no more listed
                    removable.push(o);
                }
            }
            // remove unused
            this.chart.data.datasets = this.chart.data.datasets.filter((el) => !removable.includes(el));
            // insert new
            Object.values(datasets).forEach(el => this.chart.data.datasets.push(el));
        }
        if (!plot_data.length) { // error when processing plot function formula
            this.chart.options.title.text = "Empty figure " + this.id;
        } else if (!this.chart.data.datasets.length) {
            this.chart.options.title.text = "No data";
        } else {
            this.chart.options.title.text = title.join(", ");
        }

        // Axis X label and type
        this.chart.options.scales.xAxes[0].scaleLabel.labelString = this.axe_x_title();
        this.chart.options.scales.xAxes[0].type = this.type === Figure.TYPE_LOG_DATASET ? "logarithmic" : "category";
        this.chart.options.tooltips.mode = this.is_line ? (this.type === Figure.TYPE_LOG_DATASET ? "x" : "index") : "x";

        // Axis Y
        this.chart.options.scales.yAxes.forEach(axe => {
            switch (this.type) {
                case Figure.TYPE_LOG_DATASET:
                case Figure.TYPE_LOG_TIME:
                    axe.type = "logarithmic";
                    break;
                case Figure.TYPE_LINEAR_TIME:
                case Figure.TYPE_PERCENT_TIME:
                default:
                    axe.type = "linear";
                    break;
            }
            axe.display = y_axes.has(axe.id);
        });

        // Show datasets
        Figure.current.chart.options.plugins.datalabels.display = !(this.type === Figure.TYPE_LOG_DATASET);

        // Submit changes
        this.chart.update();
        this.prepare_export();
        return boundaries;
    }

    prepare_export() {
        let ch = this.chart;
        let rows = [];

        // insert header
        if (!this.type === Figure.TYPE_LOG_DATASET) {
            rows.push(['"' + ch.options.scales.xAxes[0].scaleLabel.labelString + '"', ...ch.data.labels]);
        }
        // insert values

        ch.data.datasets.forEach(d => {
            rows.push([d.label, ...d.data.map(JSON.stringify)]); // XX when using Figure.TYPE_LOG_DATASET, {x: ..., y: ...} is printed in the cell. This is not nice, it should be in header. However they can export in JSON.
        });

        this.$element.data("prepared_export", [ch.options.title.text + ".csv", rows.join("\n")]);

        // html table
        let table = [];
        rows.forEach(r => {
            table.push("<tr><td>", r.join("</td><td>"), "</td></tr>");
        });
        $("#export-data").append(table.join(""));
    }

    export_json() {
        let ch = this.chart;
        let result = {"labels": ch.data.labels};
        ch.data.datasets.forEach(d => {
            result[d.label] = d.data;
        });
        return JSON.stringify(result);
    }

    axe_x_title() {
        let axe_title = setup["single-day"] ? "Day: " + (setup["outbreak-on"] ? setup["day-range"]: Territory.header[setup["day-range"]])  + " ": "";
        if (this.type === Figure.TYPE_LOG_DATASET) {
            axe_title += "Confirmed cases";
            if (setup["outbreak-on"]) {
                axe_title += setup["outbreak-mode"] ? ` since >= (${setup["outbreak-value"]} * population/100 000)` : ` since >= ${setup["outbreak-value"]}`;
            }
            ;
        } else {
            axe_title += setup["outbreak-on"] ? (setup["outbreak-mode"] ? `Days count since confirmed cases >= (${setup["outbreak-value"]} * population/100 000)` : `Days count since confirmed cases >= ${setup["outbreak-value"]}`) : "";
        }
        return axe_title;
    }
}


$(function () {
    Figure.figures = [];
    Figure.default_size = null;

    Figure.TYPE_LINEAR_TIME = 0;
    Figure.TYPE_LOG_TIME = 1;
    Figure.TYPE_PERCENT_TIME = 2;
    Figure.TYPE_LOG_DATASET = 3;

    /**
     *
     * @type Figure
     */
    Figure.current = null;
});

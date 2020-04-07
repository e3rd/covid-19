let DATASET_BORDER = {
    true: 6,
    false: 3
};
class Figure {
    constructor(type = Figure.TYPE_LOG_TIME, mouse_drag = null, tooltip_sorting = null, color_style = null, data_labels = null) {
        this.type = type;
        this.last_type = null;


        this.mouse_drag = mouse_drag || 0;
        this.tooltip_sorting = tooltip_sorting || 0;
        this.color_style = color_style || 0;
        this.data_labels = data_labels || 0;


        this.chart = null;
//        this.id = id * 1;

        Figure.figures.push(this);
        this.id = Figure.figures.length;
        this.equations = [];

        this.$element = $("<canvas />", {id: "figure-" + this.id}).appendTo($("#canvas-container")).data("figure", this);

        this.check_canvas_container();
        $("#canvas-container").sorting("> canvas");

        this.hovered_dataset;
        this.datasets_used;
        Figure.chart_size();

        this.is_line;  // if any "line" present = "line"
    }

    static serialize() {
//        Editor.setup["figure"] = Figure.current.id;
        return Object.values(Figure.figures).map(p => {
            return [p.type,
                p.mouse_drag,
                p.tooltip_sorting,
                p.color_style,
                p.data_labels
            ];
        });
    }

    static deserialize(data) {
        data.forEach((d) => new Figure(...d));
//        if (Figure.figures.length) {
//            Figure.figures[Editor.setup["figure"]-1 || 0].focus();
//        }
    }

    focus() {
        Figure.current = this;

        // migrate all attributes to DOM input values
        let f = (key, attribute = null) => {
            let ion = $("#" + key).data("ionRangeSlider");
            ion.update({from: this[attribute || key.replace(/-/g, "_")]});
            ion.options.onChange(); // on load time, make this write aloud the legend (ex: "log/time")
        };

        f("axes-type", "type");
        f("mouse-drag");
        f("tooltip-sorting");
        f("color-style");
        f("data-labels");
        return this;
    }

    dom_setup() {
        // migrate all DOM input values (stored in `Editor.setup`) concerning to the object to the attributes
        let f = (key, attribute = null) => {
            this[attribute || key.replace(/-/g, "_")] = Editor.setup[key]; // Editor.setup["mouse-drag"] => this.mouse_drag
            delete Editor.setup[key];
        };
        f("axes-type", "type");
        f("mouse-drag");
        f("tooltip-sorting");
        f("color-style");
        f("data-labels");

        // cascade effect -> show/hide adjacent DOM inputs
        let hide = [Figure.TYPE_LOG_DATASET, Figure.TYPE_PERCENT_TIME].indexOf(this.type) > -1;

        // only if we are not in Figure.TYPE_LOG_DATASET mode we can change from line to bar etc.
        // XX Disable this functionality too for Figure.TYPE_PERCENT_TIME. Here we should still have the possibility to change between STACKED_EQUATION|TERRITORY.
        $("#equation-type").closest(".range-container").toggle(!hide);
        this.equations.forEach(p => p.refresh_html()); // XX this is not so elegant; we want to refresh all equations (icon might have changed) but Equation.current has already been refreshed
    }

    check_canvas_container() {
        $("#canvas-container").toggleClass("multiple", Object.keys(Figure.figures).length > 1);
    }

    add_equation(equation) {
        this.equations.push(equation);
        return this;
    }
    remove_equation(equation) {
        this.equations = this.equations.filter(it => it !== equation);
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
        if(Editor.iframe) {
            return;
        }
        if (e) {
            this.default_size = e.from;
        }
        $("#canvas-container").css("width", this.default_size + "%");
        Object.values(Figure.figures).forEach(f => f.chart && f.chart.resize());
    }

    /**
     * Resets zoom for all figures.
     * @returns {undefined}
     */
    static reset_zoom() {
        for (let o of Object.values(Figure.figures)) {
            let chart = o.chart;
            chart.resetZoom();
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
            borderWidth: this.is_line ? 10 : 5, // XX should not is_line be equation-dependent instead of figure dependent here?
            borderColor: this.is_line ? m.highlightColor : "red",
            backgroundColor: m.highlightColor
        });
        this.chart.update();
        this.chart.update(); // ChartJS 2.9.3 bug: when changing bar chart, it gets reflected on the second `update` call
    }

    init_chart(type = "line", percentage = false) {
        let figure = this;
        Chart.plugins.unregister(ChartDataLabels); // XX line should be removed since ChartDataLabels 1.0
        this.hovered_dataset = null;
        return this.chart = new Chart(this.$element, {
            type: type, // changed to bar if there is no line equation
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
                            star = dst.equation.set_star(dst.territory);
                            label = dst.territory.get_name(true);
                        } else { // this is not territory but another curve (aggregated sum of territories)
                            star = !dst.star;
                            label = dst.equation.get_name(star);
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
                    itemSort: null, // set dynamically
                    callbacks: {
                        title: function (el) {
                            if (Editor.setup["outbreak-on"]) {
                                if (Editor.setup["outbreak-mode"]) {
                                    return "Population outbreak day " + el[0].label;
                                }
                                return "Confirmed case outbreak day " + el[0].label;
                            } else {
                                return el[0].label;
                            }
                        },
                        label: function (el, data) {
                            let label = data.datasets[el.datasetIndex].label || '';
                            let v = isNaN(el.value) ? "no data" : Math.round(el.value * 10000) / 10000;
                            if (el.datasetIndex === figure.hovered_dataset) {
                                label = "→ " + label;
                            }

                            if (this.type === Figure.TYPE_LOG_DATASET) { // Absolute numbers axe X
                                label += ` (${el.label}, ${v})`;
                            } else {
                                // Timeline axe X
                                if (label) {
                                    label += ': ';
                                }
                                label += v;
                                if (Editor.setup["outbreak-on"]) {
                                    let start = figure.meta(el.datasetIndex).outbreak_start;
                                    if (start) { // if aggregating, outbreak_start is not known
                                        let day = Territory.header[parseInt(start) + parseInt(el.label)];
                                        label += " (" + (day === undefined ? "for the given territory, this is a future date" : day.toYMD()) + ")";
                                    }
                                }
                            }
                            return label;
                        }
                    }
                },
                scales: {
                    xAxes: [{
//                            ticks: {
//                                min: 0,
//                                max: 10 ** 4
//                            },
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
//                                min: 0,
//                                max: 10 ** 4,
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
                            threshold: 1
                        },
                        // Container for zoom options
                        zoom: {
                            // Boolean to enable zooming
                            enabled: true,
                            // Enable drag-to-zoom behavior
                            drag: false,
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
                            onZoomComplete: function () {
                                $("#reset-zoom").show();
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
                            try {
                                return ({
                                    "default": figure.is_line ? null : item.dataset.label, // by default shown on figure with bars only (no line chart)
                                    "label": item.dataset.label,
                                    "values": figure.type === Figure.TYPE_LOG_DATASET ? value.x + " " + value.y : value
                                }[Figure.DATA_LABELS[figure.data_labels]]);
                            } catch (e) {// XX I forgot the case when an exception happens
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
                        if (this.id === 1 && Editor.REFRESH_THUMBNAIL === Editor.chart_id && Editor.show_menu) {
                            // chartjs animation finshed, we can alter the image.
                            // But only if Editor.chart_id would not change meanwhile (we did not move sliders)
                            Editor.REFRESH_THUMBNAIL = 0;
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

        let equations = this.equations.filter(p => p.active);
        let [equation_data, boundaries, title] = Equation.get_data(equations);
        this.equation_data = equation_data;
        let y_axes = new Set();
        let static_color_i = 0;

        /**
         *
         * @type {Territory|null} territory Null if sum-territories is on.
         */
        for (let [equation, territory, data, outbreak_start] of equation_data) {
            // choose only some days in range
            if (!data.length) {
                if (!equation.valid) {
                    return false;
                }
                continue;
            }
            let chosen_data = [];

            // XX we may save performance if we pass day-range to Equation.get_data.
            //  However, this might change the calculation of the outbreak start.
            if (Editor.setup["single-day"]) {
                chosen_data.push(data[Editor.setup["day-range"]]);
            } else {
                for (let i = Editor.setup["day-range"][0]; i < data.length && i < Editor.setup["day-range"][1]; i++) {
                    chosen_data.push(data[i]);
                }
            }
            // hide the country from the figure if it has no data (ex: because of the date range settings)
            if (!chosen_data.length) {
                continue;
            }
            longest_data = Math.max(longest_data, Editor.setup["day-range"][0] + chosen_data.length);

            // prepare dataset options
            let [name, label, starred, id] = equation.territory_info(territory);
            let color = {
                "territory + equation": adjust(intToRGB(hashCode(name)), equation.hash),
                "equation": equation.color(),
                "static": palette[static_color_i++]
            }[Figure.COLOR_STYLE[this.color_style]];
            let border_color = (equation.type === Equation.TYPE_STACKED_TERRITORY && Figure.COLOR_STYLE[this.color_style] === "territory + expression") ? 'rgba(0,0,0,1)' : color; // colours of the same territory are hardly distinguishable

            // push new dataset
            let dataset = datasets[id] = {
                type: equation.type ? 'bar' : 'line',
                label: label + (equations.length > 1 ? " (" + equation.expression + ")" : ""),
                data: chosen_data,
                fill: false,
                id: id,
                xAxisID: "normal", // Xfor unknown reason, this is not needed this.type === Figure.TYPE_LOG_DATASET || equation.type <= Equation.TYPE_BAR ? "normal" : "stacked",
                stack: equation.type > Equation.TYPE_BAR ? (equation.type === Equation.TYPE_STACKED_TERRITORY ? (territory ? territory.id : null) : "p" + equation.id) : id,
                yAxisID: parseInt(equation.y_axis),
                borderWidth: DATASET_BORDER[starred],
                borderColor: border_color,
                backgroundColor: color
            };
            this.datasets_used[id] = {// available through this.meta(i)
                equation: equation,
                territory: territory,
                star: false,
                outbreak_start: outbreak_start,
                type: equation.type,
                backgroundColor: color,
                borderColor: border_color,
                highlightColor: adjust(color, +40)
            };
            y_axes.add(parseInt(equation.y_axis));
            //            console.log("Dataset color", id, label, color, adjust(color, 40), adjust(color, -40));
//            console.log("Dataset", label, chosen_data.length, dataset.stack);
            //console.log("Push name", equation.get_name(), equation.id, territory);
        }

        // Transform data according to Percent axes
        if (this.type === Figure.TYPE_PERCENT_TIME) {
            // lengthen all the datasets to the same, max length, fill with NaN
            // stacked100.js plugin fails with dataset of different length
            let max = Math.max(...Object.values(datasets).map(d => d.data.length));
            Object.values(datasets).forEach(d => d.data.push(...Array(max - d.data.length).fill(NaN)));
        }

        // Axe X Labels
        let r = Editor.setup["single-day"] ? [Editor.setup["day-range"]] : range(Editor.setup["day-range"][0], Math.min(longest_data, Editor.setup["day-range"][1]));
        let labels = this.type === Figure.TYPE_LOG_DATASET ? null : (Editor.setup["outbreak-on"] ? r.map(String) : r.map(day => Territory.header[parseInt(day)].toDM()));


        // destroy current chart if needed
        this.is_line = !Editor.setup["single-day"] && Object.values(datasets).some(d => d.type === "line");// ChartJS cannot dynamically change line type (dataset left align) to bar (centered). We have bar if single day (centered) and if there is no line equation.
        let percentage = this.type === Figure.TYPE_PERCENT_TIME; // Stacked percentage if at least one equation has it
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
                    if (last && last.type > Equation.TYPE_LINE && last.type !== this.datasets_used[o.id].equation.type) { // if equation.type changed from the last type to a non-line, hard update
                        // (probably) due to a bug in ChartJS, if (ex.) bar changes to stacked smoothly, the change is not visible, it remains non-stacked,
                        // do a hard update of the dataset (not smooth movement)
                        this.chart.data.datasets[i] = d;
                    } else {
                        // even though we change all current dataset properties but without swapping the object itself,
                        // smooth change will not re-render equation-create animation
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


        let opt = this.chart.options;

        // Set figure title
        if (!equation_data.length) { // error when processing equation function formula
            opt.title.text = "Empty figure " + this.id;
        } else if (!this.chart.data.datasets.length) {
            opt.title.text = "No data";
        } else {
            opt.title.text = title.join(", ");
        }

        // Axis X label and type
        opt.scales.xAxes[0].scaleLabel.labelString = this.axe_x_title();
        opt.scales.xAxes[0].type = this.type === Figure.TYPE_LOG_DATASET ? "logarithmic" : "category";
        opt.tooltips.mode = this.is_line ? (this.type === Figure.TYPE_LOG_DATASET ? "x" : "index") : "x";

        // Axis Y
        opt.scales.yAxes.forEach(axe => {
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

        // Apply other figure settings

        // Set zoom plugin
        let z = this.chart.config.options.plugins.zoom;
        [z.zoom.enabled,
            z.zoom.drag,
            z.pan.enabled] = {
            "off": [false, false, false],
            "zoom": [true, true, false],
            "pan": [false, false, true],
            "pan + wheel zoom": [true, false, true]
        }[Figure.MOUSE_DRAG[this.mouse_drag]];
        //this.$element.toggleClass("grabbable", z.zoom.enabled || z.pan.enabled);

        // Tooltip sorting
        opt.tooltips.itemSort = {
            "by value": (a, b, data) => b.value - a.value,
            "by expression": (a, b, data) => { // sort by equation name, then by dataset name
                let [i, j] = [this.meta(b.datasetIndex).equation.expression, this.meta(a.datasetIndex).equation.expression];
                if (i === j) {
                    return data.datasets[b.datasetIndex].label > data.datasets[a.datasetIndex].label ? -1 : 1;
                }
                return i > j ? -1 : 1;
            },
            "by territory": (a, b, data) => data.datasets[b.datasetIndex].label > data.datasets[a.datasetIndex].label ? -1 : 1 // sort by dataset name
        }[Figure.TOOLTIP_SORTING[this.tooltip_sorting]];


        // Data labels are off by default when TYPE_LOG_DATASET used
        let v = Figure.DATA_LABELS[this.data_labels];
        opt.plugins.datalabels.display = v !== "off" && !(v === "default" && this.type === Figure.TYPE_LOG_DATASET);


        // Submit changes
        this.chart.update();
        this.prepare_export();
        return boundaries;
    }

    val2label() {

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
        let axe_title = Editor.setup["single-day"] ? "Day: " + (Editor.setup["outbreak-on"] ? Editor.setup["day-range"] : Territory.header[Editor.setup["day-range"]].toDM()) + " " : "";
        if (this.type === Figure.TYPE_LOG_DATASET) {
            axe_title += "Confirmed cases";
            if (Editor.setup["outbreak-on"]) {
                axe_title += Editor.setup["outbreak-mode"] ? ` since >= (${Editor.setup["outbreak-value"]} * population/100 000)` : ` since >= ${Editor.setup["outbreak-value"]}`;
            }
            ;
        } else {
            axe_title += Editor.setup["outbreak-on"] ? (Editor.setup["outbreak-mode"] ? `Days count since confirmed cases >= (${Editor.setup["outbreak-value"]} * population/100 000)` : `Days count since confirmed cases >= ${Editor.setup["outbreak-value"]}`) : "";
        }
        return axe_title;
    }
}


Figure.figures = [];
Figure.default_size = null;

Figure.TYPE_LINEAR_TIME = 0;
Figure.TYPE_LOG_TIME = 1;
Figure.TYPE_PERCENT_TIME = 2;
Figure.TYPE_LOG_DATASET = 3;

// constants
// Change everywhere before renaming a constant, however you can re-order freely. The first one becomes the default.
Figure.MOUSE_DRAG = ["off", "zoom", "pan", "pan + wheel zoom"];
Figure.TOOLTIP_SORTING = ["by value", "by expression", "by territory"];
Figure.COLOR_STYLE = ["territory + equation", "equation", "static"];
Figure.DATA_LABELS = ["default", "label", "values", "off"];


/**
 *
 * @type Figure
 */
Figure.current = null;
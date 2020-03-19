setup = setup || {};
let DATASET_BORDER = {
    true: 6,
    false: 3
};


class Figure {
    constructor(id) {
        this.chart = null;
        this.id = id;

        Figure.figures[id] = this;
        this.plots = [];


        this.$element = $("<canvas />", {id: "figure-" + id}).appendTo($("#canvas-container"));

        $("#canvas-container").sorting("> canvas");

        this.hovered_dataset;
        this.datasets_used;
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

    /**
     * Unhighlight dataset on mouse leave
     * @returns {undefined}
     */
    mouse_leave() {
        if (this.hovered_dataset !== null && this.chart) {
            this.chart.data.datasets[this.hovered_dataset].borderWidth = DATASET_BORDER[this.meta(this.hovered_dataset).star];
            this.hovered_dataset = null;
            this.chart.update();
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
    reset_border_width(dataset_id) {
        this.chart.data.datasets[dataset_id].borderWidth = DATASET_BORDER[this.meta(dataset_id).star];
    }

    hover(i) {
        // is already hovered
        if (i === this.hovered_dataset) {
            return;
        } else if (this.hovered_dataset !== null) {
            // unhover old dataset
            this.reset_border_width(this.hovered_dataset);
        }

        // hightlight new dataset
        this.hovered_dataset = i;
        this.chart.data.datasets[i].borderWidth = 10;
        this.chart.update();
    }

    init_chart() {
        let ctx = this;
        this.hovered_dataset = null;
        return this.chart = new Chart(this.$element, {
            type: 'line',
            data: {},
            options: {
                legend: {
                    onHover: function (_, item) {
                        ctx.hover(item.datasetIndex);
                    }
                },
                onClick: function (evt) {
                    // toggle star on any curve -> if the curve is territory, it is starred as well
                    // this function can receive data (all data on index)
                    let e = this.getElementAtEvent(evt);
                    if (e.length) {
                        let i = e[0]._datasetIndex;
                        let dst = ctx.meta(i);
                        let star, label;
                        if (dst.territory) {
                            star = dst.plot.set_star(dst.territory);
                            label = dst.territory.get_name(true);
                        } else { // this is not territory but another curve (aggregated sum of territories)
                            star = !dst.star;
                            label = dst.plot.get_name(star);
                        }
                        dst.star = star;
                        ctx.reset_border_width(i);
                        this.data.datasets[i].label = label;
                        this.update();
                    }
                },
                onHover: function (evt) {
                    // highlight hovered line
                    let e = this.getElementAtEvent(evt);
                    if (e.length) {
                        ctx.hover(e[0]._datasetIndex);
                    }
                },
                title: {
                    display: true,
                    text: "Empty"
                },
                tooltips: {
                    enabled: false, // XXX
                    mode: 'index',
//                    mode: 'nearest',
                    intersect: false,
                    itemSort: (a, b, data) => b.yLabel - a.yLabel // sort by value
//                    itemSort:  (a, b, data) => data.datasets[b.datasetIndex].label - data.datasets[a.datasetIndex].label
                    // sort by name
//                    callbacks: {
//                        label: function (tooltipItem, data) {
//                            console.log("HEEEEEEE",  tooltipItem, data);//data, tooltipItem,
//                            var label = data.datasets[tooltipItem.datasetIndex].label || '';
//
//                            if (label) {
//                                label += ': ';
//                            }
//                            label += Math.round(tooltipItem.yLabel * 10000) / 10000;
//                            return label;
//                        }
//                    },
//                    custom: function(a,b,c,d) {
//                        console.log("CUSTOM", a,b,c,d);
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
                                    return Math.round(value * 100) / 100;
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
                                console.log("PRCIC");
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
                                /*chart.config.options.plugins.zoom.pan.enabled = true;
                                 chart.config.options.plugins.zoom.zoom.enabled = false; XXX
                                 */
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

    refresh() {
        let longest_data = 0;
        let datasets = {};
        this.datasets_used = {};

        let plots = this.plots.filter(p => p.active);
        let [plot_data, boundaries, title] = Plot.get_data(plots);
        this.plot_data = plot_data;

        /**
         *
         * @type {Territory|null} territory Null if sum-territories is on.
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
            console.log("Longest", territory.name, longest_data, chosen_data.length, chosen_data);
            //console.log("Territory", territory.name, territory.is_starred);

            // hide the country from the figure if it has no data (ex: because of the date range settings)
            if (!chosen_data.length) {
                continue;
            }
            // push new dataset
            let dataset = {
                type: 'line',
                borderColor: color,
                label: label + (plots.length > 1 ? " (" + plot.expression + ")" : ""),
                data: chosen_data,
                borderWidth: DATASET_BORDER[starred],
                fill: false,
                backgroundColor: color,
                id: id
                        //,
                        //territory: territory
            };
            this.datasets_used[id] = {plot: plot, territory: territory, star: false};
            datasets[id] = dataset;
            //console.log("Push name", plot.get_name(), plot.id, territory);
        }
        let r = range(setup["day-range"][0], Math.min(longest_data, setup["day-range"][1]));
        //console.log(r, longest_data);
        let labels = setup["outbreak-on"] ? r.map(String) : r.map(day => Territory.header[parseInt(day)]);

        // update chart data
        if (!this.chart) {
            this.chart = this.init_chart();
            this.chart.data = {datasets: Object.values(datasets), labels: labels};
        } else {
            // update just some datasets, do not replace them entirely (smooth movement)
            this.chart.data.labels = labels;
            let removable = [];
            // update changed
            for (let o of this.chart.data.datasets) {
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
        this.chart.options.scales.xAxes[0].scaleLabel.labelString = `Days count since >= ${setup["outbreak-threshold"]} confirmed cases`;
        this.chart.options.scales.yAxes[0].type = setup["log-switch"] ? "logarithmic" : "linear";
        this.chart.update();
        return boundaries[1];
    }
}


$(function () {
    Figure.figures = {};
    Figure.get(1); // create the default figure
});

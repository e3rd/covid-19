setup = setup || {};
class Figure {
    constructor(id) {
        this.chart = null;
        this.id = id;
        Figure.figures[id] = this;
        this.plots = [];


        this.$element = $("<canvas />", {id: "figure-" + id}).appendTo($("#canvas-container"));
    }

    add_plot(plot){
        this.plots.push(plot);
        return this;
    }
    remove_plot(plot){
        this.plots = this.plots.filter(it => it !== plot);
        return this;
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
                    display: true,
                    text: "Empty"
                },
                tooltips: {
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

        let [plot_data, boundaries, title] = Plot.get_data(this.plots);

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
            console.log("Push name", plot.get_name(), plot.id, territory);
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

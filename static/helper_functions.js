
// helper functions

/**
 * thanks to https://stackoverflow.com/a/3426956/2036148
 */
function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

/**
 * thanks to https://stackoverflow.com/a/3426956/2036148
 */
function intToRGB(i) {
    var c = (i & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

    return "#" + "00000".substring(0, 6 - c.length) + c;
}

/**
 * Adjust color a litle bit. Thanks to: https://stackoverflow.com/a/57401891/2036148
 * @param {type} color
 * @param {type} amount
 * @returns {String}
 */
function adjust(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

/**
 * Python range function thanks to https://stackoverflow.com/a/8273091/2036148
 * @param {type} start
 * @param {type} stop
 * @param {type} step
 * @returns {Array}
 */
function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
}

/**
 * Splits the line thanks to https://stackoverflow.com/a/26156806/2036148
 * Better solution than other regexes.
 */
function splitCsv(str) {
    return str.split(',').reduce((accum, curr) => {
        if (accum.isConcatting) {
            accum.soFar[accum.soFar.length - 1] += ',' + curr
        } else {
            accum.soFar.push(curr)
        }
        if (curr.split('"').length % 2 == 0) {
            accum.isConcatting = !accum.isConcatting
        }
        return accum;
    }, {soFar: [], isConcatting: false}).soFar
}


/**
 * Sum array elements. If callback is given, we first map the elements to the given condition.
 * Ex: [1,2,3].sum() => 6
 *     [1,2,3].sum(x => x > 2) => 1
 * @returns {int}
 */
Object.defineProperty(Array.prototype, "sum", {
    value: function (fn = null) {
        let array = this;
        if (fn) {
            array = this.map(fn);
        }
        return array.reduce((a, b) => a + b, 0);
    }});

/**
 * Sum arrays while filling zeroes to the shorter.
 * @returns {Array}
 */
Object.defineProperty(Array.prototype, "sumTo", {
    value: function (el) {
        let total = [];
        for (var i = 0; i < this.length || i < el.length; i++) {
            let a = this[i];
            let b = el[i];
            total.push((isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b));
        }
        return total;
    }});


function number_format(s) {
    let n = String(s);
    let len = n;
    let postfix;
    if (len > 6) {
        n = n.slice(0, -6);
        postfix = " M";
    } else if (len > 3) {
        n = n.slice(0, -3);
        postfix = " k";
    }
    return n.replace(/(.)(?=(\d{3})+$)/g, '$1 ') + postfix;
}

// String formatting function usage "string {0}".format("1") => "string 1"
Object.defineProperty(String.prototype, "format", {
    value: function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    }
});


// sort children thanks to https://stackoverflow.com/a/17127455/2036148 (edited)
/**
 *
 * @param {type} selector Children to be sorted.
 * @param {type} attribute Their pivot attribute to be used while sorting.
 * @returns {undefined}
 */
jQuery.fn.sorting = function sorting(selector, attribute = "id") {
    $(selector, this[0]).sort(dec_sort).appendTo(this[0]);
    function dec_sort(a, b) {
        return ($(b).attr(attribute)) < ($(a).attr(attribute)) ? 1 : -1;
}
};

/**
 * Generate logarithmic steps, based on https://stackoverflow.com/a/846249/2036148
 * @param {type} position
 * @returns {Number}
 */
function logslider(minp = 0, maxp = 100, minv = 100, max_v = 10000000) {
//    // position will be between 0 and 100
//    var minp = 0;
//    var maxp = 100;
//
//    // The result should be between 100 an 10000000
    minv = Math.log(minv);
    let maxv = Math.log(max_v);
    let values = [];
    for (let position of range(minp, maxp + 1)) {


        // calculate adjustment factor
        let scale = (maxv - minv) / (maxp - minp);
        let v = Math.round(Math.exp(minv + scale * (position - minp)));
//        console.log("V(position=" , position,") => ", v, values[values.length - 1]);
        if (values.length && values[values.length - 1] >= v) {
            v = values[values.length - 1] + 1;
            //          console.log("Corrected to ", v);
        }
        if (v > max_v) {  // there is not enough space for so many steps, we have to shorten the step number
            if (values[values.length - 1] && values[values.length - 1] !== max_v) {
                // last step may be equal to the max
                values.push(Math.floor(max_v));
            }
            break;
        }
        values.push(v);
    }
    return values;
}


/**
 * Thanks to https://stackoverflow.com/a/2280117/2036148
 */
Object.defineProperty(Date.prototype, "toYMD", {
    value: function () {
        let year = String(this.getFullYear());
        let month = String(this.getMonth() + 1);
        if (month.length === 1) {
            month = "0" + month;
        }
        let day = String(this.getDate());
        if (day.length === 1) {
            day = "0" + day;
        }
        return year + "-" + month + "-" + day;
    }}
);

/**
 * I will never understand why vanilla JS is so poor in date format handling.
 */
Object.defineProperty(Date.prototype, "toDM", {
    value: function () {
        let month = String(this.getMonth() + 1);
        let day = String(this.getDate());
        return `${day}. ${month}.`;
    }}
);
Date.from_dmy = function (date) {
    let d = date.split(".").reverse();
    return new Date(d[0], d[1] - 1, d[2]);
};


/**
 * Thanks to https://stackoverflow.com/a/30393357/2036148
 *
 * @param {type} canvasElement
 * @param {type} fileName If null, contents is returned.
 * @returns {undefined}
 */
function exportCanvasAsPNG(canvasElement, fileName = null) {

    //var canvasElement = document.getElementById(id);

    var MIME_TYPE = "image/png";

    var imgURL = canvasElement.toDataURL(MIME_TYPE);
    if (fileName === null) {
        return imgURL;
    }

    var dlLink = document.createElement('a');
    dlLink.download = fileName;
    dlLink.href = imgURL;
    dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
}

/**
 * Thanks to https://stackoverflow.com/a/18197341/2036148
 * @param {type} filename
 * @param {type} text
 * @returns {undefined}
 */
function downloadFile(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * Thanks to: https://stackoverflow.com/a/22429679/2036148
 *
 * @param {string} str the input value
 * @param {boolean} [asString=false] set to true to return the hash value as
 *     8-digit hex string instead of an integer
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {integer | string}
 */
function hashFnv32a(str, asString, seed) {
    /*jshint bitwise:false */
    var i, l,
            hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
}


/**
 * Clone and scale current canvas.
 * @param {type} oldCanvas
 * @returns {Element}
 */
function make_thumbnail(oldCanvas) {
    $("#canvas-exporter").children().remove();
    var newCanvas = $("<canvas />").appendTo($("#canvas-exporter"))[0];
    var context = newCanvas.getContext('2d');
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    newCanvas.width = 400;
    let scale = newCanvas.width / oldCanvas.width;


    newCanvas.height = oldCanvas.height * scale;

    context.scale(scale, scale);
    context.drawImage(oldCanvas, 0, 0);
    return newCanvas;
}


/**
 * Average number generator.
 * @param {int} len Max queue length
 * @returns {Function}
 */
//function average_stream(len = 3) {
//        q = [];
//        return (v) => {
//            q.push(v);
//            if (q.length > len) { // XXX ignore zeros between non-zeros?
//                q.shift();
//            }
//            return q.sum() / q.length; // yield average value
//        };
//    }

/**
 * @param {Array} d Dataset.
 * @param {int} len Number of items the result is averaged from.
 * @returns {Function} When called, yields averaged value for the given position.
 */
function average_stream(d, len = 7) {
    return i => {
        return Math.round(d.slice(i - len + 1, i + 1).sum() / len);
    };
}

// distinct color palette
var palette = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac", "#b77322", "#16d620", "#b91383", "#f4359e", "#9c5935", "#a9c413", "#2a778d", "#668d1c", "#bea413", "#0c5922", "#743411"];

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

    return "00000".substring(0, 6 - c.length) + c;
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
 * Sum arrays while filling zeroes to the shorter.
 * @returns {Array}
 */
function sumArrays(ar1, ar2) {
    let total = [];
    for (var i = 0; i < ar1.length || i < ar2.length; i++) {
        let a = ar1[i];
        let b = ar2[i];
        total.push((isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b));
    }
    return total;
}


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
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined'
                    ? args[number]
                    : match
                    ;
        });
    };
}


// sort children thanks to https://stackoverflow.com/a/17127455/2036148 (edited)
jQuery.fn.sorting = function sorting(selector) {
            $(selector, this[0]).sort(dec_sort).appendTo(this[0]);
            function dec_sort(a, b) {
                return ($(b).attr("id")) < ($(a).attr("id")) ? 1 : -1;
            }
        };
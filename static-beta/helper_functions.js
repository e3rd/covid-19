
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

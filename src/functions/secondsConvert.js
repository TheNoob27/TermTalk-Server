function convNum(input) {
    var seconds = parseInt(input, 10)
    var days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    var hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600
    var min = Math.floor(seconds / 60);
    seconds -= min * 60
    if (days <= 0) {
        if (hours <= 0) {
            return min + 'm, ' + seconds + 's'
        } else {
            return hours + 'h, ' + min + 'm, ' + seconds + 's'
        }
    } else {
        return days + 'd, ' + hours + 'h, ' + min + 'm, ' + seconds + 's'
    }
}

module.exports = convNum;
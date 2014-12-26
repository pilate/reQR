
Array.prototype.arrayFiller = function(L) {
  while (L) this[--L] = [];
  return this;
};

Array.prototype.toHexArray = function() {
    var hex_array = [];
    for (var i=0; i < this.length; i++) {
        var val;
        if (typeof(this[i]) === "string") {
            val = parseInt(this[i], 2).toString(16);
        }
        else if (typeof(this[i]) === "number") {
            val = this[i].toString(16);
        }
        hex_array.push(val);
    }
    return hex_array;
};

Array.prototype.toIntArray = function() {
    var int_array = [];
    for (var i=0; i < this.length; i++) {
        var val = parseInt(this[i], 2);
        int_array.push(val);
    }
    return int_array;
};

Array.prototype.intsToString = function () {
    var str = "";
    for (var i=0; i < this.length; i++) {
        str += String.fromCharCode(this[i]);
    }
    return str;
};

String.prototype.toIntArray = function () {
    var ints = [];
    for (var i=0; i < this.length; i++) {
        ints.push(String.charCodeAt(this[i]));
    }
    return ints;
};

String.prototype.toBinArray = function () {
    var bits = [];
    for (var i=0; i < this.length; i++) {
        var char_code = String.charCodeAt(this[i]);
        var bin_code = char_code.toString(2).pad(8, "0");
        bits.push(bin_code);
    }
    return bits;
};

String.prototype.toHexArray = function () {
    var hexs = [];
    for (var i=0; i < this.length; i++) {
        var char_code = this.charCodeAt(i);
        hexs.push(char_code.toString(16));
    }
    return hexs;
};

String.prototype.pad = function (width, z) {
    var n = this.substr(0);
    z = z || '0';
    var newval = n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    return newval;
};

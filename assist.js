var WHITE = d3.rgb(255, 255, 255);
var BLACK = d3.rgb(0, 0, 0);

var ENCODINGS = {
    0: "end",
    1: "numeric",
    2: "alphanumeric",
    3: "structured append",
    4: "byte",
    5: "fnc1 in first",
    7: "extended channel",
    8: "kanji",
    9: "fnc1 in second"
}
ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
// Pattern of finder codes
var FINDER = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
];
FINDER_LEN = 9;
var ALIGNMENT = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
];
var IGNORE_LABELS = ["dark", "timing", "finder", "alignment", "format"];
var VERSIONS = {
    2: {
        "size": 25,
        "alignments": [6, 18],
        "timing_offset": 6,
        "encoding_len_bits": {
            1: 10,
            2: 9,
            4: 8,
            8: 8
        }
    },
    3: {
        "size": 29,
        "alignments": [6, 22],
        "timing_offset": 6,
        "encoding_len_bits": {
            1: 10,
            2: 9,
            4: 8,
            8: 8
        }
    }
}
var MASKS = {
    0: function (row, col) { if (((row + col) % 2) == 0) { return true; } },
    1: function (row, col) { if ((row  % 2) == 0) { return true; } },
    2: function (row, col) { if ((col  % 3) == 0) { return true; } },
    3: function (row, col) { if (((row + col) % 3) == 0) { return true; } },
    4: function (row, col) { if (((Math.floor(row/2) + Math.floor(col/3)) % 2) == 0) { return true; }  },
    5: function (row, col) { if (((row * col) % 2 + (row * col) % 3) == 0) { return true; } },
    6: function (row, col) { if ((((row * col) % 3 + row * col) % 2) == 0) { return true; } },
    7: function (row, col) { if ((((row * col) % 3 + row + col) % 2) == 0) { return true; } },
}
var TYPEBITS_MAP = {
    597: { "ecc_level": "H", "mask": 5 },
    1890: { "ecc_level": "H", "mask": 4 },
    2107: { "ecc_level": "H", "mask": 7 },
    3340: { "ecc_level": "H", "mask": 6 },
    5054: { "ecc_level": "H", "mask": 1 },
    5769: { "ecc_level": "H", "mask": 0 },
    6608: { "ecc_level": "H", "mask": 3 },
    7399: { "ecc_level": "H", "mask": 2 },
    8579: { "ecc_level": "Q", "mask": 5 },
    9396: { "ecc_level": "Q", "mask": 4 },
    11245: { "ecc_level": "Q", "mask": 7 },
    11994: { "ecc_level": "Q", "mask": 6 },
    12392: { "ecc_level": "Q", "mask": 1 },
    13663: { "ecc_level": "Q", "mask": 0 },
    14854: { "ecc_level": "Q", "mask": 3 },
    16177: { "ecc_level": "Q", "mask": 2 },
    16590: { "ecc_level": "M", "mask": 5 },
    17913: { "ecc_level": "M", "mask": 4 },
    19104: { "ecc_level": "M", "mask": 7 },
    20375: { "ecc_level": "M", "mask": 6 },
    20773: { "ecc_level": "M", "mask": 1 },
    21522: { "ecc_level": "M", "mask": 0 },
    23371: { "ecc_level": "M", "mask": 3 },
    24188: { "ecc_level": "M", "mask": 2 },
    25368: { "ecc_level": "L", "mask": 5 },
    26159: { "ecc_level": "L", "mask": 4 },
    26998: { "ecc_level": "L", "mask": 7 },
    27713: { "ecc_level": "L", "mask": 6 },
    29427: { "ecc_level": "L", "mask": 1 },
    30660: { "ecc_level": "L", "mask": 0 },
    30877: { "ecc_level": "L", "mask": 3 },
    32170: { "ecc_level": "L", "mask": 2 },
}

// QR Version 2    6   18
// QR Version 3    6   22
// QR Version 4    6   26
// QR Version 5    6   30

function QRAssist (svg, version) {
    this.svg = svg;
    this.version = VERSIONS[version];
    this.size = this.version.size;
    this.block_size = 20;
    this.spacing = 1;
    this.block_spacing = this.block_size + this.spacing;
    this.setup();
}

QRAssist.prototype.setup = function () {
    this.svg
        .style("fill", "white")
        .style("stroke", "grey");

    this.format_nodes = new Array(15);
    for (var i=0; i < this.format_nodes.length; i++) {
        this.format_nodes[i] = [];
    }
    this.offset_map = new Array(this.size);
    for (var i=0; i < this.offset_map.length; i++) {
        this.offset_map[i] = [];
    }
    this.data = this.getData();
    this.addRects();
    this.drawFinders();
    this.drawTiming();
    this.drawDark();
    this.drawAlignments();
    this.drawFormatInfo();
};

QRAssist.prototype.getData = function () {
    var cell_data = [];
    for (var i=0; i < this.size; i++) {
        for (var j=0; j < this.size; j++) {
            cell_data.push({
                "row": i,
                "col": j,
                "val": 0
            });
        }
    }
    return cell_data;
};

QRAssist.prototype.addRects = function() {
    var that = this;
    this.svg
        .selectAll("rect")
        .data(this.data).enter()
        .append("rect")
        .attr("x", function(d) { return d.col * that.block_spacing + 1; })
        .attr("y", function(d) { return d.row * that.block_spacing + 1; })
        .attr("width", this.block_size)
        .attr("height", this.block_size)
        .on("click", function (d) {
            if (IGNORE_LABELS.indexOf(d.label) !== -1) {
                return;
            }
            that.mark(this, d, BLACK);
        })
        .on("contextmenu", function (d) {
            if (IGNORE_LABELS.indexOf(d.label) !== -1) {
                d3.event.preventDefault();
                return;
            }
            that.mark(this, d, WHITE);
            d3.event.preventDefault();
        })
        .each(function (d) {
            that.offset_map[d.row][d.col] = this;
        })
};

QRAssist.prototype.mark = function (node, d, color, label) {
    var dnode = d3.select(node);
    dnode.style("fill", color);
    d.val = color == WHITE ? 0 : 1;
    // Add label if possible
    if (label && (!d.label)) {
        dnode.attr("class", label);
        d.label = label;
    }
};

QRAssist.prototype.drawPixels = function (pattern, offset, label) {
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        // Subtract offset from current rect
        var new_row = d.row - offset[0];
        var new_col = d.col - offset[1];
        // Check if our current offset exists in the pattern
        var val;
        try {
            val = pattern[new_row][new_col];
        }
        // If not, leave it alone
        catch (e) {
            return;
        }
        if (val === undefined) {
            return;
        }
        var fill_color = val ? BLACK : WHITE;
        that.mark(this, d, fill_color, label);
    });
};

QRAssist.prototype.drawFinders = function () {
    // Top left, top right, bottom left
    this.drawPixels(FINDER, [-1, -1], "finder");
    this.drawPixels(FINDER, [-1, this.size - FINDER_LEN + 1], "finder");
    this.drawPixels(FINDER, [this.size - FINDER_LEN + 1, -1], "finder");
};

QRAssist.prototype.drawTiming = function () {
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        var test1 = (d.row == that.version.timing_offset) && (d.col > that.version.timing_offset) && (d.col < (that.size - that.version.timing_offset));
        var test2 = (d.col == that.version.timing_offset) && (d.row > that.version.timing_offset) && (d.row < (that.size - that.version.timing_offset));
        if (test1 || test2) {
            if ((d.col + d.row) % 2) {
                that.mark(this, d, WHITE, "timing");
            }
            else {
                that.mark(this, d, BLACK, "timing");
            }
        }
    });
};

QRAssist.prototype.drawDark = function () {
    // Every QR code must have a dark pixel, also known as a dark module, at the coordinates (8, 4*version + 9).
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        if ((d.row == (that.size - 8)) && (d.col == 8)) {
            that.mark(this, d, BLACK, "dark");
        }
    });
};

QRAssist.prototype.drawAlignments = function () {
    var that = this;
    var offsets = [];
    for (var i=0; i < this.version.alignments.length; i++) {
        for (var j=0; j < this.version.alignments.length; j++) {
            offsets.push(this.version.alignments[i] + "," + this.version.alignments[j]);
        }
    }
    this.svg.selectAll("rect").each(function (d) {
        if (offsets.indexOf(d.row + "," + d.col) !== -1) {
            if (d.label) {
                return;
            }
            that.drawPixels(ALIGNMENT, [d.row - 2, d.col - 2], "alignment");
        }
    });
};

QRAssist.prototype.applyMask = function (mask) {
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        if (mask(d.row, d.col)) {
            if (IGNORE_LABELS.indexOf(d.label) !== -1) {
                return;
            }
            var new_color = d.val ? WHITE : BLACK;
            that.mark(this, d, new_color);
        }
    });
};

QRAssist.prototype.drawFormatInfo = function () {
    var that = this;
    var h_skip_1 = 0;
    var h_skip_2 = 0;
    this.svg.selectAll("rect").each(function (d) {
        if ((d.row == 8) && (d.col == 0)) { d.format_cell = 14; }
        if ((d.row == 8) && (d.col == 1)) { d.format_cell = 13; }
        if ((d.row == 8) && (d.col == 2)) { d.format_cell = 12; }
        if ((d.row == 8) && (d.col == 3)) { d.format_cell = 11; }
        if ((d.row == 8) && (d.col == 4)) { d.format_cell = 10; }
        if ((d.row == 8) && (d.col == 5)) { d.format_cell = 9; }
        if ((d.row == 8) && (d.col == 7)) { d.format_cell = 8; }
        if ((d.row == 8) && (d.col == 8)) { d.format_cell = 7; }
        if ((d.col == 8) && (d.row == 7)) { d.format_cell = 6; }
        if ((d.col == 8) && (d.row == 5)) { d.format_cell = 5; }
        if ((d.col == 8) && (d.row == 4)) { d.format_cell = 4; }
        if ((d.col == 8) && (d.row == 3)) { d.format_cell = 3; }
        if ((d.col == 8) && (d.row == 2)) { d.format_cell = 2; }
        if ((d.col == 8) && (d.row == 1)) { d.format_cell = 1; }
        if ((d.col == 8) && (d.row == 0)) { d.format_cell = 0; }
        
        if ((d.col == 8) && (d.row == that.size - 1)) { d.format_cell = 14; }
        if ((d.col == 8) && (d.row == that.size - 2)) { d.format_cell = 13; }
        if ((d.col == 8) && (d.row == that.size - 3)) { d.format_cell = 12; }
        if ((d.col == 8) && (d.row == that.size - 4)) { d.format_cell = 11; }
        if ((d.col == 8) && (d.row == that.size - 5)) { d.format_cell = 10; }
        if ((d.col == 8) && (d.row == that.size - 6)) { d.format_cell = 9; }
        if ((d.col == 8) && (d.row == that.size - 7)) { d.format_cell = 8; }

        if ((d.row == 8) && (d.col == that.size - 8)) { d.format_cell = 7; }
        if ((d.row == 8) && (d.col == that.size - 7)) { d.format_cell = 6; }
        if ((d.row == 8) && (d.col == that.size - 6)) { d.format_cell = 5; }
        if ((d.row == 8) && (d.col == that.size - 5)) { d.format_cell = 4; }
        if ((d.row == 8) && (d.col == that.size - 4)) { d.format_cell = 3; }
        if ((d.row == 8) && (d.col == that.size - 3)) { d.format_cell = 2; }
        if ((d.row == 8) && (d.col == that.size - 2)) { d.format_cell = 1; }
        if ((d.row == 8) && (d.col == that.size - 1)) { d.format_cell = 0; }

        if (d.format_cell !== undefined) {
            that.format_nodes[d.format_cell].push(this);
            that.mark(this, d, WHITE, "format");
        }
    });
};

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function QRAssistController (QRA, start_row, start_col) {
    this.qr = QRA;
    this.read_row = start_row || QRA.size - 1;
    this.read_col = start_col || QRA.size - 1;
    this.read_prev_col = false;
    this.read_direction = "up";

    this.write_row = start_row || QRA.size - 1;
    this.write_col = start_col || QRA.size - 1;
    this.write_prev_col = false;
    this.write_direction = "up";
}

QRAssistController.prototype.readBits = function (count, color) {
    var that = this;
    var val;
    var bits = [];

    var color = "#" + pad(Math.floor(Math.random() * 16777214).toString(16), 6);
    console.log(color);
    while (true) {
        var node;
        // Every other row, check col-1 for the value
        if (this.read_col < 0) {
            return bits.join("");
        }

        if (this.read_prev_col) {
            node = this.qr.offset_map[this.read_row][this.read_col - 1];

            // If we're reading col-1, change row after saving node
            if (this.read_direction == "up") {
                if (this.read_row == 0) {
                    this.read_direction = "down";
                    this.read_col -= 2;
                    if (this.read_col == 6) {
                        this.read_col -= 1;
                    }
                }
                else {
                    this.read_row -= 1;
                }
            }
            else if (this.read_direction == "down") {
                if (this.read_row == (this.qr.size - 1)) {
                    this.read_direction = "up";
                    this.read_col -= 2
                }
                else {
                    this.read_row += 1;
                }
            }
        }
        else {
            node = this.qr.offset_map[this.read_row][this.read_col];
        }

        this.read_prev_col = this.read_prev_col ? false : true;

        d3.select(node).each(function (d) {
            if (IGNORE_LABELS.indexOf(d.label) === -1) {
                that.qr.mark(this, d, color)
                var node_val = d.val;
                bits.push(node_val);
            }
        });

        if (bits.length === count) {
            return bits.join("");
        }
    }
}

QRAssistController.prototype.writeBits = function (bit_string) {
    var val;
    var bits = bit_string.split("");

    while (true) {
        var that = this;
        var node;
        // Every other row, check col-1 for the value
        if (this.write_col < 0) {
            return bits.join("");
        }

        if (this.write_prev_col) {
            node = this.qr.offset_map[this.write_row][this.write_col - 1];

            // If we're reading col-1, change row after saving node
            if (this.write_direction == "up") {
                if (this.write_row == 0) {
                    this.write_direction = "down";
                    this.write_col -= 2;
                    if (this.write_col == 6) {
                        this.write_col -= 1;
                    }
                }
                else {
                    this.write_row -= 1;
                }
            }
            else if (this.write_direction == "down") {
                if (this.write_row == (this.qr.size - 1)) {
                    this.write_direction = "up";
                    this.write_col -= 2
                }
                else {
                    this.write_row += 1;
                }
            }
        }
        else {
            node = this.qr.offset_map[this.write_row][this.write_col];
        }

        this.write_prev_col = this.write_prev_col ? false : true;

        d3.select(node).each(function (d) {
            if (IGNORE_LABELS.indexOf(d.label) === -1) {
                var bit = bits.shift();
                if (bit === '0') {
                    that.qr.mark(node, d, WHITE);
                }
                else {
                    that.qr.mark(node, d, BLACK);
                }
            }
        });
        if (!bits.length) {
            break;
        }
    }
}

function init () {
    var svg = d3.select("svg");
    qr = new QRAssist(svg, 3);
    document.getElementById("mask000").addEventListener("click", function () {
        qr.applyMask(MASKS[0]);
    });
    document.getElementById("mask001").addEventListener("click", function () {
        qr.applyMask(MASKS[1]);
    });
    document.getElementById("mask010").addEventListener("click", function () {
        qr.applyMask(MASKS[2]);
    });
    document.getElementById("mask011").addEventListener("click", function () {
        qr.applyMask(MASKS[3]);
    });
    document.getElementById("mask100").addEventListener("click", function () {
        qr.applyMask(MASKS[4]);
    });
    document.getElementById("mask101").addEventListener("click", function () {
        qr.applyMask(MASKS[5]);
    });
    document.getElementById("mask110").addEventListener("click", function () {
        qr.applyMask(MASKS[6]);
    });
    document.getElementById("mask111").addEventListener("click", function () {
        qr.applyMask(MASKS[7]);
    });

    
    setTimeout(function () {
        r = new QRAssistController(qr);   
        var blocks = [];
        while (true) {
            var block = r.readBits(8);
            if (block === "") {
                break;
            }
            blocks.push(block);
        }
        var ordered_blocks = [];
        for (var i=0; i < blocks.length; i+= 2) {
            ordered_blocks.push(blocks[i]);
        }
        for (var i=1; i < blocks.length; i+= 2) {
            ordered_blocks.push(blocks[i]);
        }
        var ordered_bits = ordered_blocks.join("");
        console.log(ordered_bits);
        var joined_blocks = blocks.join("");
        try {
        var match = /^([01]+?)0+$/.exec(joined_blocks)[1];
        }
        catch (e) {
            match = joined_blocks;
        }
        console.log(btoa(match));
        var offset = 0;
        var data = [];
        var iterations = 0;
        while (true) {
            iterations++;
            if (iterations > 10) {
                break;
            }
            var encoding = parseInt(ordered_bits.substr(offset, 4), 2);
            offset += 4;

            var length_bits = qr.version.encoding_len_bits[encoding];
            var length = parseInt(ordered_bits.substr(offset, length_bits), 2);
            offset += length_bits;

            if (encoding == 0) {
                break;
            }
            if (encoding == 2) {
                var str = []
                for (var i=0; i < length / 2; i++) {
                    var bits = parseInt(ordered_bits.substr(offset, 11), 2);
                    offset += 11;
                    str.push(ALPHA[Math.floor(bits / 45)]);
                    str.push(ALPHA[Math.floor(bits % 45)]);
                }
                data.push(str);
            }
            if (encoding == 4) {
                var str = []
                for (var i=0; i < length; i++) {
                    var bits = parseInt(ordered_bits.substr(offset, 8), 2);
                    offset += 8;
                    str.push(String.fromCharCode(bits))
                }
                data.push(str);
            }
            document.getElementById("qrenc").innerHTML = ENCODINGS[encoding];
            document.getElementById("qrlen").innerHTML = length;
            document.getElementById("qrbytes").innerHTML = data.join("");

            if (data.length > 1) {
                break
            }
            // break;
        }
    }, 5000);
    if (document.location.hash) {
        r = new QRAssistController(qr);   
        var hash = document.location.hash.substr(1);
        var data = atob(hash);
        r.writeBits(data);
    }
    document.getElementById("testread").addEventListener("click", function () {

    });
}


// 10011001100
// 00110011001
// 10011110011


// 10011111010 SE
// 01000101000 CC
// 10001001111 ON
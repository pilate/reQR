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
};
var ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

// Finder code square
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
var FINDER_LEN = 9;

// Alignment square
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
        },
        "ec_table": {
            "L": { "ec_per_block": 15, "groups": 1, "group_blocks": 1, "codewords_in_group": 55 },
            "M": { "ec_per_block": 26, "groups": 1, "group_blocks": 1, "codewords_in_group": 44 },
            "Q": { "ec_per_block": 18, "groups": 1, "group_blocks": 2, "codewords_in_group": 17 },
            "H": { "ec_per_block": 22, "groups": 1, "group_blocks": 2, "codewords_in_group": 13 },
        }
    }
};

var MASKS = [
    function (row, col) { if (((row + col) % 2) === 0) { return true; } },
    function (row, col) { if ((row  % 2) === 0) { return true; } },
    function (row, col) { if ((col  % 3) === 0) { return true; } },
    function (row, col) { if (((row + col) % 3) === 0) { return true; } },
    function (row, col) { if (((Math.floor(row/2) + Math.floor(col/3)) % 2) === 0) { return true; }  },
    function (row, col) { if (((row * col) % 2 + (row * col) % 3) === 0) { return true; } },
    function (row, col) { if ((((row * col) % 3 + row * col) % 2) === 0) { return true; } },
    function (row, col) { if ((((row * col) % 3 + row + col) % 2) === 0) { return true; } },
];

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
};

function QRAssist (svg, version, ec) {
    this.svg = svg;
    this.version = VERSIONS[version];
    this.version_num = version;
    this.ec = ec;
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
    // Create array for row->col->node lookups
    this.offset_map = new Array(this.size);
    for (var j=0; j < this.offset_map.length; j++) {
        this.offset_map[j] = [];
    }
    this.data = this.getData();
    this.addRects();
    this.drawFinders();
    this.drawTiming();
    this.drawDark();
    this.drawAlignments();
    this.drawFormatInfo();
};

// Creates the base data for d3, makes size*size elements with defined coordinates
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

// Sets up the clean grid of squares
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
        // Left click to turn node on
        .on("click", function (d) {
            if (IGNORE_LABELS.indexOf(d.label) !== -1) {
                return;
            }
            that.mark(this, BLACK);
        })
        // Right click to turn node off
        .on("contextmenu", function (d) {
            if (IGNORE_LABELS.indexOf(d.label) !== -1) {
                d3.event.preventDefault();
                return;
            }
            that.mark(this, WHITE);
            d3.event.preventDefault();
        })
        // Populate row->col->node mapping
        .each(function (d) {
            that.offset_map[d.row][d.col] = this;
        });
};

// Changes the status/color of a node, adds a label if provided
QRAssist.prototype.mark = function (node, color, label) {
    var d3_node = d3.select(node);
    var data = d3_node.data()[0];
    d3_node.style("fill", color);
    data.val = color == WHITE ? 0 : 1;

    if (label && (!data.label)) {
        d3_node.attr("class", label);
        data.label = label;
    }
};

// Takes a pattern of bits and draws them at the provided offset
QRAssist.prototype.drawPixels = function (pattern, offset, label) {
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        // Subtract offset from current node
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
        that.mark(this, fill_color, label);
    });
};

// Draws the finder patterns in three corners
QRAssist.prototype.drawFinders = function () {
    this.drawPixels(FINDER, [-1, -1], "finder");
    this.drawPixels(FINDER, [-1, this.size - FINDER_LEN + 1], "finder");
    this.drawPixels(FINDER, [this.size - FINDER_LEN + 1, -1], "finder");
};

// Draw the horizontal and vertical timing markers
// These are placed between the inner corners of finder patterns, with every other node being set
QRAssist.prototype.drawTiming = function () {
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        var timing_offset = that.version.timing_offset;
        var test1 = (d.row == timing_offset) && (d.col > timing_offset) && (d.col < (that.size - timing_offset));
        var test2 = (d.col == timing_offset) && (d.row > timing_offset) && (d.row < (that.size - timing_offset));
        if (test1 || test2) {
            if ((d.col + d.row) % 2) {
                that.mark(this, WHITE, "timing");
            }
            else {
                that.mark(this, BLACK, "timing");
            }
        }
    });
};

// "Every QR code must have a dark pixel, also known as a dark module, at the coordinates (8, 4*version + 9)."
QRAssist.prototype.drawDark = function () {
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        if ((d.col == 8) && (d.row == (4 * that.version_num + 9))) {
            that.mark(this, BLACK, "dark");
        }
    });
};

// Draws the smaller alignment patterns
// The QR spec defines a list of offsets for each QR version, such as [10,20]
// Draw an alignment pattern at any offset where the the row and column numbers are both found in the list
// For [10,20] this would be (10, 10), (10, 20), (20, 10), (20, 20)
// Don't draw a pattern if the node is already labeled
QRAssist.prototype.drawAlignments = function () {
    var that = this;
    var alignments = this.version.alignments;
    this.svg.selectAll("rect").each(function (d) {
        if ((alignments.indexOf(d.row) !== -1) && (alignments.indexOf(d.col) !== -1)) {
            if (d.label) {
                return;
            }
            that.drawPixels(ALIGNMENT, [d.row - 2, d.col - 2], "alignment");
        }
    });
};

// Applies a mask function to the mutable nodes
// Every row/col coordinate will be passed to the function argument, invert any node with a truthy response
QRAssist.prototype.applyMask = function (mask) {
    var that = this;
    this.svg.selectAll("rect").each(function (d) {
        if (mask(d.row, d.col)) {
            if (IGNORE_LABELS.indexOf(d.label) !== -1) {
                return;
            }
            var new_color = d.val ? WHITE : BLACK;
            that.mark(this, new_color);
        }
    });
};

// Picks out the format information nodes, doesn't account for version blocks for qr versions higher than 7
QRAssist.prototype.drawFormatInfo = function () {
    var that = this;
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
            that.mark(this, WHITE, "format");
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

// Function to read QR code bits out in the proper order
// The idea is to go up and down, right to left, reading two wide strips of nodes 
// To do this, it iterates backwards over every other column. Each column gets two passes, one to 
//   read the node from the current column, and one to read the node from the column to the left of it
QRAssistController.prototype.readBits = function (count) {
    // var that = this;
    var bits = [];

    // var color = "#" + pad(Math.floor(Math.random() * 16777214).toString(16), 6);
    while (true) {
        var node;
        
        // If we're outside the code, stop trying to read
        if (this.read_col < 0) {
            return bits.join("");
        }

        // Every other row, read col-1
        if (this.read_prev_col) {
            node = this.qr.offset_map[this.read_row][this.read_col - 1];

            if (this.read_direction == "up") {
                if (this.read_row == 0) {
                    this.read_direction = "down";
                    this.read_col -= 2;

                    // Skip the column used for timing, reset an extra node over.
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
                    this.read_col -= 2;
                }
                else {
                    this.read_row += 1;
                }
            }
        }
        else {
            node = this.qr.offset_map[this.read_row][this.read_col];
        }
        
        // Go back to the other column
        this.read_prev_col = this.read_prev_col ? false : true;

        d3.select(node).each(function (d) {
            // Any node that doesnt have a label in IGNORE_LABELS is considered a data node
            if (IGNORE_LABELS.indexOf(d.label) === -1) {
                // that.qr.mark(this, d, color)
                var node_val = d.val;
                bits.push(node_val);
            }
        });

        if (bits.length === count) {
            return bits.join("");
        }
    }
};

// Write bits following the exact same rules as reading
QRAssistController.prototype.writeBits = function (bit_string) {
    var that = this;
    var bits = bit_string.split("");

    while (true) {
        var node;

        // Every other row, check col-1 for the value
        if (this.write_col < 0) {
            return;
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
                    this.write_col -= 2;
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
                    that.qr.mark(node, WHITE);
                }
                else {
                    that.qr.mark(node, BLACK);
                }
            }
        });
        if (!bits.length) {
            break;
        }
    }
};

/*
 ---------- ---------- ----------
|          |          |  Code 1  |
|          |          |  Code 2  |
|          | Block 1  |  Code 3  |
|          |          |  Code 4  |
|          |          |  Code 5  |
| Group 1  |----------|----------|
|          |          |  Code 6  |
|          |          |  Code 7  |
|          | Block 2  |  Code 8  |
|          |          |  Code 9  |
|          |          |  Code 10 |
 ---------- ---------- ----------
|          |          |  Code 11 |
|          |          |  Code 12 |
|          | Block 1  |  Code 13 |
|          |          |  Code 14 |
|          |          |  Code 15 |
| Group 2  |----------|----------|
|          |          |  Code 16 |
|          |          |  Code 17 |
|          | Block 2  |  Code 18 |
|          |          |  Code 19 |
|          |          |  Code 20 |
 ---------- ---------- ----------

 The blocks are interleaved by doing the following:

    take the first data codeword from the first block
    followed by the first data codeword from the second block
    followed by the first data codeword from the third block
    followed by the first data codeword from the fourth block
    followed by the second data codeword from the first block
    and so on

    So:
        Determine number of data blocks, d
        Determine number of blocks, n
        Create array of n arrays, a
        Iterate over d blocks, sending them to a[i%n]

*/

// "H": { "ec_per_block": 22, "groups": 1, "group_blocks": 2, "codewords_in_group": 13 },
function reorder_codewords(qr, codewords) {
    var ec_data = qr.version.ec_table[qr.ec];
    
    // Create an array for un-interpolating
    var blocked_codewords = [];
    for (var i=0; i < ec_data.groups * ec_data.group_blocks; i++) {
        blocked_codewords[i] = [];
    }

    var data_codes = ec_data.groups * ec_data.group_blocks * ec_data.codewords_in_group;
    for (var j=0; j < data_codes; j++) {
        blocked_codewords[j % blocked_codewords.length].push(codewords[j]);
    }

    return blocked_codewords.map(function (val) {
        return val.join("");
    });
}

function init () {
    var svg = d3.select("svg");
    qr = new QRAssist(svg, 3, "H");

    for (var i=0; i < MASKS.length; i++) {
        var mask_el = document.createElement("button");
        var label = "mask"+i;
        mask_el.style.float = "left";
        mask_el.setAttribute("id", label);
        mask_el.addEventListener("click",
            (function (mask) {
                return function () {
                    qr.applyMask(MASKS[mask]);
                };
            })(i)
        );
        mask_el.innerHTML = label;
        document.body.appendChild(mask_el);
    }

    setInterval(function () {
        r = new QRAssistController(qr);
        var blocks = [];
        while (true) {
            var block = r.readBits(8);
            if (block === "") {
                break;
            }
            blocks.push(block);
        }
        var ordered_codes = reorder_codewords(qr, blocks);
        var ordered_bits = ordered_codes.join("");
        var joined_blocks = blocks.join("");
        try {
        var match = /^([01]+?)0+$/.exec(joined_blocks)[1];
        }
        catch (e) {
            match = joined_blocks;
        }
        // console.log(btoa(match));
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
                var str = [];
                for (var k=0; k < length / 2; k++) {
                    var bits = parseInt(ordered_bits.substr(offset, 11), 2);
                    offset += 11;
                    str.push(ALPHA[Math.floor(bits / 45)]);
                    str.push(ALPHA[Math.floor(bits % 45)]);
                }
                data.push(str);
            }
            if (encoding == 4) {
                var str = [];
                for (var l=0; l < length; l++) {
                    var bits = parseInt(ordered_bits.substr(offset, 8), 2);
                    offset += 8;
                    var ccc = String.fromCharCode(bits);
                    str.push(ccc);
                }
                data.push(str);
            }
            document.getElementById("qrbytes").innerHTML = data.map(function (val) {
                return val.join("");
            }).join("");

            if (data.length > 1) {
                break;
            }
        }
    }, 100);
    if (document.location.hash) {
        r = new QRAssistController(qr);
        var hash = document.location.hash.substr(1);
        var data = atob(hash);
        r.writeBits(data);
    }
}
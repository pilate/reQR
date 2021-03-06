var max_width = 650;

window.QR = {};

QR.QRCode = function (svg, version, ec, changed) {
    this.svg = svg;
    this.version_num = version;
    this.version = VERSIONS[version];
    this.ec = ec;
    this.size = this.version.size;

    this.setup();

    this.onchange = changed;
}

QR.QRCode.prototype.setup = function () {
    this.svg
        .style({
            "fill": "white",
            "stroke": "grey"
        });

    this.format_nodes = [].arrayFiller(15);

    // Create array for row->col->node lookups
    this.offset_map = new [].arrayFiller(this.size);

    this.block_size = Math.floor(max_width / this.size);

    this.addRects();
    this.drawFinders();
    this.drawAlignments();
    this.drawTiming();
    this.drawDark();
    this.drawFormatInfo();
};

// Creates the base data for d3, makes (size * size) elements with defined coordinates
QR.QRCode.prototype.getData = function () {
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
QR.QRCode.prototype.addRects = function() {
    var that = this;
    this.svg
        .selectAll("rect")
        .data(this.getData()).enter()
        .append("rect")
        .attr({
            "x": function(d) { return d.col * that.block_size + 1; },
            "y": function(d) { return d.row * that.block_size + 1; },
            "width": this.block_size,
            "height": this.block_size,
        })
        // Left click to turn node on
        .on("click", function (d) {
            if (IGNORE_LABELS.indexOf(d.label) !== -1) {
                return;
            }
            var color = d.val ? WHITE : BLACK;
            that.mark(this, color);
            if (that.onchange) {
                that.onchange();
            }
        })
        // Populate row->col->node mapping
        .each(function (d) {
            that.offset_map[d.col][d.row] = this;
        });
};

// Changes the status/color of a node, adds a label if provided
QR.QRCode.prototype.mark = function (node, color, label) {
    var d3_node = d3.select(node);
    var data = QR.util.getNodeData(node);
    d3_node.style("fill", color);
    data.val = Number(color != WHITE);

    if (label) {
        d3_node.attr("class", label);
        data.label = label;
    }
};

// Takes a pattern of bits and draws them at the provided offset
QR.QRCode.prototype.drawPixels = function (pattern, offset, label) {
    for (var col = 0; col < pattern[0].length; col++) {
        for (var row = 0; row < pattern.length; row++) {
            var node;
            try {
                node = this.offset_map[col + offset[1]][row + offset[0]];
            }
            catch (e) {}
            if (node === undefined) {
                continue;
            }
            var fill_color = pattern[col][row] ? BLACK : WHITE;
            this.mark(node, fill_color, label);
        }
    }
};

// Draws the finder patterns in three corners
QR.QRCode.prototype.drawFinders = function () {
    this.drawPixels(FINDER, [-1, -1], "finder");
    this.drawPixels(FINDER, [-1, this.size - FINDER_LEN + 1], "finder");
    this.drawPixels(FINDER, [this.size - FINDER_LEN + 1, -1], "finder");
};

// Draw the horizontal and vertical timing markers
// These are placed between the inner corners of finder patterns, with every other node being set
QR.QRCode.prototype.drawTiming = function () {
    // Draw horizontal timing pattern
    for (var i=0; i < this.size; i++) {
        var color = i % 2 ? WHITE : BLACK;
        var nodes = [
            this.offset_map[6][i],
            this.offset_map[i][6]
        ];

        nodes.forEach(function (node) {
            if (!QR.util.getNodeData(node).label) {
                this.mark(node, color, "timing");
            }
        }, this);
    }
};

// "Every QR code must have a dark pixel, also known as a dark module, at the coordinates (8, 4*version + 9)."
QR.QRCode.prototype.drawDark = function () {
    var node = this.offset_map[8][4 * this.version_num + 9];
    this.mark(node, BLACK, "dark");
};

// Draws the smaller alignment patterns
// The QR spec defines a list of offsets for each QR version, such as [10,20]
// Draw an alignment pattern at any offset where the the row and column numbers are both found in the list
// For [10,20] this would be (10, 10), (10, 20), (20, 10), (20, 20)
// Don't draw a pattern if the node is already labeled
QR.QRCode.prototype.drawAlignments = function () {
    var alignments = this.version.alignments;
    this.version.alignments.forEach(function (row_align) {
        this.version.alignments.forEach(function (col_align) { 
            var node = this.offset_map[col_align][row_align];
            var node_data = QR.util.getNodeData(node);
            if (node_data.label) {
                return;
            }
            this.drawPixels(ALIGNMENT, [node_data.row - 2, node_data.col - 2], "alignment");
        }, this);
    }, this);
};

// Applies a mask function to the mutable nodes
// Every row/col coordinate will be passed to the function argument, invert any node with a truthy response
QR.QRCode.prototype.applyMask = function (mask) {
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
QR.QRCode.prototype.drawFormatInfo = function () {
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

QR.util = {};

QR.util.getNodeData = function(node) {
    return d3.select(node).data()[0];
};
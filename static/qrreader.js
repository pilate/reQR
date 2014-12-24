function QRBitReader (QRA, start_row, start_col) {
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
QRBitReader.prototype.readBits = function (count) {
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
QRBitReader.prototype.writeBits = function (bit_string) {
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

function QRDataReader (qr) {
    this.qr = qr;
    this.offset = 0;
    this.setup();
}

QRDataReader.prototype.setup = function () {
    this.raw_codewords = this.readCodewords(); 
    this.sorted_codewords = this.sortCodewords();
    this.sorted_ec_codewords = this.sortECCodewords();
    this.joined_codewords = this.sorted_codewords.join("");
};

// Reads the whole QR code 8 bits at a time 
QRDataReader.prototype.readCodewords = function () {
    var bitreader = new QRBitReader(this.qr);
    var codewords = [];
    while (true) {
        var codeword = bitreader.readBits(8);
        if ((codeword === "") || (codeword.length < 8)) {
            break;
        }
        codewords.push(codeword);
    }
    return codewords;
};

QRDataReader.prototype.sortCodewords = function () {
    var ec_data = this.qr.version.ec_table[qr.ec];
    
    // Create an array for un-interpolating
    var blocked_codewords = [];
    for (var i=0; i < ec_data.groups * ec_data.group_blocks; i++) {
        blocked_codewords[i] = [];
    }

    // Drop codewords in each bucket
    var data_codes = ec_data.groups * ec_data.group_blocks * ec_data.codewords_in_group;
    for (var j=0; j < data_codes; j++) {
        blocked_codewords[j % blocked_codewords.length].push(this.raw_codewords[j]);
    }

    // Join the sorted buckets back together
    return blocked_codewords.map(function (val) {
        return val.join("");
    });
}; 

QRDataReader.prototype.sortECCodewords = function () {
    var ec_data = this.qr.version.ec_table[qr.ec];
    
    var data_codewords = ec_data.groups * ec_data.group_blocks * ec_data.codewords_in_group;
    var ec_codewords = this.raw_codewords.slice(data_codewords);

    // Create an array for un-interpolating
    var blocked_codewords = [];
    for (var i=0; i < ec_data.groups * ec_data.group_blocks; i++) {
        blocked_codewords[i] = [];
    }

    // Drop codewords in each bucket
    var ec_codes = ec_data.groups * ec_data.group_blocks * ec_data.ec_per_block;
    for (var j=0; j < ec_codes; j++) {
        blocked_codewords[j % blocked_codewords.length].push(parseInt(ec_codewords[j], 2));
    }

    // Join the sorted buckets back together
    var all_ec = [];
    blocked_codewords.map(function (val) {
        all_ec = all_ec.concat(val);
    });
    return all_ec;
}; 

QRDataReader.prototype.getECCodewords = function () {
    var ec_data = this.qr.version.ec_table[qr.ec];
    var codewords = [];

    var ec_codes = ec_data.groups * ec_data.group_blocks * ec_data.ec_per_block;
    var ec_offset = ec_data.groups * ec_data.group_blocks * ec_data.codewords_in_group;
    ec_offset--; ec_offset--;
    for (var j=0; j < ec_codes; j++) {
        codewords.push(this.raw_codewords[ec_offset + j]);
    }
    console.log(codewords);

    // Join the sorted buckets back together
    return codewords.join("");
}; 

QRDataReader.prototype.read = function (bits) {
    var data = this.joined_codewords.substr(this.offset, bits);
    this.offset += bits;
    return data;
};

QRDataReader.prototype.readAlpha = function (length) {
    var str = "";
    for (var i=0; i < length / 2; i++) {
        var bits = parseInt(this.read(11), 2);
        if (!bits) {
            break;
        }
        str += ALPHA[Math.floor(bits / 45)];
        str += ALPHA[Math.floor(bits % 45)];
    }
    return str;
};

QRDataReader.prototype.readBytes = function (length) {
    var str = "";
    for (var i=0; i < length; i++) {
        var bits = parseInt(this.read(8), 2);
        if (!bits) {
            break;
        }
        str += String.fromCharCode(bits);
    }
    return str;
};

QRDataReader.prototype.readData = function () {
    var data = {};

    data.encoding = parseInt(this.read(4), 2);

    if (data.encoding === 0) {
        return data;
    }

    var length_bits = this.qr.version.encoding_len_bits[data.encoding];
    data.length = parseInt(this.read(length_bits), 2);

    if (data.encoding == 2) {
        data.text = this.readAlpha(data.length);
    }
    else if (data.encoding == 4) {
        data.text = this.readBytes(data.length);
    }
    else {
        data.encoding = undefined;
        data.length = undefined;
    }
    return data;
}
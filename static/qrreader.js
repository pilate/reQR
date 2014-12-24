

function QRFile ( qr ) {
    this.qr = qr;
    this.row = qr.size - 1;
    this.col = qr.size - 1;
    this.direction = UP;
    this.read_prev_col = false;
}

QRFile.prototype.next = function (node_fn) {
    var node;
    
    while (true) {
        // If we're outside the code, stop trying to read
        if (this.col < 0) { return -1; }

        // Every other row, read col-1
        if (this.read_prev_col) {
            node = this.qr.offset_map[this.row][this.col - 1];

            if (this.direction == UP) {
                if (this.row == 0) {
                    this.direction = DOWN;
                    this.col -= 2;

                    // Skip the column used for timing, reset an extra node over.
                    if (this.col == 6) {
                        this.col -= 1;
                    }
                }
                else {
                    this.row -= 1;
                }
            }
            else if (this.direction == DOWN) {
                if (this.row == (this.qr.size - 1)) {
                    this.direction = UP;
                    this.col -= 2;
                }
                else {
                    this.row += 1;
                }
            }
        }
        else {
            node = this.qr.offset_map[this.row][this.col];
        }
        
        // Go back to the other column
        this.read_prev_col = this.read_prev_col ? false : true;

        var node_data = d3.select(node).data()[0]
        var is_dynamic = IGNORE_LABELS.indexOf(node_data.label) === -1

        if (is_dynamic) {
            return node_fn(node, node_data);
        }   
    }
}

QRFile.prototype.readBits = function (length) {
    var bits = ""
    for (var i=0; i < length; i++) {
        var result = this.next(function (node, data) {
            return data.val;
        });
        if (result === -1) {
            break;
        }
        bits += result;
    }
    return bits;
}

QRFile.prototype.writeBits = function (bits) {
    var that = this;
    bits = bits.split("");
    while (bits.length) {
        var res = this.next(function (node, data) {
            var bit = bits.shift();
            if (!Number(bit)) {
                that.qr.mark(node, WHITE);
            }
            else {
                that.qr.mark(node, BLACK);
            }
        });
        if (res === -1) {
            break;
        }
    }
}

function StringFile (str) {
    this.str = str;
    this.offset = 0;
}

StringFile.prototype.read = function (len) {
    var data = this.str.substr(this.offset, len);
    this.offset += len;
    return data;
};


function QRDataReader (qr) {
    this.qr = qr;
    this.offset = 0;
    this.setup();
}

QRDataReader.prototype.setup = function () {
    this.raw_codewords = this.readCodewords(); 
    this.grouped_codewords = this.groupDataCodewords();
    this.grouped_ec_codewords = this.groupECCodewords();
    this.joined_data_codewords = this.grouped_codewords.map(function (group) {
        return group.map(function (block) {
            return block.join("");
        }).join("");
    }).join("");
    this.data_file = new StringFile(this.joined_data_codewords);
};

// Reads the whole QR code 8 bits at a time 
QRDataReader.prototype.readCodewords = function () {
    var qr_file = new QRFile(this.qr);
    var codewords = [];
    while (true) {
        var codeword = qr_file.readBits(8);
        if ((codeword === "") || (codeword.length < 8)) {
            break;
        }
        codewords.push(codeword); 
    }
    return codewords;
};

QRDataReader.prototype.groupDataCodewords = function () {
    var ec_data = this.qr.version.ec_table[qr.ec];
    
    var group_array = [].arrayFiller(ec_data.groups)
    for (var i=0; i < group_array.length; i++) {
        group_array[i] = [].arrayFiller(ec_data.group_blocks);
    }

    for (var j=0; j < ec_data.groups; j++) {
        var codes = ec_data.group_blocks * ec_data.data_per_block;
        for (var k=0; k < codes; k++) {
            var codeword = this.raw_codewords[ (j * codes) + k ];
            group_array[j][k % ec_data.group_blocks].push(codeword);
        }
    }

    return group_array;
}; 

QRDataReader.prototype.groupECCodewords = function () {
    var ec_data = this.qr.version.ec_table[qr.ec];
    
    var group_array = [].arrayFiller(ec_data.groups)
    for (var i=0; i < group_array.length; i++) {
        group_array[i] = [].arrayFiller(ec_data.group_blocks);
    }

    var ec_offset = ec_data.group_blocks * ec_data.data_per_block * ec_data.groups;
    for (var j=0; j < ec_data.groups; j++) {
        var codes = ec_data.group_blocks * ec_data.ec_per_block;
        for (var k=0; k < codes; k++) {
            var codeword = this.raw_codewords[ ec_offset + (j * codes) + k ];
            group_array[j][k % ec_data.group_blocks].push(codeword);
        }
    }

    return group_array;
}; 

QRDataReader.prototype.readAlpha = function (length) {
    var str = "";
    for (var i=0; i < length / 2; i++) {
        var bits = parseInt(this.data_file.read(11), 2);
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
        var bits = parseInt(this.data_file.read(8), 2);
        if (!bits) {
            break;
        }
        str += String.fromCharCode(bits);
    }
    return str;
};

QRDataReader.prototype.readData = function () {
    var data = {};

    data.encoding = parseInt(this.data_file.read(4), 2);

    if (data.encoding === 0) {
        return data;
    }

    var length_bits = this.qr.version.encoding_len_bits[data.encoding];
    data.length = parseInt(this.data_file.read(length_bits), 2);

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
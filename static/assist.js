

function createMaskButtons() {
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
        document.getElementById("body2").appendChild(mask_el);
    }
}

function bitArrayToInts(bits) {
    var bytes = [];
    for (var i=0; i < bits.length; i++) {
        bytes.push(parseInt(bits[i], 2));
    }
    return bytes;
}

function bitsToInts(bits) {
    var bytes = [];
    for (var i=0; i < bits.length; i += 8) {
        var bit_chunk = bits.substr(i, 8);
        bytes.push(parseInt(bit_chunk, 2));
    }
    return bytes;
}

function intArrayToString(ints) {
    var string = "";
    for (var i=0; i < ints.length; i++) {
        string += String.fromCharCode(ints[i]);
    }
    return string;
}

function testErrors(reader) {
    var ec_per_block = reader.qr.version.ec_table[reader.qr.ec].ec_per_block;
    var rs = new ReedSolomon(ec_per_block);
    var errors = [];
    for (var i=0; i < reader.grouped_codewords.length; i++) {
        var data_group = reader.grouped_codewords[i];
        var ec_group = reader.grouped_ec_codewords[i];

        for (var j=0; j < data_group.length; j++) {
            var data_block = data_group[j];
            var data_ints = bitArrayToInts(data_block);
            var data_str = intArrayToString(data_ints);

            var ec_ints = bitArrayToInts(ec_group[j]);

            var check_data = data_ints.concat(ec_ints);

            var corrected_str = rs.decode(check_data);
            if (corrected_str != data_str) {
                errors.push({
                    "group": i,
                    "original": data_str,
                    "fixed": corrected_str
                });
            }
        }
    }
    return errors;
}

function readAllData(qr) {
    var sorter = new QRDataSorter(qr);
    var parser = new QRDataParser(qr, sorter.joined_data_codewords);
    var errors = testErrors(sorter);
    console.log(errors);

    // var joined_blocks = sorter.raw_codewords.join("");
    // try {
    //     var match = /^([01]+?)0+$/.exec(joined_blocks)[1];
    // }
    // catch (e) {
    //     match = joined_blocks;
    // }
    // console.log(btoa(match));

    var datas = [];
    while (true) {
        var qrdata = parser.readData();
        if (!qrdata.encoding) {
            break;
        }
        datas.push(qrdata);
    }
    return datas.map(function (e) { 
        return e.text || "";
    }).join("");
}

function init () {
    var svg = d3.select("svg");
    qr = new QRCode(svg, 3, "Q");

    createMaskButtons();

    if (document.location.hash) {
        var hash = document.location.hash.substr(1);
        var data = atob(hash);
        var qr_file = new QRFile(qr);
        qr_file.writeBits(data);
    } 

    setTimeout(function () {
        var all_data = readAllData(qr);
        document.getElementById("qrbytes").innerHTML = all_data;
    }, 5000);
}
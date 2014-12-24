function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

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
        document.body.appendChild(mask_el);
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

function readAllData(qr) {
    var reader = new QRDataReader(qr);
    // var rs = new ReedSolomon(18);

    // for (var i=0; i < reader.grouped_codewords.length; i++) {
    //     var group = reader.grouped_codewords[i];
    //     for (var j=0; j < group.length; j++) {
    //         var block = bitArrayToInts(group[j]);
    //         console.log(intArrayToString(block));
    //         var block_ec = bitArrayToInts(reader.grouped_ec_codewords[i][j]);
    //         var ec_check_data = block.concat(block_ec);
    //         console.log(rs.decode(ec_check_data));
    //     }
    // }

    // var joined_blocks = reader.raw_codewords.join("");
    // try {
    //     var match = /^([01]+?)0+$/.exec(joined_blocks)[1];
    // }
    // catch (e) {
    //     match = joined_blocks;
    // }
    // console.log(btoa(match));

    var datas = [];
    while (true) {
        var qrdata = reader.readData();
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
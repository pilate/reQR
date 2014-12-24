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

function bitsToInts(bits) {
    var bytes = [];
    for (var i=0; i < bits.length; i += 8) {
        var bit_chunk = bits.substr(i, 8);
        bytes.push(parseInt(bit_chunk, 2));
    }
    return bytes;
}

function readAllData(qr) {
    var reader = new QRDataReader(qr);

    // console.log(reader.raw_codewords.length, reader.joined_codewords.length / 8)
    // console.log(reader.sorted_ec_codewords);
    var joined_cw = reader.sorted_codewords.join("");
    var int_array = bitsToInts(joined_cw);
    var chars = int_array.map(function (d) {
        return String.fromCharCode(d);
    }).join("");

    // var ec_joined_cw = reader.sorted_ec_codewords;
    // console.log(reader.sorted_ec_codewords);

    // var joined_blocks = reader.raw_codewords.join("");
    // try {
    //     var match = /^([01]+?)0+$/.exec(joined_blocks)[1];
    // }
    // catch (e) {
    //     match = joined_blocks;
    // }
    // console.log(btoa(match));

    var rs = new ReedSolomon(36);
    var enc = rs.encode(chars);
    console.log("cw", reader.sorted_ec_codewords);
    console.log("enc", enc);
    var msg = rs.decode(enc);

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
        r = new QRBitReader(qr);
        var hash = document.location.hash.substr(1);
        var data = atob(hash);
        r.writeBits(data);
    }

    setInterval(function () {
        var all_data = readAllData(qr);
        document.getElementById("qrbytes").innerHTML = all_data;
    }, 5000);
}
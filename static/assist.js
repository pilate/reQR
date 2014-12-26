
function createMaskButtons(qr) {
    for (var i=0; i < MASKS.length; i++) {
        var mask_el = document.createElement("button");
        var label = "mask"+i;
        mask_el.style.float = "left";
        mask_el.setAttribute("id", label);
        mask_el.addEventListener("click",
            (function (mask) {
                return function () {
                    qr.applyMask(MASKS[mask]);
                    qr.onchange();
                };
            })(i)
        );
        mask_el.innerHTML = label;
        document.getElementById("maskbuttons").appendChild(mask_el);
    }
}

function testErrors(sorter) {
    var ec_per_block = sorter.qr.version.ec_table[sorter.qr.ec].ec_per_block;
    var rs = new ReedSolomon(ec_per_block);
    var errors = [];
    for (var i=0; i < sorter.grouped_codewords.length; i++) {
        var data_group = sorter.grouped_codewords[i];
        var ec_group = sorter.grouped_ec_codewords[i];

        for (var j=0; j < data_group.length; j++) {
            var data_block = data_group[j];
            var data_ints = data_block.toIntArray();
            var data_str = data_ints.intsToString();

            var ec_ints = ec_group[j].toIntArray();

            var check_data = data_ints.concat(ec_ints);

            var corrected_str = rs.decode(check_data);
            if (corrected_str != data_str) {
                errors.push({
                    "group": i,
                    "block": j,
                    "original": data_str,
                    "original_hex": data_ints.toHexArray(),
                    "fixed": corrected_str,
                    "fixed_ints": corrected_str.toHexArray()
                });
            }
        }
    }
    return errors;
}

function parseData (qr, data) {
    var parser = new QRDataParser(qr, data);

    var datas = [];
    while (true) {
        var qrdata = parser.readData();
        if (!qrdata.encoding) {
            break;
        }
        datas.push(qrdata);
    }
    return datas;

}

function AppViewModel(qr) {
    var that = this;
    this.qr = ko.observable(qr);
    this.qr.subscribe(function (qr) {
        that.qr_sorter(new QRDataSorter(qr));
    });

    this.qr_sorter = ko.observable(new QRDataSorter(qr));

    this.url = ko.pureComputed(function () {
        var match;
        var joined_blocks = this.qr_sorter().all_codewords.join("");
        try {
            match = /^([01]+?)0+$/.exec(joined_blocks)[1];
        }
        catch (e) {
            match = joined_blocks;
        }
        return "#" + btoa(match);  
    }, this);

    this.raw_data = ko.pureComputed(function () {
        var sorter = this.qr_sorter();
        return sorter.joinGroupedCodewords(sorter.grouped_codewords);
    }, this);

    this.errors = ko.computed(function () {
        var errors = [];
        try {
            errors = testErrors(this.qr_sorter());
        }
        catch (e) {
            if (e != "Could not locate error") {
                console.log("error:", e);
            }
        }
        return errors;
    }, this);

    this.fixed_data = ko.pureComputed(function () {
        var sorter = this.qr_sorter();
        var errors = this.errors();
        var copied_codewords = jQuery.extend(true, [], sorter.grouped_codewords);
        for (var i=0; i < errors.length; i++) {
            var error = errors[i];
            copied_codewords[error.group][error.block] = error.fixed.toBinArray();
        }
        return sorter.joinGroupedCodewords(copied_codewords);
    }, this);

    this.sorted_groups = ko.computed(function () {
        var group_data = [];
        var data_groups = this.qr_sorter().grouped_codewords;
        var ec_groups = this.qr_sorter().grouped_ec_codewords;
        for (var i=0; i < data_groups.length; i++) {
            var group_codewords = data_groups[i];
            for (var j=0; j < group_codewords.length; j++) {
                group_data.push({
                    "group": i,
                    "block": j,
                    "data": group_codewords[j].toHexArray(),
                    "ec": ec_groups[i][j].toHexArray()
                });
            }
        }
        return group_data;
    }, this);

    this.parsed_data = ko.computed(function () {
        return parseData(this.qr(), this.raw_data());
    }, this);

    this.parsed_fixed_data = ko.computed(function () {
        return parseData(this.qr(), this.fixed_data());
    }, this);
}


function init () {
    var svg = d3.select("svg");
    var qr = new QRCode(svg, 3, "Q");
    var viewmodel = new AppViewModel(qr);

    qr.onchange = function () {
        viewmodel.qr(qr);
    };

    ko.applyBindings(viewmodel);

    createMaskButtons(qr);

    if (document.location.hash) {
        var hash = document.location.hash.substr(1);
        var data = atob(hash);
        var qr_file = new QRFile(qr);
        qr_file.writeBits(data);
    } 

    qr.onchange();
}
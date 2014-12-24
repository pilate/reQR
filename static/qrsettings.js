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
            "L": { "ec_per_block": 15, "groups": 1, "group_blocks": 1, "data_per_block": 55 },
            "M": { "ec_per_block": 26, "groups": 1, "group_blocks": 1, "data_per_block": 44 },
            "Q": { "ec_per_block": 18, "groups": 1, "group_blocks": 2, "data_per_block": 17 },
            "H": { "ec_per_block": 22, "groups": 1, "group_blocks": 2, "data_per_block": 13 },
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
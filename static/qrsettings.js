
var UP = 0;
var DOWN = 1;

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
    1: {
        "size": 21,
        "alignments": [],
    },
    2: {
        "size": 25,
        "alignments": [6, 18],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
    },
    3: {
        "size": 29,
        "alignments": [6, 22],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
        "ec_table": {
            "L": { "ec_per_block": 15, "groups": 1, "group_blocks": 1, "data_per_block": 55 },
            "M": { "ec_per_block": 26, "groups": 1, "group_blocks": 1, "data_per_block": 44 },
            "Q": { "ec_per_block": 18, "groups": 1, "group_blocks": 2, "data_per_block": 17 },
            "H": { "ec_per_block": 22, "groups": 1, "group_blocks": 2, "data_per_block": 13 },
        }
    },
    4: {
        "size": 33,
        "alignments": [6, 26],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
    },
    5: {
        "size": 37,
        "alignments": [6, 30],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
    },
    6: {
        "size": 41,
        "alignments": [6, 34],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
    },
    7: {
        "size": 45,
        "alignments": [6, 22, 38],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
    },
    8: {
        "size": 49,
        "alignments": [6, 24, 42],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
    },
    9: {
        "size": 53,
        "alignments": [6, 26, 46],
        "encoding_len_bits": { 1: 10, 2: 9, 4: 8, 8: 8 },
    },
    10: {
        "size": 57,
        "alignments": [6, 28, 50],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    11: {
        "size": 61,
        "alignments": [6, 30, 54],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    12: {
        "size": 65,
        "alignments": [6, 32, 58],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    13: {
        "size": 69,
        "alignments": [6, 34, 62],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    14: {
        "size": 73,
        "alignments": [6, 26, 46, 66],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    15: {
        "size": 77,
        "alignments": [6, 26, 48, 70],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    16: {
        "size": 81,
        "alignments": [6, 26, 50, 74],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    17: {
        "size": 85,
        "alignments": [6, 30, 54, 78],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    18: {
        "size": 89,
        "alignments": [6, 30, 56, 82],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    19: {
        "size": 93,
        "alignments": [6, 30, 58, 86],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    20: {
        "size": 97,
        "alignments": [6, 34, 62, 90],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    21: {
        "size": 101,
        "alignments": [6, 28, 50, 72, 94],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    22: {
        "size": 105,
        "alignments": [6, 26, 50, 74, 98],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    23: {
        "size": 109,
        "alignments": [6, 30, 54, 78, 102],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    24: {
        "size": 113,
        "alignments": [6, 28, 54, 80, 106],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    25: {
        "size": 117,
        "alignments": [6, 32, 58, 84, 110],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    26: {
        "size": 121,
        "alignments": [6, 30, 58, 86, 114],
        "encoding_len_bits": { 1: 12, 2: 11, 4: 16, 8: 10 },
    },
    27: {
        "size": 125,
        "alignments": [6, 34, 62, 90, 118],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    28: {
        "size": 129,
        "alignments": [6, 26, 50, 74, 98, 122],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    29: {
        "size": 133,
        "alignments": [6, 30, 54, 78, 102, 126],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    30: {
        "size": 137,
        "alignments": [6, 26, 52, 78, 104, 130],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    31: {
        "size": 141,
        "alignments": [6, 30, 56, 82, 108, 134],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    32: {
        "size": 145,
        "alignments": [6, 34, 60, 86, 112, 138],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    33: {
        "size": 149,
        "alignments": [6, 30, 58, 86, 114, 142],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    34: {
        "size": 153,
        "alignments": [6, 34, 62, 90, 118, 146],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    35: {
        "size": 157,
        "alignments": [6, 30, 54, 78, 102, 126, 150],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    36: {
        "size": 161,
        "alignments": [6, 24, 50, 76, 102, 128, 154],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    37: {
        "size": 165,
        "alignments": [6, 28, 54, 80, 106, 132, 158],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    38: {
        "size": 169,
        "alignments": [6, 32, 58, 84, 110, 136, 162],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    39: {
        "size": 173,
        "alignments": [6, 26, 54, 82, 110, 138, 166],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },
    40: {
        "size": 177,
        "alignments": [6, 30, 58, 86, 114, 142, 170],
        "encoding_len_bits": { 1: 14, 2: 13, 4: 16, 8: 12 },
    },

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
// HTML constants.
var WEBSITE_CONTENT_WRAPPER_ID = 'content',// Can change at runtime, if ID name-clash on page.

    LEFT_PANE_IDENTIFIER = 'leftPane',
    LEFT_PANE_SELECTOR = '#' + LEFT_PANE_IDENTIFIER,
    RIGHT_PANE_IDENTIFIER = 'rightPane',
    RIGHT_PANE_SELECTOR = '#' + RIGHT_PANE_IDENTIFIER,

    QUOTE_BUBBLE_CONTENT_ID = 'quoteContent',
    ENDPOINT_COLOR = "rgba(229,219,61,0.5)",
    QUOTE_PANE_WIDTH_ABS = 20,
    QUOTE_PANE_WIDTH = QUOTE_PANE_WIDTH_ABS + '%',
    HISTORY_PANE_HEIGHT_ABS = 20,
    HISTORY_PANE_HEIGHT = HISTORY_PANE_HEIGHT_ABS + '%';

// History graph.
var TOTAL_LEVELS = 7,
    MAX_X = 1.5,
    MIN_X = -1.5,
    MAX_Y = 3,
    MIN_Y = -3;


// Messaging constants.
var HISTORY_ID = "history",
    HISTORY_UPDATE = "history_update",
    HISTORY_INIT_DATA = "history_init_data";

var QUOTE_ID = "quote_graph",
    QUOTE_UPDATE = "quote_update",
    QUOTE_CONNECTION_UPDATE = "quote_connection_update",
    QUOTE_INIT_DATA = "quote_init_data";
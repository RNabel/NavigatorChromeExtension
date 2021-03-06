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
    HISTORY_PANE_HEIGHT = HISTORY_PANE_HEIGHT_ABS + '%',
    Z_INDEX_FOREGROUND = 9100,
    Z_INDEX_BACKGROUND = 9000;

// History graph.
var TOTAL_COLUMNS = 5,
    HIST_CENTER_COLUMN_INDEX = Math.floor(TOTAL_COLUMNS / 2),
    MAX_X = 1.5,
    MIN_X = -1.5,
    MAX_Y = 3,
    MIN_Y = -3,

    HIST_CONNECTOR_WIDTH = 2,
    HIST_CONNECTOR_OPACITY = 1,
    HIST_CONNECTOR_COLOR = "#b2dfdb",
    HIST_ENDPOINT_COLOR = "#b2dfdb",
    HIST_ENDPOINT_RADIUS = 1,

    HIST_BOX_HEIGHT_DISTANCE = "35",
    HIST_COLUMN_INDENTIFIER_PREFIX = "column-",
    HIST_TOP_OFFSET = 5,
    HIST_MAXIMIZE_CLASS = "hist_maximize",
    HIST_COLLAPSE_CLASS = "hist-collapse",
    HIST_HEIGHT_SMALL = "auto",
    HIST_HEIGHT_FULLSCREEN = "auto",
    HIST_CENTRAL_NODE_STYLE_CLASSES = 'teal lighten-3';

// Quote graph constants.
var QUOTE_GRAPH_MAX_SCALE = 1,
    QUOTE_GRAPH_MIN_SCALE = 0.1,
    QUOTE_MAXIMIZE_CLASS = "quote-maximize",
    QUOTE_COLLAPSE_CLASS = "quote-collapse",
    QUOTE_TITLE_CLASS = "quote_title",
    QUOTE_CONTENT_CLASS = "quote_content",
    QUOTE_CARD_CLASS = "quote_card",
    QUOTE_TITLE_CHANGED = "quote_title_changed",
    QUOTE_CONNECTOR_COLOR = "#80cbc4",
    QUOTE_ENDPOINT_COLOR = "#26a69a";

// Messaging constants.
var HISTORY_ID = "history",
    HISTORY_UPDATE = "history_update",
    HISTORY_INIT_DATA = "history_init_data";

var QUOTE_ID = "quote_graph",
    QUOTE_UPDATE = "quote_update",
    QUOTE_DELETED = "quote_deleted",
    QUOTE_LOCATION_UPDATE = "quote_location_update",
    QUOTE_CONNECTION_UPDATE = "quote_connection_update",
    QUOTE_CONNECTION_DELETED = "quote_connection_deleted",
    QUOTE_INIT_DATA = "quote_init_data";


// Elements inserted in page.
var bottomRightExpander = '<a class="btn-floating btn '+ HIST_COLLAPSE_CLASS +'" style="bottom: 10px; right: 10px">\n    <i data-position="left"\n       data-delay="50"\n       data-tooltip="Expand"\n       class="material-icons no-select fullscreen tooltipped">\n        expand_less\n    </i>\n</a>';
var topLeftExpander = '<a class="btn-floating btn ' + QUOTE_COLLAPSE_CLASS + '" style="top: 10px; left: 10px">\n    <i data-position="right" \n       data-delay="50" \n       data-tooltip="Expand"\n       class="material-icons no-select fullscreen tooltipped">\n        chevron_right\n    </i>\n</a>';
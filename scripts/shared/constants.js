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
    MAX_X = 1.5,
    MIN_X = -1.5,
    MAX_Y = 3,
    MIN_Y = -3,

    HIST_CONNECTOR_WIDTH = 2,
    HIST_CONNECTOR_OPACITY = 1,
    HIST_CONNECTOR_COLOR = "rgba(229,219,61,0.5)",
    HIST_ENDPOINT_RADIUS = 1,

    HIST_BOX_HEIGHT_DISTANCE = "35",
    HIST_COLUMN_INDENTIFIER_PREFIX = "column-",
    HIST_TOP_OFFSET = 5,
    HIST_MAXIMIZE_CLASS = "hist_maximize",
    HIST_COLLAPSE_CLASS = "hist-collapse";

// Quote graph constants.
var QUOTE_GRAPH_MAX_SCALE = 1,
    QUOTE_GRAPH_MIN_SCALE = 0.1,
    QUOTE_CONTAINER_CLASS = "container",
    QUOTE_OUTER_CONTAINER_CLASS = "container",
    QUOTE_MAXIMIZE_CLASS = "quote_maximize",
    QUOTE_COLLAPSE_CLASS = "quote-collapse";

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

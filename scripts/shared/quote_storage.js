/**
 * Created by Robin Nabel on 03/02/16.
 */

/**
 * An instance which contains all information relevant for a quote object.
 * @param id {string | QuoteRecord} The unique identifier of this node.
 * @param [text] {string} The plain text content of the quote.
 * @param [htmlData] {string} The html formatted content of the quote.
 * @param [type] {string} The type of the htmlData, i.e. whether image or plain text.
 * @param [URL] {string} The URL of the origin
 * @param [xPath] {string} The XPath locator of the origin on the page referenced by URL.
 * @param [location] {string} The x and y coordinate of its location on the Quote pane.
 * @param [title] {string} The title of the quote.
 * @param [zoom] {number} The size of the element.
 * @constructor
 */
function QuoteRecord(id, text, htmlData, type, URL, xPath, location, title, zoom) {
    if (typeof id == 'object') { // If constructor object is passed.
        text = id.text;
        htmlData = id.html_data;
        type = id.type;
        URL = id.URL;
        xPath = id.xPath;
        location = id.location;
        title = id.title;
        zoom = id.zoom;
        id = id.id;
    }

    this.id = (id === undefined) ? utils.guid() : id; // Ensure id exists and create new one as required.
    this.text = text;
    this.html_data = htmlData;
    this.type = type;
    this.URL = URL;
    this.xPath = xPath;
    this.location = location;
    this.title = title;
    this.zoom = zoom;
}

function QuoteConnection(obj) {
    this.source = obj.source;
    this.target = obj.target;
}

/**
 * Initialise quote storage.
 * @param [init_obj] {object} The QuoteStorage object to use as base.
 * @constructor
 */
function QuoteStorage(init_obj) {
    /**
     * Contains all QuoteRecord objects.
     * @type {QuoteRecord[]}
     */
    this.quotes = [];
    this.connections = [];
    if (init_obj !== undefined) {
        var init_quotes = init_obj.quotes;
        var init_connections = init_obj.connections;

        for (var i = 0; i < init_quotes.length; i++) {
            var rec = init_quotes[i];
            this.quotes.push(new QuoteRecord(rec));
        }

        if (init_connections !== undefined) {
            for (i = 0; i < init_connections.length; i++) {
                rec = init_connections[i];
                this.connections.push(new QuoteConnection(rec));
            }
        }
    }
}

/**
 * Add Quote to storage object.
 * @param quote {QuoteRecord} The quote to add.
 */
QuoteStorage.prototype.addQuote = function (quote) {
    this.quotes.push(quote);
};

/**
 * Delete quote.
 * @param nodeID {string} The id of the node.
 */
QuoteStorage.prototype.deleteQuote = function (nodeID) {
    var result = -1;
    for (var i = 0; i < this.quotes.length; i++) {
        var quote = this.quotes[i];
        if (quote.id == nodeID) {
            result = i;
            break;
        }
    }

    if (result !== -1) {
        this.quotes.splice(result, 1);

        // Delete all connected connections.
        this.removeAttachedConnections(nodeID);
    }
};

/**
 * Remove all connections attached to the specified node.
 * @param source {string} The id of the node.
 * @returns {boolean} Whether function executed correctly.
 */
QuoteStorage.prototype.removeAttachedConnections = function (source) {
    // Go through all connections and delete each connections which has source as an endpoint.
    // Reversal of iteration order as deletion changes indexing of elements.
    for (var i = this.connections.length - 1; i >= 0; i--) {
        var connection = this.connections[i];
        if (connection.source == source || connection.target == source) {
            this.connections.splice(i, 1);
        }
    }

    return true;
};

/**
 * Add connection to storage object.
 * @param connection {QuoteConnection} The connection to add.
 */
QuoteStorage.prototype.addConnection = function (connection) {
    this.connections.push(connection);
};

/**
 * Check whether connection between source and target exists.
 * @param source {string} The id of the source.
 * @param target {string} The id of the target.
 * @returns {boolean} Whether the a connection exists.
 */
QuoteStorage.prototype.existsConnection = function (source, target) {
    for (var i = 0; i < this.connections.length; i++) {
        var connection = this.connections[i];
        if (connection.source == source && connection.target == target) {
            return true;
        }
    }
    return false;
};

/**
 * Delete a connection between given target and source.
 * @param source {string} The id of the source.
 * @param target {string} The id of the target.
 * @returns {boolean} Whether the function executed correctly.
 */
QuoteStorage.prototype.deleteConnection = function (source, target) {
    for (var i = 0; i < this.connections.length; i++) {
        var connection = this.connections[i],
            currentSource = connection.source,
            currentTarget = connection.target;

        if ((currentSource == source && currentTarget == target) ||
            (currentSource == target && currentTarget == source)
        ) {
            // Delete node.
            this.connections.splice(i, 1);
            return true;
        }
    }
    return false;
};

/**
 * Return QuoteRecord object if Uuid exists in record store or False
 * @param uuid {string} The UUID of the QuoteRecord.
 *
 * @returns {QuoteRecord | boolean} The QuoteRecord instance if found, false otherwise.
 */
QuoteStorage.prototype.getQuote = function (uuid) {
    for (var i = 0; i < this.quotes.length; i++) {
        var quote = this.quotes[i];
        if (quote.id == uuid) {
            return quote;
        }
    }

    return false;
};

/**
 * Return array of all quotes.
 * @returns {QuoteRecord[]}
 */
QuoteStorage.prototype.getAllQuotes = function () {
    return this.quotes;
};

/**
 * Return array of all connections.
 * @returns {QuoteConnection[]}
 */
QuoteStorage.prototype.getAllConnections = function () {
    return this.connections;
};

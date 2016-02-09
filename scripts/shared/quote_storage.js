/**
 * Created by Robin Nabel on 03/02/16.
 */
function QuoteRecord(id, text, html_data, type, URL, xPath, location) {
    if (typeof id == 'object') { // If constructor object is passed.
        html_data = id.html_data;
        URL = id.URL;
        xPath = id.xPath;
        location = id.location;
        text = id.text;
        id = id.id;
    }

    this.id = id;
    this.text = text;
    this.html_data = html_data;
    this.type = type;
    this.URL = URL;
    this.xPath = xPath;
    this.location = location;
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
 * Add connection to storage object.
 * @param connection {QuoteConnection} The connection to add.
 */
QuoteStorage.prototype.addConnection = function (connection) {
    this.connections.push(connection);
};

QuoteStorage.prototype.existsConnection = function(source, target) {
    for (var i = 0; i < this.connections.length; i++) {
        var connection = this.connections[i];
        if (connection.source == source && connection.target == target) {
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
QuoteStorage.prototype.getQuote = function(uuid) {
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

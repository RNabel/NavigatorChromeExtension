/**
 * Created by R. Nabel on 13/01/16.
 */

/**
 * Create an object to store a node in the history tree.
 * @param URL {string | HistoryRecord} - acts as unique ID; or is cloned HistoryRecord.
 * @param [access_time] {number} - list of UNIX time stamps.
 * @param [title] {string} The title of the web page.
 * @param [parent] {string} Array of parent URLs.
 * @param faviconURL {string} The url to the site's favicon.
 */
function HistoryRecord(URL, access_time, title, parent, faviconURL) {
    if (arguments.length > 1) { // Each parameter passed separately.
        this.URL = URL;
        this.access_times = [access_time];
        this.children = [];
        this.title = title;
        if (parent) {
            this.parents = [parent];
        } else {
            this.parents = [];
        }


    } else { // A cloned HistoryRecord is passed.
        this.URL = URL.URL;
        this.access_times = URL.access_times;
        this.children = URL.children;
        this.parents = URL.parents;
        this.title = URL.title;
        this.faviconURL = URL.faviconURL;
    }

    // Fall back to generic favicon if faviconURL not specified. Using answer from Stackoverflow question:
    //      http://stackoverflow.com/a/15750809/3918512 and http://stackoverflow.com/a/23945027/3918512
    // If particular site not working, it is because it does not store its favicon in the expected location: domain.com/favicon.ico
    this.faviconURL = this.faviconURL || "http://" + utils.extractDomain(URL) + "/favicon.ico";
}

/**
 * Retrieve value of the ID of HistoryRecord.
 * @returns {string} The b64 encoded URL.
 */
HistoryRecord.prototype.getID = function () {
    return btoa(this.URL).replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'');
};

/**
 * Return the URL of this history record.
 * @returns {string} The URL.
 */
HistoryRecord.prototype.getURL = function() {
    return this.URL;
};

/**
 * Return the entry's favicon URL.
 * @returns {string} The url to the element's favicon.
 */
HistoryRecord.prototype.getFaviconURL = function() {
    return this.faviconURL;
};

/**
 * Add a parent to the object.
 * @param {string} _parent - The parent URL.
 */
HistoryRecord.prototype.addParent = function (_parent) {
    if ($.inArray(_parent, this.parents) === -1) {
        this.parents.push(_parent);
    }
};

/**
 * Add a child node to the object.
 * @param {string} _child - The child URL.
 */
HistoryRecord.prototype.addChild = function (_child) {
    if ($.inArray(_child, this.children) === -1) {
        this.children.push(_child);
    }
};

/**
 * Add a UNIX access time to the object.
 * @param {number} _access_time - The time of access.
 */
HistoryRecord.prototype.addAccessTime = function (_access_time) {
    this.access_times.push(_access_time);
};

HistoryRecord.prototype.getChildren = function () {
    return this.children;
};

HistoryRecord.prototype.getParents = function () {
    return this.parents;
};

HistoryRecord.prototype.getTitle = function () {
    return this.title;
};

/**
 * Object which contains all HistoryRecords and makes accessor methods available.
 * @param [init_list] {object[] | HistoryStorage} History storage / list of [History records]{@link HistoryRecord} to be copied.
 * @constructor The object's constructor.
 */
function HistoryStorage(init_list) {
    this.list = [];
    if (init_list !== undefined) {
        for (var i = 0; i < init_list.length; i++) {
            var rec = init_list[i];
            this.list.push(new HistoryRecord(rec));
        }
    }
}

/**
 * Add a record to the history storage.
 * @param {HistoryRecord} record - The record object.
 */
HistoryStorage.prototype.addRecord = function (record) {
    for (var i = 0; i < this.list.length; i++) {
        var element = this.list[i];
        if (element.url == record.URL) {
            return;
        }
    }

    this.list.push(record);
};

/**
 * Search for record by URL and deletes it.
 * @param {string | HistoryRecord} record - The URL string.
 */
HistoryStorage.prototype.deleteRecord = function (record) {
    var url = '';
    var errorOccurred = false;
    if (record !== undefined) {
        if (typeof record == 'string') {
            url = record;
        } else if (record.URL !== undefined && typeof record.URL == 'string') {
            url = record.URL;
        } else {
            errorOccurred = true;
        }

        var isFound = false;
        for (var i = 0; i < this.list.length; i++) {
            var currentUrl = this.list[i];
            if (currentUrl == url) {
                // Record found -> delete record.
                this.list.splice(i, 1);
                isFound = true;
                break;
            }
        }

        // Error-handling if record is not found.
        if (!isFound) {
            console.log('HistoryStorage.deleteRecord: Record not found.');
        }

    } else {
        errorOccurred = true;
    }

    // Error-handling.
    if (errorOccurred) {
        console.log('HistoryStorage.deleteRecord:record format incorrect.');
    }
};

/**
 * Find a record in the history storage.
 * @param {string} record_id - The URL (or id) associated with the record.
 * @returns {HistoryRecord | boolean} The relevant record of false.
 */
HistoryStorage.prototype.findRecord = function (record_id) {
    for (var i = 0; i < this.list.length; i++) {
        var record = this.list[i];
        if (record.URL == record_id) {
            return record;
        }
    }

    return false;
};
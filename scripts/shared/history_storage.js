/**
 * Created by R. Nabel on 13/01/16.
 */

/**
 * Function that creates an object to store a node in the history tree.
 * @param {string} URL - acts as unique ID.
 * @param {number} access_time - list of UNIX time stamps.
 * @param {string} [parent] - array of parent URLs.
 */
function HistoryRecord(URL, access_time, parent) {
    this.URL = URL;
    this.access_times = [access_time];
    this.children = [];

    if (parent) {
        this.parents = [parent];
    } else {
        this.parents = [];
    }
}

/**
 * Retrieves value of URL of HistoryRecord.
 * @returns {*} The URL.
 */
HistoryRecord.prototype.getURL = function () {
    return this.URL;
};

/**
 * Adds a parent to the object.
 * @param {string} _parent - The parent URL.
 */
HistoryRecord.prototype.addParent = function (_parent) {
    if ($.inArray(_parent, this.parents) === -1) {
        this.parents.push(_parent);
    }
};

/**
 * Adds a child node to the object.
 * @param {string} _child - The child URL.
 */
HistoryRecord.prototype.addChild = function (_child) {
    if ($.inArray(_child, this.children) === -1) {
        this.children.push(_child);
    }
};

/**
 * Adds a UNIX access time to the object.
 * @param {number} _access_time - The time of access.
 */
HistoryRecord.prototype.addAccessTime = function (_access_time) {
    this.access_times.push(_access_time);
};

/**
 * Object which contains all HistoryRecords and makes accessor methods available.
 * @constructor The object's constructor.
 */
function HistoryStorage() {
    this.list = []
}

/**
 * Adds a record to the history storage.
 * @param {HistoryRecord} record - The record object.
 */
HistoryStorage.prototype.addRecord = function (record) {
    // TODO Check if already existent.
    this.list.push(record);
};

/**
 * Searches for record by URL and deletes it.
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
 * Finds a record in the history storage.
 * @param {string} record_id - The URL (or id) associated with the record.
 * @returns {*}
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
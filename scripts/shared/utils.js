/**
 * Created by robin on 03/02/16.
 */

utils = {
    /**
     * UUID generator, used to create indices for the text nodes.
     * @returns {string} The unique identifier.
     */
    guid: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },

    /**
     * Creates UNIX-style timestamp.
     * @returns {number} The current timestamp.
     */
    timestamp: function () {
        return Math.floor(Date.now() / 1000);
    },

    extractDomain: function (url) {
        var domain;
        //find & remove protocol (http, ftp, etc.) and get domain
        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        }
        else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];

        return domain;
    },

    /**
     * HTML-Escape an input string to make it safe to be inserted by .innerHTML .
     * Taken from [StackOverflow Answer]{@link http://stackoverflow.com/a/6234804/3918512}.
     * @param unsafe {string} The unsafe string to be escaped.
     * @returns {XML|string} The escaped string.
     */
    escapeHtml: function (unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    createFaviconURL: function (url) {
        // Fall back to generic favicon if faviconURL not specified. Using answer from Stackoverflow question:
        //      http://stackoverflow.com/a/15750809/3918512 and http://stackoverflow.com/a/23945027/3918512
        // If particular site not working, it is because it does not store its favicon in the expected location: domain.com/favicon.ico
        if (typeof url == "string" && url.includes("chrome://newtab/")) {
            url = "http://www.favicon.cc/favicon/327/29/favicon.png";
        } else {
            url = "http://" + utils.extractDomain(url) + "/favicon.ico";
        }
        return url;
    }
};
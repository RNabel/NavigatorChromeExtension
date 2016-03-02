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
    }
};
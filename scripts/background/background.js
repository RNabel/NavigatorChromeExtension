/**
 * Created by Robin Nabel on 03/11/15.
 */
var BackgroundScript = {
    quote_graph: {
        // The variable which holds content for the left pane to display
        uuidToUrlMap: {},
        quoteStorage: new QuoteStorage(),

        /**
         * Sends entire history to all tabs.
         */
        sendAllQuotes: function () {
            console.log("Send all quotes - initial.");
            var message = {
                deliver_to: QUOTE_ID,
                type: QUOTE_INIT_DATA,
                data: BackgroundScript.quote_graph.quoteStorage
            };
            //BackgroundScript.tools.sendMessage(message, tabId); FIXME not sending to correct tab when tab id is specified.
            BackgroundScript.tools.sendMessage(message);
        },

        onQuoteUpdate: function (update) {
            var quote = new QuoteRecord(update);
            BackgroundScript.quote_graph.quoteStorage.addQuote(quote);

            BackgroundScript.quote_graph.sendAllQuotes();
        },

        onQuoteDeleted: function (data) {
            var nodeID = data.id;

            BackgroundScript.quote_graph.quoteStorage.deleteQuote(nodeID);

            BackgroundScript.quote_graph.sendAllQuotes();
        },

        onQuoteLocationUpdate: function (update) {
            // Find quote instance by UUID.
            var quoteRecord = BackgroundScript.quote_graph.quoteStorage.getQuote(update.uuid);
            // Update the location from update.

            if (quoteRecord) {
                quoteRecord.location = {
                    x: update.x,
                    y: update.y
                };
            }
        },

        onQuoteConnectionUpdate: function (data) {
            var source = data.source,
                target = data.target;

            var connection = new QuoteConnection({source: source, target: target});
            BackgroundScript.quote_graph.quoteStorage.addConnection(connection);

            BackgroundScript.quote_graph.sendAllQuotes();
        },

        onQuoteConnectionDeleted: function (data) {
            var source = data[0],
                target = data[1];

            BackgroundScript.quote_graph.quoteStorage.deleteConnection(source, target);

            BackgroundScript.quote_graph.sendAllQuotes();
        },

        onQuoteTitleChanged: function (data) {
            var newTitle = data.new_title,
                quoteID = data.quote_id;

            var quoteRecord = BackgroundScript.quote_graph.quoteStorage.getQuote(quoteID);
            quoteRecord.title = newTitle;

            BackgroundScript.quote_graph.sendAllQuotes();
        }
    },

    history_graph: {
        history: new HistoryStorage(),
        title_cache: {},
        currentTabUrls: {},

        onInitHistory: function (data) {
            console.log("Sending INIT history.");
            BackgroundScript.history_graph.title_cache[data.url] = data.title;
            BackgroundScript.history_graph.sendEntireHistory();
        },

        /**
         * Sends entire history to the specified tab.
         * @param tabId
         */
        sendEntireHistory: function (tabId) {
            console.log("Send entire history - initial.");
            var message = {
                deliver_to: HISTORY_ID,
                type: HISTORY_INIT_DATA,
                data: BackgroundScript.history_graph.history
            };
            //BackgroundScript.tools.sendMessage(message, tabId); FIXME not sending to correct tab when tab id is specified.
            BackgroundScript.tools.sendMessage(message);
        },

        /**
         * Creates new connection.
         * @param source {object} - The URL (or id) of the source page.
         * @param target {object} - The URL (or id) of the target page.
         */
        createNewConnection: function (source, target) {
            // Check if history contains both source and target.
            var history = BackgroundScript.history_graph.history,
                src = history.findRecord(source.url),
                tar = history.findRecord(target.url);

            if (!src) { // Create records if not existent.
                src = new HistoryRecord(source.url, utils.timestamp(), source.title);
                history.addRecord(src);
            }
            if (!tar) {
                tar = new HistoryRecord(target.url, utils.timestamp(), target.title);
                history.addRecord(tar);
            }

            src.addChild(target.url);
            tar.addParent(source.url);

            // Notify all content scripts to update graph as necessary.
            BackgroundScript.history_graph.notifyHistoryUpdate(source, target);
        },

        /**
         * Creates the object to be sent to all content scripts.
         * @param source
         * @param target
         */
        notifyHistoryUpdate: function (source, target) {
            console.log("Sending history update.");
            var message = {
                deliver_to: HISTORY_ID,
                data: BackgroundScript.history_graph.history,
                type: HISTORY_UPDATE
            };
            BackgroundScript.tools.sendMessage(message);
        },

        /**
         * Function handling tab URL changes. Called from event listener.
         * [Official Google documentation]{@link https://developer.chrome.com/extensions/tabs#event-onUpdated}
         * @param tabId {int} The id of the tab.
         * @param changeInfo {object} Further information on occurred changes.
         * @param tab {Tab} The state of the updated tab.
         */
        onTabChange: function (tabId, changeInfo, tab) {
            if (changeInfo.status != "complete") {
                return;
            }

            console.log("tab change detected.");
            var windowId = tab.windowId,
                key = tabId + '_' + windowId,
                history = BackgroundScript.history_graph.currentTabUrls;

            // Create objects representing the start and end points.
            var target = {
                    url: tab.url,
                    title: tab.title
                },
                source = history[key];

            if (target.url == target.title) {
                console.log("URL and TITLE are equal, chacking title cache.");
                if (BackgroundScript.history_graph.title_cache.hasOwnProperty(target.url)) {
                    target.title = BackgroundScript.history_graph.title_cache[target.url];
                }
            }

            // Check if tab is registered.
            if (key in history) {
                if (history[key] != (changeInfo.url || tab.url)) {
                    // Add new connection to background storage.
                    BackgroundScript.history_graph.createNewConnection(source, target);
                }
            }

            // Insert url into array.
            history[key] = target;
        },

        /**
         * Function handling tab closing. Called from event handler.
         * [Official Google documentation]{@link https://developer.chrome.com/extensions/tabs#event-onRemoved}
         * @param tabId {int} The id of the closed tab.
         * @param removeInfo {object} The information about the closed tab.
         */
        onTabClosed: function (tabId, removeInfo) {
            var key = tabId + "_" + removeInfo.windowId;
            delete BackgroundScript.history_graph.currentTabUrls[key];
        }
    },

    tools: {
        /**
         * Sends object to all content scripts, and allows setting a callback function.
         * @param obj {object} The object to be sent.
         * @param [tabID] {int} The ID of the tab. If not specified, message sent to all tabs.
         */
        sendMessage: function (obj, tabID) { // FIXME not working when tab id is specified.
            console.log("Sending message:" + obj);
            chrome.tabs.query({}, function (tabs) {
                var i = tabID || 0;
                for (; i < tabs.length; ++i) {
                    chrome.tabs.sendMessage(tabs[i].id, obj);

                    if (tabID !== undefined) { // If tab id specified do not broadcast.
                        break;
                    }
                }
            });
        },

        /**
         * The callback method triggered by a message received event.
         * Further information can be found [Google's official documentation]{@link https://developer.chrome.com/extensions/runtime#event-onMessage}
         * @param request {object} The message.
         * @param sender {MessageSender} The sender of the message.
         */
        receiveMessage: function (request, sender) {
            if (!request.type) {
                console.log('Invalid request received by extension - type field not specified.');
                return;
            }

            // Forward data to respective handler.
            var data = request.data;

            // Pythonic map replacement for switch-case.
            BackgroundScript.messageMap[request.type](data);
        }
    }
};

(function () {
    // Maps incoming request types to handler functions.
    BackgroundScript.messageMap = {};
    BackgroundScript.messageMap[HISTORY_INIT_DATA] = BackgroundScript.history_graph.onInitHistory;
    BackgroundScript.messageMap[QUOTE_INIT_DATA] = BackgroundScript.quote_graph.sendAllQuotes;
    BackgroundScript.messageMap[QUOTE_UPDATE] = BackgroundScript.quote_graph.onQuoteUpdate;
    BackgroundScript.messageMap[QUOTE_DELETED] = BackgroundScript.quote_graph.onQuoteDeleted;
    BackgroundScript.messageMap[QUOTE_LOCATION_UPDATE] = BackgroundScript.quote_graph.onQuoteLocationUpdate;
    BackgroundScript.messageMap[QUOTE_CONNECTION_UPDATE] = BackgroundScript.quote_graph.onQuoteConnectionUpdate;
    BackgroundScript.messageMap[QUOTE_CONNECTION_DELETED] = BackgroundScript.quote_graph.onQuoteConnectionDeleted;
    BackgroundScript.messageMap[QUOTE_TITLE_CHANGED] = BackgroundScript.quote_graph.onQuoteTitleChanged;
})
();

// Message end point.
chrome.runtime.onMessage.addListener(
    BackgroundScript.tools.receiveMessage
);

chrome.tabs.onUpdated.addListener(
    BackgroundScript.history_graph.onTabChange
);
chrome.tabs.onRemoved.addListener(
    BackgroundScript.history_graph.onTabClosed
);
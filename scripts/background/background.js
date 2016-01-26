/**
 * Created by Robin Nabel on 03/11/15.
 */

var BackgroundScript = {
    quote_graph: {
        // The variable which holds content for the left pane to display
        savedText: {},
        uuidToUrlMap: {},
        // Method used to handle the creation of a snippet. Is handed the data sent from the content script.
        newSnippetHandler: function (object) {
            var uuid = guid();
            addLeftNode(uuid, object);
        },
        addLeftNode: function (uuid, node) {
            // Add node to node map.
            savedText[uuid] = node;

            // Add url to UUID map.
            var li = uuidToUrlMap[node.url];

            //  Check if it contains the url already.
            if (li !== undefined) {
                // Extend the list of UUIDs it.
                li.push(uuid);

            } else {
                uuidToUrlMap[node.url] = [uuid];
            }

        }
    },

    history_graph: {
        history: new HistoryStorage(),
        currentTabUrls: {},

        /**
         * Sends entire history to the specified tab.
         * @param tabId
         */
        sendEntireHistory: function (tabId) {
            var message = {
                deliver_to : HISTORY_ID,
                type: HISTORY_INIT_DATA,
                data: BackgroundScript.history_graph.history
            };
            //BackgroundScript.tools.sendMessage(message, tabId); FIXME not sending to correct tab when tab id is specified.
            BackgroundScript.tools.sendMessage(message);
        },

        /**
         * Creates new connection.
         * @param source {string} - The URL (or id) of the source page.
         * @param target {string} - The URL (or id) of the target page.
         */
        createNewConnection: function (source, target) {
            // Check if history contains both source and target.
            var history = BackgroundScript.history_graph.history,
                src = history.findRecord(source),
                tar = history.findRecord(target);

            if (!src) { // Create records if not existent.
                src = new HistoryRecord(source,
                    BackgroundScript.tools.timestamp());
                history.addRecord(src);
            }
            if (!tar) {
                tar = new HistoryRecord(target,
                    BackgroundScript.tools.timestamp());
                history.addRecord(tar);
            }

            src.addChild(target);
            tar.addParent(source);

            // Notify all content scripts to update graph as necessary.
            BackgroundScript.history_graph.notifyHistoryUpdate(source, target);
        },

        /**
         * Creates the object to be sent to all content scripts.
         * @param source
         * @param target
         */
        notifyHistoryUpdate: function (source, target) {
            var message = {
                deliver_to: HISTORY_ID,
                source: source,
                target: target,
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
            var windowId = tab.windowId,
                key = tabId + '_' + windowId,
                history = BackgroundScript.history_graph.currentTabUrls;
            // Check if tab is registered.
            if (key in history) {
                if (history[key] == (changeInfo.url || tab.url)) {
                    //console.log("URL of " + key + " was already in history.")
                } else {
                    // Add new connection to background storage.
                    var target = tab.url;
                    var source = history[key];
                    //console.log("URL transition " + source + " -> " + target + " was added.");
                    BackgroundScript.history_graph.createNewConnection(source, target);
                }
            } else {
                //console.log("Inserted new history record. key:" + key + " tURL:" + tab.url + "\n\tciURL:" + changeInfo.url);
            }

            // Insert url into array.
            history[key] = tab.url;
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
         * @param sendResponse {function} The function to be used to deliver a response.
         *
         */
        receiveMessage: function (request, sender, sendResponse) {
            if (!request.type) {
                console.log('Invalid request received by extension - type field not specified.');
                return;
            }

            // Forward data to respective handler.
            switch (request.type) {
                case HISTORY_INIT_DATA: // A new tab was opened and requires the entire history data set.
                    BackgroundScript.history_graph.sendEntireHistory(sender.tab.id);
                    break;
            }
        }
    }
};

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
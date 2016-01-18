/**
 * Created by rn30 on 03/11/15.
 */

// ----- Code relevant to the right pane. -----
var BackgroundScript = {
    history: {},

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
        createNewConnection: function (source, target) {
            // Add connection to source website.
            if (history.hasOwnProperty(source)) {
                var source_hist = history[source];
                if (source_hist.hasOwnProperty(target)) {
                    source_hist[target]++;
                } else {
                    source_hist[target] = 1;
                }
            }
            if (history.hasOwnProperty(target)) {
                var target_hist = history[target];
                if (target_hist.hasOwnProperty(source)) {
                    target_hist[source]++;
                } else {
                    target_hist[source] = 1;
                }
            }
        },
        onTabChange: function (tabId, changeInfo, tab) {
            console.log(tabId);
            console.log(changeInfo);
            console.log(tab);
        }
    },

    tools: {
        // UUID generator, used to create indices for the text nodes.
        guid: function guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }
    }


};


// Message end point.
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (!request.type) {
            console.log('Invalid request received by extension - type field not specified.');
            return;
        }
        // Delete unnecessary data fields.
        delete request.type;

        // Forward data to respective handler.
        switch (request.type) {
            case 'new_snippet': // A new element was dragged onto the left pane.
                newSnippetHandler(request);
                break;
        }
    });

chrome.tabs.onUpdated.addListener(
    BackgroundScript.history_graph.onTabChange
);
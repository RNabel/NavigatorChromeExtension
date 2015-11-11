/**
 * Created by rn30 on 03/11/15.
 */

// ----- Code relevant to the right pane. -----
var history = {};


// ----- Code relevant to the left pane. -----
// The variable which holds content for the left pane to display
var savedText = {};
var uuidToUrlMap = {};

// UUID generator, used to create indices for the text nodes.
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

// ---- Code for left-hand pane. ----

// Method used to handle the creation of a snippet. Is handed the data sent from the content script.
function newSnippetHandler(object) {
    var uuid = guid();
    addLeftNode(uuid, object);
}

function addLeftNode(uuid, node) {
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

// Message end point.
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (!request.type) {
            console.log("Invalid request received by extension - type field not specified.");
            return;
        }
        // Delete unnecessary data fields.
        delete request.type;

        // Forward data to respective handler.
        switch (request.type) {
            case "new_snippet": // A new element was dragged onto the left pane.
                newSnippetHandler(request); break;
        }
    });


// ----- Functions used for shared and miscellaneous actions -----

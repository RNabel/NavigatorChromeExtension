/**
 * Created by rn30 on 03/11/15.
 */

// ----- Code relevant to the right pane -----
var history = {};


// ----- Code relevant to the left pane -----
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

// Add element to the context menu.
chrome.contextMenus.create({
    "title": "Buzz This",
    "contexts": ["page", "selection", "image", "link"],
    "onclick": contextMenuHandler
});

function contextMenuHandler(data) {
    console.log("Context Menu clicked.");
    console.log(data.selectionText);

    var selectedText = data.selectionText;
    var url = data.pageUrl;

    var node = createNode(selectedText, url, null);

    var uuid = guid();

    // TODO ensure UUID is not already contained.

    addLeftNode(uuid, node);
}

function createNode(text, url, connections) {
    return {
        text: text,
        url: url,
        connections: connections
    };
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


// ----- Functions used for shared and miscellaneous actions -----

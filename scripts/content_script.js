/**
 * Created by Robin Nabel on 30/10/2015.
 */
var leftPaneIdentifier = "leftPane";
var leftPaneSelector = "#" + leftPaneIdentifier;
var rightPaneIdentifier = "rightPane";
var rightPaneSelector = "#" + rightPaneIdentifier;



// --- General functionality. ---
// Adapted from: http://stackoverflow.com/questions/14290428/how-can-a-chrome-extension-add-a-floating-bar-at-the-bottom-of-pages
function addSidePanes(leftPaneSize, rightPaneSize) {
    var right = $('<div id="' + rightPaneIdentifier + '"></div>');
    var left = $('<div id="' + leftPaneIdentifier + '"></div>');

    function addStyle(el, isLeft) {
        el.css({
            'position': 'fixed',
            'top': '0px',
            'height': '100%',
            'background': 'white',
            'z-index': '999999',
            'background-color': '#FAFAFA'
        });
        if (isLeft) {
            el.css({
                'left': '0px',
                'box-shadow': 'inset 0 0 1em black',
                'width': leftPaneSize
            });
        } else {
            el.css({
                'right': '0px',
                'box-shadow': 'inset 0 0 1em black',
                'width': rightPaneSize
            });
        }
    }

    // Initialize the tree.
    initGraph();

    addStyle(left, true);
    addStyle(right, false);

    // Add the panes to the document.
    $(document.body).append(left);
    $(document.body).append(right);
}

function resizeContent(contentSize, $contentDiv) {
    // Resize body content. Potential issues relate to the
    $contentDiv.width(contentSize);
    $contentDiv.css('margin-left', '20%');
    $contentDiv.css('position', 'absolute');
}
function wrapOriginalContentInDiv() {
    // Get content of body tag.
    var $cont = $(document.body).children();

    // Add content to new div element.
    var $div = $('<div>');
    $div.attr('id', 'content'); // TODO create UNIQUE id. Could use hash function.
    $div.append($cont);

    // Append new div to body.
    var $bod = $(document.body);
    $bod.append($div);

    return $div;
}
function entryPoint() {
    console.log("Entered entry point.");
    var $contentDiv = wrapOriginalContentInDiv();

    var leftContentPaneSize = '20%';
    var rightContentPaneSize = '20%';

    var contentSize = (100 - parseFloat(leftContentPaneSize) - parseFloat(rightContentPaneSize)) + "%";

    resizeContent(contentSize, $contentDiv);

    addSidePanes(leftContentPaneSize, rightContentPaneSize); // TODO add to func signature.
    setUpLeftPanel();
}

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function slideInSidePanes() {

}


// --- Functionality of left pane. ---
function setUpLeftPanel() {
    // Add the drop listeners.
    $(leftPaneSelector).on('drop', drop);
    $(leftPaneSelector).on('dragover', allowDrop);
    $('#content').on('dragstart', startDrag);

    // Event listener for drag; required to find the origin of the drag.
    function startDrag(ev) {
        var path = $(ev.originalEvent.path[1]).getPath(); // TODO update code to be resilient.
        ev.originalEvent.dataTransfer.setData('src', path);
    }

    // Event listeners for drop methods.
    function allowDrop(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    function drop(ev) {
        ev.preventDefault();

        var url = window.location.href;
        var text = ev.originalEvent.dataTransfer.getData("text/plain");
        var html_data = ev.originalEvent.dataTransfer.getData("text/html");
        var source_selector = ev.originalEvent.dataTransfer.getData("src");

        setUpInfoBubble(text, html_data, url, source_selector);
    }
}

// Function which adds a text bubble to the left pane.
// dataTransfer - the object passed by the drop event.
// originUrl - the origin url of the dropped element.
function setUpInfoBubble(text, html_text, origin_url, source_selector) {
    console.log("Create new data bubble called with text:\n" + text);

    // Send data to the backend to store.
    var obj_to_send = {
        type: "new_snippet",
        text: text,
        html: html_text,
        url: origin_url,
        selector: source_selector
    };

    // Send data to backing store.
    sendMessage(obj_to_send);

    var $box = createQuoteBox(origin_url);
    $box.text(text);

    // TODO set location of box.

    $(leftPaneSelector).append($box);
    // TODO scroll to element. http://stackoverflow.com/a/9272017/3918512
}

function createQuoteBox(url) {
    // Add text box to left pane.
    var $quoteBox = $('<div onclick="window.open(\'' + url + '\', \'_self\');">').css({
        'background-color': 'white',
        width: 100,
        height: 60,
        border: '1px solid #eee',
        'margin-left': '5%', 'margin-top': '30%'
    });

    var quoteUrl = chrome.extension.getURL('assets/quotes.svg');
    $quoteBox.append($('<img>').attr('src', quoteUrl).attr('width', '7%').css('margin', '1px 1px'));
    $quoteBox.append($('<p>').attr('id', 'quoteContent'));

    return $quoteBox;
}

// ---- Functionality of right hand pane. ----
function initGraph() {
    // TODO fetch data from backend.
    // Add placeholder to right sidepane.
    var picUrl = chrome.extension.getURL('assets/tree.png');
    $(rightPaneSelector).append($('<img>').attr('src', picUrl).attr('width', '90%%').css('margin', '5% 5%'));


}

// ---- Miscellaneous functionality. ----
// Extend jQuery to be able to generate XPaths from JQuery object.
jQuery.fn.getPath = function () {
    if (this.length != 1) throw 'Requires one element.';

    var path, node = this;
    while (node.length) {
        var realNode = node[0], name = realNode.localName;
        if (!name) break;
        name = name.toLowerCase();

        var parent = node.parent();

        var siblings = parent.children(name);
        if (siblings.length > 1) {
            name += ':eq(' + siblings.index(realNode) + ')';
        }

        path = name + (path ? '>' + path : '');
        node = parent;
    }

    return path;
};


// Message end-point.
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (sender.tab && request.text) {
            console.log("Request from tab");

            // Message sent from context menu handler; returns the text currently highlighted on the page.
            if (request.text == "get_highlighted_text") {
                return sendResponse(getSelectionText());
            }

        } else if (request.text) {

        }
    });
function sendMessage(msgObj, responseHandler) {
    if (responseHandler === undefined) {
        responseHandler = function () {};
    }
    chrome.runtime.sendMessage(msgObj, responseHandler);
}
// Message sender.


$(document).ready(entryPoint);

console.log("Finished running the file.");
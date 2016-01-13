/**
 * Created by Robin Nabel on 30/10/2015.
 */
var leftPaneIdentifier = 'leftPane';
var leftPaneSelector = '#' + leftPaneIdentifier;
var rightPaneIdentifier = 'rightPane';
var rightPaneSelector = '#' + rightPaneIdentifier;



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
    console.log('Entered entry point.');
    var $contentDiv = wrapOriginalContentInDiv();

    var leftContentPaneSize = '20%';
    var rightContentPaneSize = '20%';

    var contentSize = (100 - parseFloat(leftContentPaneSize) - parseFloat(rightContentPaneSize)) + '%';

    resizeContent(contentSize, $contentDiv);

    addSidePanes(leftContentPaneSize, rightContentPaneSize); // TODO add to func signature.
    setUpLeftPanel();
}

function getSelectionText() {
    var text = '';
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != 'Control') {
        text = document.selection.createRange().text;
    }
    return text;
}

function slideInSidePanes() {

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
            console.log('Request from tab');

            // Message sent from context menu handler; returns the text currently highlighted on the page.
            if (request.text == 'get_highlighted_text') {
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

console.log('Finished running the file.');
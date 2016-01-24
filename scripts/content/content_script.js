/**
 * Created by Robin Nabel on 30/10/2015.
 */

var ContentScript = {
    history_graph: undefined,
    quote_graph: undefined,

    /**
     * Function which sets up the page.
     */
    init: function () {
        console.log('Entered entry point.');
        var $contentDiv = ContentScript.setup.wrapOriginalContentInDiv();

        var leftContentPaneSize = '20%';
        var rightContentPaneSize = '20%';

        var contentSize = (100 - parseFloat(leftContentPaneSize) - parseFloat(rightContentPaneSize)) + '%';

        ContentScript.setup.resizeContent(contentSize, $contentDiv);

        ContentScript.setup.addSidePanes(leftContentPaneSize, rightContentPaneSize); // TODO add to func signature.
    },

    setup: {
        /**
         * Sets up the panes displaying the history and quote graph.
         * Adapted from: [link]{http://stackoverflow.com/questions/14290428/how-can-a-chrome-extension-add-a-floating-bar-at-the-bottom-of-pages}
         *
         * @param leftPaneSize
         * @param rightPaneSize
         */
        // TODO update the constants, check that it works, and morphe the contents of the setup into the respective constructors.
        addSidePanes: function (leftPaneSize, rightPaneSize) {
            var right = $('<div id="' + RIGHT_PANE_IDENTIFIER + '"></div>');
            var left = $('<div class="drag-drop-demo" id="' + LEFT_PANE_IDENTIFIER + '"><div class="jtk-demo-canvas canvas-wide drag-drop-demo jtk-surface jtk-surface-nopan"></div></div></div>');

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

            addStyle(left, true);
            addStyle(right, false);

            // Add the panes to the document.
            $(document.body).append(left);
            $(document.body).append(right);

            // Initialize the history graph.
            console.log("Setting up History Graph");
            ContentScript.history_graph = new HistoryGraph();
            console.log("History Graph finished.");

            // Initialize the quote graph.
            console.log("Setting up Quote Graph.");
            QuoteGraph.init();
            ContentScript.quote_graph = QuoteGraph;
            console.log("Quote Graph finished.")
        },

        resizeContent: function (contentSize, $contentDiv) {
            // Resize body content. Potential issues relate to the
            $contentDiv.width(contentSize);
            $contentDiv.css('margin-left', '20%');
            $contentDiv.css('position', 'absolute');
        },

        wrapOriginalContentInDiv: function () {
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
        },

        getSelectionText: function () {
            var text = '';
            if (window.getSelection) {
                text = window.getSelection().toString();
            } else if (document.selection && document.selection.type != 'Control') {
                text = document.selection.createRange().text;
            }
            return text;
        }


    },

    tools: {
        receiveMessages: function (request, sender, sendResponse) {
            if (sender.tab) { // Sent from other tab.

            } else { // Sent from extension.
                switch (request.type) {
                    case "history_update":
                        console.log("History update.");
                        break;
                    default:
                        console.log("received message." + request);
                }
            }
        },

        sendMessage: function (msgObj, responseHandler) {
            if (responseHandler === undefined) {
                responseHandler = function () {
                };
            }
            chrome.runtime.sendMessage(msgObj, responseHandler);
        }

    }
};

chrome.runtime.onMessage.addListener(
    ContentScript.tools.receiveMessages
);

/**
 * Extend jQuery to be able to generate XPaths from JQuery object.
 * Needed to accurately store where dragged & dropped text originated from.
 */
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

$(document).ready(ContentScript.init);
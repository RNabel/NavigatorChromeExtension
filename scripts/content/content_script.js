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

        var contentSize = (100 - parseFloat(QUOTE_PANE_WIDTH) - parseFloat(HISTORY_PANE_WIDTH)) + '%';

        ContentScript.setup.resizeContent(contentSize, $contentDiv);

        ContentScript.setup.addSidePanes();
    },

    setup: {
        /**
         * Sets up the panes displaying the history and quote graph.
         * Adapted from: [link]{http://stackoverflow.com/questions/14290428/how-can-a-chrome-extension-add-a-floating-bar-at-the-bottom-of-pages}
         *
         */
        addSidePanes: function () {
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
                        'width': QUOTE_PANE_WIDTH
                    });
                } else {
                    el.css({
                        'right': '0px',
                        'box-shadow': 'inset 0 0 1em black',
                        'width': HISTORY_PANE_WIDTH
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
            ContentScript.history_graph = HistoryGraph;
            ContentScript.history_graph.sendMessage = ContentScript.tools.sendMessage;
            ContentScript.history_graph.init();
            console.log("History Graph finished.");

            // Initialize the quote graph and attach message handlers.
            console.log("Setting up Quote Graph.");
            QuoteGraph.sendMessage = ContentScript.tools.sendMessage;

            ContentScript.quote_graph = QuoteGraph;
            (function () {
                jsPlumb.ready(QuoteGraph.init);
            })();
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
            var i = 0;

            // Ensure unique ID for website wrapper.
            var contentId = WEBSITE_CONTENT_WRAPPER_ID;
            while ($("#" + contentId).length) {
                 i++;
                contentId = WEBSITE_CONTENT_WRAPPER_ID + i;
            }
            WEBSITE_CONTENT_WRAPPER_ID = contentId;

            $div.attr('id', 'content');
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
            var sentFromExt = !(sender.tab == undefined);

            if (request.deliver_to) {
                switch (request.deliver_to) {
                    case HISTORY_ID:
                        ContentScript.history_graph.tools.messageHandler(request, sender, sendResponse, sentFromExt);
                        break;

                    case QUOTE_ID:
                        ContentScript.quote_graph.tools.messageHandler(request, sender, sendResponse, sentFromExt);
                        break;

                    default:
                        console.log("CONTENT_SCRIPT: Unknown deliver_to value: " + request.deliver_to);
                        break;
                }
            } else {
                console.log("CONTENT_SCRIPT: Received malformed request.");
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
/**
 * Created by Robin Nabel on 30/10/2015.
 */

/**
 * @exports ContentScript
 * @namespace ContentScript
 */
var ContentScript = {
    history_graph: {},
    quote_graph: {},

    /**
     * Set up page.
     */
    init: function () {
        console.log('Entered entry point.');
        var $contentDiv = $(document.body);

        ContentScript.setup.resizeAndPositionContent($contentDiv);

        ContentScript.setup.addSidePanes();

        // Add css files.
        $('head')
            .append('<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons">');
    },

    /**
     * @memberOf ContentScript
     * @namespace ContentScript.setup
     */
    setup: {
        /**
         * Set up the panes displaying the history and quote graph.
         * Adapted from: [link]{@link http://stackoverflow.com/questions/14290428/how-can-a-chrome-extension-add-a-floating-bar-at-the-bottom-of-pages}
         */
        addSidePanes: function () {
            var right = $('<div class="container-container hist-container" style="z-index: ' + Z_INDEX_BACKGROUND + '">\n    <i data-position="left" data-delay="50" data-tooltip="Fullscreen" class="material-icons no-select fullscreen tooltipped ' + HIST_MAXIMIZE_CLASS + '">fullscreen</i>\n    <i data-position="left" data-delay="50" data-tooltip="Collapse" class="material-icons no-select tooltipped ' + HIST_COLLAPSE_CLASS + '">expand_more</i>\n    <div id="' + RIGHT_PANE_IDENTIFIER + '" class="container-1">\n    </div>\n</div>');
            var left = $('<div class="quote-container container-container bigpicture-container" mag-thumb="drag" style="z-index: ' + Z_INDEX_BACKGROUND + '">\n    <i data-position="left" data-delay="50" data-tooltip="Fullscreen" class="material-icons no-select fullscreen tooltipped ' + QUOTE_MAXIMIZE_CLASS + '">fullscreen</i>\n    <i data-position="right" data-delay="50" data-tooltip="Collapse" class="material-icons no-select tooltipped ' + QUOTE_COLLAPSE_CLASS + '">chevron_left</i>\n    <div class="drag-drop-demo bigpicture" data-x="721" data-y="480" data-zoom="1" id="' + LEFT_PANE_IDENTIFIER + '" style="color:transparent">\n        <div class="jtk-demo-canvas canvas-wi de drag-drop-demo jtk-surface"></div>\n    </div>\n</div>');

            function addStyle(el, isLeft) {
                if (isLeft) {
                    // Wrapping element.
                    el.css({
                        'height': 100 - HISTORY_PANE_HEIGHT_ABS + '%',
                        'bottom': HISTORY_PANE_HEIGHT,
                        'width': QUOTE_PANE_WIDTH
                    });

                    $('.container', el).css({
                        height: 210 / QUOTE_GRAPH_MIN_SCALE + "%",
                        width: 210 / QUOTE_GRAPH_MIN_SCALE + "%"
                    });
                } else {
                    el.css({
                        'height': HISTORY_PANE_HEIGHT
                    });
                }
            }

            addStyle(left, true);
            addStyle(right, false);

            // Add the panes to the document.
            $(document.documentElement).append(left);
            $(document.documentElement).append(right);

            // Initialize the history graph.
            ContentScript.history_graph = HistoryGraph;
            ContentScript.history_graph.sendMessage = ContentScript.tools.sendMessage;
            ContentScript.history_graph.init();

            // Initialize the quote graph and attach message handlers.
            QuoteGraph.sendMessage = ContentScript.tools.sendMessage;

            ContentScript.quote_graph = QuoteGraph;
            (function () {
                jsPlumb.ready(QuoteGraph.init);
            })();

            ContentScript.setup.addEventListenersToMaximizers();
        },

        /**
         * Resize and position the original content of the page.
         * @param $contentDiv {jQuery | HTMLElement} The wrapper of the original page content.
         */
        resizeAndPositionContent: function ($contentDiv) {
            // Resize body content. Potential issues relate to the
            var width = 100 - QUOTE_PANE_WIDTH_ABS;

            $contentDiv
                .css('margin-left', QUOTE_PANE_WIDTH)
                .css('margin-bottom', HISTORY_PANE_HEIGHT)
                .css('width', width + '%')
                .css('position', 'absolute');
        },

        /**
         * Add the requires event listeners to the fullscreen and minimize images.
         */
        addEventListenersToMaximizers: function () {
            $('.' + QUOTE_MAXIMIZE_CLASS).bind('click', function () {
                // Get current state.
                var $maximizer = $('.' + QUOTE_MAXIMIZE_CLASS);
                var isMaximized = $maximizer.text() == 'fullscreen_exit';

                // Update z-index of container pane.
                var newZIndex = isMaximized ? Z_INDEX_BACKGROUND : Z_INDEX_FOREGROUND;
                var $parent = $('div:has(> ' + LEFT_PANE_SELECTOR + ')');
                $parent.css({
                    'z-index': newZIndex
                });

                // Update size.
                if (isMaximized) {
                    $parent.css({
                        height: (100 - HISTORY_PANE_HEIGHT_ABS) + '%',
                        width: QUOTE_PANE_WIDTH
                    })
                } else {
                    $parent.css({
                        height: '100%',
                        width: '100%'
                    })
                }

                // Update maximizer icon.
                var newIcon = isMaximized ? 'fullscreen' : 'fullscreen_exit';
                $maximizer.text(newIcon);
                $maximizer.attr('data-tooltip', isMaximized ? 'Fullscreen' : 'End fullscreen')
            });
            $('.' + HIST_MAXIMIZE_CLASS).bind('click', function () {
                // Get current state.
                var $maximizer = $('.' + HIST_MAXIMIZE_CLASS);
                var isMaximized = $maximizer.text() == 'fullscreen_exit';

                // Update z-index of container pane.
                var newZIndex = isMaximized ? Z_INDEX_BACKGROUND : Z_INDEX_FOREGROUND;
                var $parent = $('div:has(> ' + RIGHT_PANE_SELECTOR + ')');
                $parent.css({
                    'z-index': newZIndex
                });

                // Update size.
                if (isMaximized) {
                    $parent.css({
                        height: HISTORY_PANE_HEIGHT,
                        width: '100%'
                    });
                    $('.history_entry').css('height', HIST_HEIGHT_SMALL);
                } else {
                    $parent.css({
                        height: '100%',
                        width: '100%'
                    });
                    $('.history_entry').css('height', HIST_HEIGHT_FULLSCREEN);
                }

                // Update maximizer icon.
                var newIcon = isMaximized ? 'fullscreen' : 'fullscreen_exit';
                $maximizer.text(newIcon);
                $maximizer.attr('data-tooltip', isMaximized ? 'Fullscreen' : 'End fullscreen')
            });
        }

    },

    /**
     * @memberOf ContentScript
     * @namespace ContentScript.tools
     */
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
        },

        /**
         * Extract text which is currently selected.
         * @returns {string} The selected text.
         */
        getSelectionText: function () {
            var text = '';
            if (window.getSelection) {
                text = window.getSelection().toString();
            } else if (document.selection && document.selection.type != 'Control') {
                text = document.selection.createRange().text;
            }
            return text;
        },

        /**
         * Change zoom of specific jsPlumb instance.
         * @param zoom {!number} The level of zoom, decimal where 1 equates to 100%.
         * @param instance {!jsPlumbInstance} The instance which for which to change the zoom level.
         * @param [transformOrigin] {number[]} 2-element array which contains the origin of the transformation,
         *                                     defaults to [0.5, 0.5].
         * @param [el] {HTMLElement} The parent element of all objects to be zoomed, defaults to the container
         *                           of the jsPlumb instance.
         */
        zoom: function (zoom, instance, transformOrigin, el) {
            transformOrigin = transformOrigin || [0.5, 0.5];
            instance = instance || jsPlumb;
            el = el || instance.getContainer();
            var p = ["webkit", "moz", "ms", "o"],
                s = "scale(" + zoom + ")",
                oString = (transformOrigin[0] * 100) + "% " + (transformOrigin[1] * 100) + "%";

            for (var i = 0; i < p.length; i++) {
                el.style[p[i] + "Transform"] = s;
                el.style[p[i] + "TransformOrigin"] = oString;
            }

            el.style["transform"] = s;
            el.style["transformOrigin"] = oString;

            instance.setZoom(zoom);
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
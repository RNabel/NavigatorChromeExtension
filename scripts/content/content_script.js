/**
 * Created by Robin Nabel on 30/10/2015.
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

    setup: {
        /**
         * Set up the panes displaying the history and quote graph.
         * Adapted from: [link]{@link http://stackoverflow.com/questions/14290428/how-can-a-chrome-extension-add-a-floating-bar-at-the-bottom-of-pages}
         */
        addSidePanes: function () {
            var right = $('<div class="container-container hist-container" style="z-index: ' + Z_INDEX_BACKGROUND + '">\n    <i data-position="left" data-delay="50" data-tooltip="Fullscreen" class="material-icons no-select fullscreen tooltipped ' + HIST_MAXIMIZE_CLASS + '">fullscreen</i>\n    <i data-position="left" data-delay="50" data-tooltip="Collapse" class="material-icons no-select tooltipped ' + HIST_COLLAPSE_CLASS + '">expand_more</i>\n    <div id="' + RIGHT_PANE_IDENTIFIER + '" class="container-1">\n    </div>\n</div>');
            var left = $('<div class="quote-container container-container bigpicture-container" mag-thumb="drag" style="z-index: ' + Z_INDEX_BACKGROUND + '">\n    <i data-position="left" data-delay="50" data-tooltip="Fullscreen" class="material-icons no-select fullscreen tooltipped ' + QUOTE_MAXIMIZE_CLASS + '">fullscreen</i>\n    <i data-position="right" data-delay="50" data-tooltip="Collapse" class="material-icons no-select tooltipped ' + QUOTE_COLLAPSE_CLASS + '">chevron_left</i>\n    <div class="container drag-drop-demo bigpicture" id="' + LEFT_PANE_IDENTIFIER + '" style="color:transparent">\n        <div class="jtk-demo-canvas canvas-wi de drag-drop-demo jtk-surface"></div>\n    </div>\n</div>');

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

            // Run bigpicture.js.
            ContentScript.setup.instantiateBigPicture();

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
        },

        instantiateBigPicture: function () {
            ContentScript.bigpicture = (function () {
                "use strict";

                /*
                 * INITIALIZATION
                 */

                var bpContainer = $('.bigpicture-container'),
                    bp = $('.bigpicture');

                if (!bp) {
                    return;
                }

                bp.attr('spellcheck', false);

                var params = {x: getQueryVariable('x'), y: getQueryVariable('y'), zoom: getQueryVariable('zoom')};

                var current = {};
                current.x = params.x ? parseFloat(params.x) : $(bp).data('x');
                current.y = params.y ? parseFloat(params.y) : $(bp).data('y');
                current.zoom = params.zoom ? parseFloat(params.zoom) : $(bp).data('zoom');

                bp.x = 0;
                bp.y = 0;
                bp.updateContainerPosition = function () {
                    bp.css({
                        'left': bp.x + 'px',
                        'top': bp.y + 'px'
                    });
                    //bp.style.left = bp.x + 'px';
                    //bp.style.top = bp.y + 'px';
                };

                /*
                 * TEXT BOXES
                 */

                $(".text").each(function () {
                    updateTextPosition(this);
                });     // initialization

                $(bp).on('blur', '.text', function () {
                    if ($(this).text().replace(/^\s+|\s+$/g, '') === '') {
                        $(this).remove();
                    }
                });

                $(bp).on('input', '.text', function () {
                    redoSearch = true;
                });

                /**
                 * Updates position of passed element relative to parent.
                 * @param e {jQuery}
                 */
                function updateTextPosition(e) {
                    if (!(e instanceof jQuery)) {
                        e = $(e);
                    }

                    e.css({
                        'font-size': e.data("size") / current.zoom + 'px',
                        'left': (e.data("x") - current.x) / current.zoom - bp.x + 'px',
                        'top': (e.data("y") - current.y) / current.zoom - bp.y + 'px'
                    });

                }

                /**
                 * Saves the position of an element after drag event. Inverted action to updateTextPosition.
                 * @param e {jQuery} The element whose position is to be saved.
                 */
                function saveElementPosition(e) {
                    // Calculate x and y.
                    console.log("save position");

                    // TRY 1:
                    var left = e.css('left');
                    var top = e.css('top');
                    //var xDat = (left + bp.x) * current.zoom + current.x;
                    //var yDat = (top + bp.y) * current.zoom + current.y;

                    // TRY 2:
                    var x = current.x + (left) * current.zoom,
                        y = current.y + (top) * current.zoom,
                        size = 20 * current.zoom;

                    e.data('x', x);
                    e.data('y', y);
                    updateTextPosition(e);
                }

                function newText(x, y, size, text) {
                    var tb = $('<div class="card tiny text draggable" style="border: thin solid;">\n    <div class="card-content">\n    </div>\n</div>');
                    var content = $('.card-content', tb);
                    //var tb = document.createElement('div');
                    content.attr('contenteditable', true);
                    content.text(text || "Hello");

                    $(tb).data("x", x).data("y", y).data("size", size);
                    updateTextPosition(tb);
                    bp.append(tb);

                    return tb;
                }

                bpContainer.click(function (e) {
                    e = e.originalEvent;
                    if (isContainedByClass(e.target, 'text')) {
                        return;
                    }
                    //newText(current.x + (e.clientX) * current.zoom, current.y + (e.clientY) * current.zoom, 20 * current.zoom, '').focus();
                });

                /*
                 * PAN AND MOVE
                 */

                var movingText = null,
                    dragging = false,
                    previousMousePosition;

                bpContainer.mousedown(function (e) {
                    var target = $(e.target);


                    e = e.originalEvent;
                    if ((target.hasClass('text') && (e.ctrlKey || e.metaKey)) ||
                        target.hasClass('draggable')) {

                        movingText = $(e.target);
                        movingText.addClass("noselect notransition");

                    } else {
                        movingText = null;
                        dragging = true;
                    }
                    biggestPictureSeen = false;
                    previousMousePosition = {x: e.pageX, y: e.pageY};
                });

                var mouseUpHandler = function () {
                    dragging = false;

                    if (movingText) {
                        $(movingText).addClass("text");
                        $(movingText).removeClass("noselect notransition");
                    }
                    movingText = null;
                };
                window.onmouseup = mouseUpHandler;

                bpContainer.on('dragstart', function (e) {
                    e.originalEvent.preventDefault();
                });

                bpContainer.mousemove(function (e) {
                    e = e.originalEvent;
                    if (dragging && !e.shiftKey) {       // SHIFT prevents panning / allows selection
                        bp.css('transitionDuration', "0s");
                        bp.x += e.pageX - previousMousePosition.x;
                        bp.y += e.pageY - previousMousePosition.y;
                        bp.updateContainerPosition();
                        current.x -= (e.pageX - previousMousePosition.x) * current.zoom;
                        current.y -= (e.pageY - previousMousePosition.y) * current.zoom;
                        previousMousePosition = {x: e.pageX, y: e.pageY};
                    }
                    if (movingText) {
                        $(movingText).data("x", $(movingText).data("x") + (e.pageX - previousMousePosition.x) * current.zoom);
                        $(movingText).data("y", $(movingText).data("y") + (e.pageY - previousMousePosition.y) * current.zoom);
                        updateTextPosition(movingText);
                        previousMousePosition = {x: e.pageX, y: e.pageY};
                    }
                });

                /*
                 * ZOOM
                 */

                bpContainer.dblclick(function (e) {
                    e.preventDefault();
                    // Insert new text.
                    //newText(current.x + (e.screenX) * current.zoom, current.y + (e.screenY) * current.zoom, 20 * current.zoom, '').focus();
                    //newText(current.x + (e.clientX) * current.zoom, current.y + (e.clientY) * current.zoom, 20 * current.zoom, '').focus();
                    var childPos = e.offset();
                    var parentPos = e.parent().offset();
                    var childOffset = {
                        top: childPos.top - parentPos.top,
                        left: childPos.left - parentPos.left
                    };
                    newText(current.x + (childOffset.left) * current.zoom, current.y + (childOffset.top) * current.zoom, 20 * current.zoom, '').focus();
                });

                var biggestPictureSeen = false,
                    previous;

                function onZoom(zoom, wx, wy, sx, sy) {  // zoom on (wx, wy) (world coordinates) which will be placed on (sx, sy) (screen coordinates)
                    wx = (typeof wx === "undefined") ? current.x + bpContainer.innerWidth() / 2 * current.zoom : wx;
                    wy = (typeof wy === "undefined") ? current.y + bpContainer.innerHeight() / 2 * current.zoom : wy;
                    sx = (typeof sx === "undefined") ? bpContainer.innerWidth() / 2 : sx;
                    sy = (typeof sy === "undefined") ? bpContainer.innerHeight() / 2 : sy;

                    bp.css('transitionDuration', "0.2s");

                    bp.x = 0;
                    bp.y = 0;
                    bp.updateContainerPosition();
                    current.x = wx - sx * zoom;
                    current.y = wy - sy * zoom;
                    current.zoom = zoom;

                    $(".text").each(function () {
                        updateTextPosition(this);
                    });

                    biggestPictureSeen = false;
                }

                function zoomOnText(res) {
                    onZoom($(res).data('size') / 20, $(res).data('x'), $(res).data('y'));
                }

                function seeBiggestPicture(e) {
                    e.preventDefault();
                    document.activeElement.blur();
                    function universeboundingrect() {
                        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                        var texteelements = document.getElementsByClassName('text');
                        [].forEach.call(texteelements, function (elt) {
                            var rect2 = elt.getBoundingClientRect();
                            var rect = {
                                left: $(elt).data("x"),
                                top: $(elt).data("y"),
                                right: (rect2.width > 2 && rect2.width < 10000) ? current.x + rect2.right * current.zoom : $(elt).data("x") + 300 * $(elt).data("size") / 20,
                                bottom: (rect2.height > 2 && rect2.height < 10000) ? current.y + rect2.bottom * current.zoom : $(elt).data("y") + 100 * $(elt).data("size") / 20
                            };
                            if (rect.left < minX) {
                                minX = rect.left;
                            }
                            if (rect.right > maxX) {
                                maxX = rect.right;
                            }
                            if (rect.top < minY) {
                                minY = rect.top;
                            }
                            if (rect.bottom > maxY) {
                                maxY = rect.bottom;
                            }
                        });
                        return {minX: minX, maxX: maxX, minY: minY, maxY: maxY};
                    }

                    var texts = document.getElementsByClassName('text');
                    if (texts.length === 0) {
                        return;
                    }
                    if (texts.length === 1) {
                        zoomOnText(texts[0]);
                        return;
                    }

                    if (!biggestPictureSeen) {
                        previous = {x: current.x, y: current.y, zoom: current.zoom};
                        var rect = universeboundingrect();
                        var zoom = Math.max((rect.maxX - rect.minX) / bpContainer.innerWidth(), (rect.maxY - rect.minY) / bpContainer.innerHeight()) * 1.1;
                        onZoom(zoom, (rect.minX + rect.maxX) / 2, (rect.minY + rect.maxY) / 2);
                        biggestPictureSeen = true;
                    }
                    else {
                        onZoom(previous.zoom, previous.x, previous.y, 0, 0);
                        biggestPictureSeen = false;
                    }
                }

                /*
                 * SEARCH
                 */

                var results = {index: -1, elements: [], text: ""},
                    redoSearch = true,
                    query;

                function find(txt) {
                    results = {index: -1, elements: [], text: txt};
                    $(".text").each(function () {
                        if ($(this).text().toLowerCase().indexOf(txt.toLowerCase()) != -1) {
                            results.elements.push(this);
                        }
                    });
                    if (results.elements.length > 0) {
                        results.index = 0;
                    }
                }

                function findNext(txt) {
                    if (!txt || txt.replace(/^\s+|\s+$/g, '') === '') {
                        return;
                    }   // empty search
                    if (results.index == -1 || results.text != txt || redoSearch) {
                        find(txt);
                        if (results.index == -1) {
                            return;
                        }       // still no results
                        redoSearch = false;
                    }
                    var res = results.elements[results.index];
                    zoomOnText(res);
                    results.index += 1;
                    if (results.index == results.elements.length) {
                        results.index = 0;
                    }  // loop
                }

                /*
                 * MOUSEWHEEL
                 */

                var mousewheeldelta = 0,
                    last_e,
                    mousewheeltimer = null,
                    mousewheel;

                if (navigator.appVersion.indexOf("Mac") != -1) {   // Mac OS X
                    mousewheel = function (e) {
                        e = e.originalEvent;
                        e.preventDefault();
                        mousewheeldelta += Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                        last_e = e;
                        if (!mousewheeltimer) {
                            mousewheeltimer = setTimeout(function () {
                                onZoom((mousewheeldelta > 0) ? current.zoom / 1.7 : current.zoom * 1.7, current.x + last_e.clientX * current.zoom, current.y + last_e.clientY * current.zoom, last_e.clientX, last_e.clientY);
                                mousewheeldelta = 0;
                                mousewheeltimer = null;
                            }, 70);
                        }
                    };
                }
                else {
                    mousewheel = function (e) {
                        e = e.originalEvent;
                        e.preventDefault();
                        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                        onZoom((delta > 0) ? current.zoom / 1.7 : current.zoom * 1.7, current.x + e.clientX * current.zoom, current.y + e.clientY * current.zoom, e.clientX, e.clientY);
                    };
                }

                if ("onmousewheel" in document) {
                    bpContainer.on('mousewheel', mousewheel);
                }
                else {
                    bpContainer.addEventListener('DOMMouseScroll', mousewheel, false);
                }

                /*
                 * KEYBOARD SHORTCUTS
                 */

                window.onkeydown = function (e) {
                    if (((e.ctrlKey && !e.altKey || e.metaKey) && (e.keyCode == 61 || e.keyCode == 187 || e.keyCode == 171 || e.keyCode == 107 || e.key == '+' || e.key == '=' ))   // CTRL+PLUS or COMMAND+PLUS
                        || e.keyCode == 34) {   // PAGE DOWN     // !e.altKey to prevent catching of ALT-GR
                        e.preventDefault();
                        onZoom(current.zoom / 1.7);
                        return;
                    }
                    if (((e.ctrlKey && !e.altKey || e.metaKey) && (e.keyCode == 54 || e.keyCode == 189 || e.keyCode == 173 || e.keyCode == 167 || e.keyCode == 109 || e.keyCode == 169 || e.keyCode == 219 || e.key == '-' ))   // CTRL+MINUS or COMMAND+MINUS
                        || e.keyCode == 33) {   // PAGE UP
                        e.preventDefault();
                        onZoom(current.zoom * 1.7);
                        return;
                    }
                    if ((e.ctrlKey && !e.altKey || e.metaKey) && e.keyCode == 70) {         // CTRL+F
                        e.preventDefault();
                        setTimeout(function () {
                            query = window.prompt("What are you looking for?", "");
                            findNext(query);
                        }, 10);
                        return;
                    }
                    if (e.keyCode == 114) {                 // F3
                        e.preventDefault();
                        if (results.index == -1) {
                            setTimeout(function () {
                                query = window.prompt("What are you looking for?", "");
                                findNext(query);
                            }, 10);
                        }
                        else {
                            findNext(query);
                        }
                        return;
                    }
                    if (e.keyCode == 113) {                 // F2
                        e.preventDefault();
                        seeBiggestPicture(e);
                        return;
                    }
                };

                /*
                 * USEFUL FUNCTIONS
                 */

                function isContainedByClass(e, cls) {
                    while (e && e.tagName) {
                        if (e.classList.contains(cls)) {
                            return true;
                        }
                        e = e.parentNode;
                    }
                    return false;
                }

                function getQueryVariable(id) {
                    var params = window.location.search.substring(1).split("&");
                    for (var i = 0; i < params.length; i++) {
                        var p = params[i].split("=");
                        if (p[0] == id) {
                            return p[1];
                        }
                    }
                    return (false);
                }

                /*
                 * API
                 */

                return {
                    newText: newText,
                    current: current,
                    updateTextPosition: updateTextPosition
                };

            })();
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
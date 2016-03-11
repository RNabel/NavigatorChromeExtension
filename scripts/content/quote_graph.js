/**
 * Created by robin on 11/01/16.
 */
function Quote(content, originUrl, location) {
    this.content = content;
    this.originURL = originUrl;
    this.location = location;
}

Quote.prototype.getLocation = function () {
    return this.location;
};

Quote.prototype.setLocation = function (location) {
    this.location = location;
};

var QuoteGraph = {

    quotes: new QuoteStorage(), // List of all quotes in the graph.

    instance: undefined, // Contains the jsPlumb instance.

    endpointTemplate: undefined,

    setup: function () {
        var instance = this.instance,
            endpointTemplate = this.endpointTemplate;
        this.instance = jsPlumb.getInstance({
            DragOptions: {cursor: 'pointer', zIndex: 2000},
            PaintStyle: {strokeStyle: '#666'},
            EndpointHoverStyle: {fillStyle: "orange"},
            HoverPaintStyle: {strokeStyle: "orange"},
            EndpointStyle: {width: 20, height: 16, strokeStyle: '#666'},
            Endpoint: "Rectangle",
            Anchors: ["TopCenter", "TopCenter"],
            Container: LEFT_PANE_IDENTIFIER,
            MaxConnections: 1000
        });
        instance = this.instance;

        // Suspend drawing and initialise.
        this.instance.batch(function () {
            // Configure some drop options for use by all endpoints.
            var exampleDropOptions = {
                tolerance: "touch",
                hoverClass: "dropHover",
                activeClass: "dragActive"
            };

            var endpointColor = "rgba(229,219,61,0.5)";
            this.endpointTemplate = {
                endpoint: ["Dot", {radius: 17}],
                anchor: "BottomLeft",
                paintStyle: {fillStyle: endpointColor, opacity: 0.5},
                isSource: true,
                scope: 'yellow',
                connectorStyle: {
                    strokeStyle: endpointColor,
                    lineWidth: 4
                },
                connector: "Straight",
                isTarget: true,
                dropOptions: exampleDropOptions,
                onMaxConnections: function (info) {
                    alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpointTemplate.id);
                }
            };

            // make .window divs draggable
            instance.draggable(jsPlumb.getSelector(".drag-drop-demo .window"));

            // add endpointTemplate of type 3 using a selector.
            instance.addEndpoint(jsPlumb.getSelector(".drag-drop-demo .window"), endpointTemplate);

            var hideLinks = jsPlumb.getSelector(".drag-drop-demo .hide");
            instance.on(hideLinks, "click", function (e) {
                instance.toggleVisible(this.getAttribute("rel"));
                jsPlumbUtil.consume(e);
            });

            var dragLinks = jsPlumb.getSelector(".drag-drop-demo .drag");
            instance.on(dragLinks, "click", function (e) {
                var s = instance.toggleDraggable(this.getAttribute("rel"));
                this.innerHTML = (s ? 'disable dragging' : 'enable dragging');
                jsPlumbUtil.consume(e);
            });

            var detachLinks = jsPlumb.getSelector(".drag-drop-demo .detach");
            instance.on(detachLinks, "click", function (e) {
                instance.detachAllConnections(this.getAttribute("rel"));
                jsPlumbUtil.consume(e);
            });

            instance.on(document.getElementById("clear"), "click", function (e) {
                instance.detachEveryConnection();
                jsPlumbUtil.consume(e);
            })
        });

        this.instance.bind('connection', QuoteGraph.eventHandlers.onNewConnection);

        jsPlumb.bind("jsPlumbConnection", function (ci) {
            ci.connection.bind("click", function (con) {
                jsPlumb.detach(con);
            });
        });
        jsPlumb.fire("jsPlumbDemoLoaded", instance);
    },

    init: function () {
        // Register drag & drop event listeners.
        console.log("Quote graph initializing.");

        $(LEFT_PANE_SELECTOR).on('drop', QuoteGraph.eventHandlers.drop);
        $(LEFT_PANE_SELECTOR).on('dragover', QuoteGraph.eventHandlers.allowDrop);
        $('#' + WEBSITE_CONTENT_WRAPPER_ID).on('dragstart', QuoteGraph.eventHandlers.startDrag);
        QuoteGraph.setup(); // Register setup method.
        QuoteGraph.bigPictureAPI = QuoteGraph.instantiateBigPicture();

        QuoteGraph.bigPictureAPI.setNewText(QuoteGraph.convertQuoteRecordToHTML);

        console.log("Quote graph initialized.");

        // Request quote data update.
        //QuoteGraph.sendMessage({
        //    type: QUOTE_INIT_DATA
        //}); TODO unquote!!
    },

    instantiateBigPicture: function () {
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
        };

        /*
         * TEXT BOXES
         */

        $(".bigpictureNode").each(function () {
            updateTextPosition(this);
        });     // initialization

        $(bp).on('blur', '.bigPictureNode', function () {
            if ($(this).text().replace(/^\s+|\s+$/g, '') === '') {
                $(this).remove();
            }
        });

        $(bp).on('input', '.bigPictureNode', function () {
            redoSearch = true;
        });

        /**
         * Updates position of passed element relative to parent.
         * @param e {jQuery | HTMLElement}
         */
        function updateTextPosition(e) {
            if (!(e instanceof jQuery)) {
                e = $(e);
            }

            if (!e.hasClass('bigpictureNode')) {
                e = e.closest('.bigpictureNode');
                console.log('retrieved e:' + e.length);
            }

            e.css({
                //'font-size': e.data("size") / current.zoom + 'px',
                //'height': e.data("size") * 10 / current.zoom + 'px',
                //'width': e.data("size") * 10 / current.zoom + 'px',
                'left': (e.data("x") - current.x) / current.zoom - bp.x + 'px',
                'top': (e.data("y") - current.y) / current.zoom - bp.y + 'px'
            });

            var newScale = e.data('original-zoom') / current.zoom;
            e.css('transform-origin', '0 0');
            e.css('transform', 'scale(' + newScale + ')');
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

        /**
         * Creates new text node.
         * @param x {int | QuoteRecord} The x coordinate or the QuoteRecord.
         * @param y {int} The y coordinate.
         * @param size {int} The size of the box.
         * @param text {string} The content of the box.
         * @returns {string} The HTML object.
         */
        function newText(x, y, size, text) {
            var tb = null;
            var quoteRecord = null;
            if (typeof x === 'object') {
                quoteRecord = new QuoteRecord(x);
                size = quoteRecord.size;
                y = quoteRecord.location.y;
                x = quoteRecord.location.x;
            }

            if (size === undefined) {
                size = 20;
            }
            // templateGenerator is a function taking a quoteRecord as input,
            //      and returning the formatted quote HTML object, with required bindings.
            if (typeof templateGenerator === 'function') {
                if (!quoteRecord) {
                    quoteRecord = {
                        text: text,
                        location: {
                            x: x,
                            y: y
                        },
                        size: size
                    };
                    quoteRecord = new QuoteRecord(quoteRecord)
                }
                tb = templateGenerator(quoteRecord);

            } else {
                tb = $('<div class="draggable bigpictureNode" style="border: thin solid; color: black">\n    <div class="cont">\n    </div>\n</div>');
                var content = $('.cont', tb);

                content.attr('contenteditable', true);
                content.text(text || "Hello");
            }

            $(tb).data("x", x).data("y", y).data("size", size);

            bp.append(tb);

            // Set the initial values for font-size.
            // Scale font size on all children.

            $(tb).data('original-zoom', current.zoom);
            updateTextPosition(tb);

            // Make all nodes draggable, TODO should use specific id, rather than class.
            //QuoteGraph.instance.draggable(jsPlumb.getSelector(".card.tiny"),
            //    {
            //        start: function (event, ui) {
            //            mouseDownHandler(event);
            //        },
            //
            //        drag: function (event) {
            //            mouseMoveHandler(event);
            //        },
            //
            //        stop: function (event, ui) {
            //            mouseUpHandler(event);
            //            var data = {
            //                uuid: $element.attr('id'),
            //                x: left,
            //                y: top
            //            };
            //
            //            //QuoteGraph.sendMessage({
            //            //    type: QUOTE_LOCATION_UPDATE,
            //            //    data: data
            //            //}) TODO unquote.
            //        }
            //    });

            return tb;
        }

        /*
         * PAN AND MOVE
         */

        var movingText = null,
            dragging = false,
            previousMousePosition;

        var mouseDownHandler = function (e) {
            var target = $(e.target);

            e = e.originalEvent;
            if ((target.hasClass('bigPictureNode') && (e.ctrlKey || e.metaKey)) ||
                target.hasClass('draggable')) {

                movingText = target.closest('.bigpictureNode');
                movingText.addClass("noselect notransition");

            } else {
                movingText = null;
                dragging = true;
            }
            biggestPictureSeen = false;
            previousMousePosition = {x: e.pageX, y: e.pageY};
        };
        bpContainer.mousedown(mouseDownHandler);

        var mouseUpHandler = function () {
            dragging = false;

            if (movingText) {
                //$(movingText).addClass("text");
                $(movingText).removeClass("noselect notransition");
            }
            movingText = null;
        };
        window.onmouseup = mouseUpHandler;

        bpContainer.on('dragstart', function (e) {
            e.originalEvent.preventDefault();
        });

        var mouseMoveHandler = function (e) {
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
        };
        bpContainer.mousemove(mouseMoveHandler);

        /*
         * ZOOM
         */

        bpContainer.dblclick(function (e) {
            e.preventDefault();
            // Insert new node.
            newText(current.x + (e.clientX) * current.zoom, current.y + (e.clientY) * current.zoom, 20 * current.zoom, '').focus();
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

            $(".bigpictureNode").each(function () {
                updateTextPosition(this);
            });

            biggestPictureSeen = false;
        }

        function zoomOnText(res) {
            onZoom($(res).data('size') / 20, $(res).data('x'), $(res).data('y'));
        }

        function seeBiggestPicture(e) {
            e.preventDefault();
            console.log("Biggest picture...");
            document.activeElement.blur();
            function universeboundingrect() {
                var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                var texteelements = document.getElementsByClassName('bigPictureNode');
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

            var texts = document.getElementsByClassName('bigPictureNode');
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
            $(".bigPictureNode").each(function () {
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
        /**
         * Converts a quote record into its HTML representation.
         * @param quoteRecord {QuoteRecord} The quote record to convert.
         * @type {function}
         * @returns {jQuery}
         */
        var templateGenerator = null;

        function setNewNodeFunction(newFunction) {
            templateGenerator = newFunction;
        }

        return {
            newText: newText,
            current: current,
            updateTextPosition: updateTextPosition,
            setNewText: setNewNodeFunction
        };

    },


    eventHandlers: {
        onNewConnection: function (info, ev) {
            console.log("---------------------");
            console.log("New connection! Info:");
            console.log(info);

            var source = info.sourceId,
                target = info.target.id;

            // Only notify of new connection if user induced new connection.
            if (!QuoteGraph.quotes.existsConnection(source, target)) {
                QuoteGraph.sendMessage({
                    type: QUOTE_CONNECTION_UPDATE,
                    data: {
                        source: source,
                        target: target
                    }
                })
            }
        },
        /**
         * Update all rendered quotes.
         * @param quoteStorage {QuoteStorage} updated quote storage object.
         */
        onQuoteUpdate: function (quoteStorage) {
            // Reset the canvas.
            QuoteGraph.instance.detachEveryConnection();
            QuoteGraph.instance.deleteEveryEndpoint();
            QuoteGraph.instance.empty(LEFT_PANE_IDENTIFIER);

            QuoteGraph.quotes = new QuoteStorage(quoteStorage);
            quoteStorage = QuoteGraph.quotes;

            // Create all nodes.
            var nodes = quoteStorage.getAllQuotes();
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                QuoteGraph.convertQuoteRecordToHTML(node);
            }

            // Create all connections.
            var connections = quoteStorage.getAllConnections();
            for (i = 0; i < connections.length; i++) {
                var connection = connections[i];
                QuoteGraph.addConnection(connection.source, connection.target);
            }
        },

        allowDrop: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        },

        startDrag: function (ev) {
            var path = $(ev.originalEvent.path[1]).getPath(); // TODO update code to be resilient.
            ev.originalEvent.dataTransfer.setData('src', path);
        },

        drop: function (ev) {
            ev.preventDefault();

            var url = window.location.href,
                text = ev.originalEvent.dataTransfer.getData('text/plain'),
                html_data = ev.originalEvent.dataTransfer.getData('text/html'),
                source_selector = ev.originalEvent.dataTransfer.getData('src'),
                x = ev.offsetX,
                y = ev.offsetY,
                htmlObj = $(html_data),
                type = htmlObj.prop('tagName');

            // Save the node to backend.
            var newRecord = new QuoteRecord(undefined, text, html_data, type, url, source_selector, {x: x, y: y});

            QuoteGraph.convertQuoteRecordToHTML(newRecord);


            QuoteGraph.sendMessage({
                type: QUOTE_UPDATE,
                data: newRecord
            });
        },

        onDblClick: function (ev) {
            ev.preventDefault();

            // Create new QuoteRecord to represent the node.
            var quoteRecord = new QuoteRecord({
                location: {
                    x: ev.clientX,
                    y: ev.clientY
                }
            });

            QuoteGraph.convertQuoteRecordToHTML(quoteRecord);
        }

    },
    /**
     * Convert passed in information into required HTML string.
     * @param quoteRecord {QuoteRecord}
     * @returns {*|jQuery|HTMLElement}
     */
    convertQuoteRecordToHTML: function (quoteRecord) {
        var url = quoteRecord.URL,
            text = quoteRecord.text,
            html_data = quoteRecord.html_data,
            source_selector = quoteRecord.xPath,
            type = quoteRecord.type,
            id = quoteRecord.id,
            title = quoteRecord.title;

        // Create div.
        var $div = $(
            '<div class="card tiny bigpictureNode ' + QUOTE_CARD_CLASS + '">\n    <i class="material-icons closing-x black-text right " style="cursor: pointer;">close</i>\n    <div class="card-content draggable">\n        <span class="card-title cyan-text ' + QUOTE_TITLE_CLASS + '">\n            <div class="input-field quote-title">\n                Plain title.\n            </div>\n        </span>\n        <p class="x-content cyan-text text-darken-3 ' + QUOTE_CONTENT_CLASS + '">\n            Sample content here.\n        </p>\n    </div>\n    <div class="card-action">\n        <a href="' + url + '" class="cyan-text text-accent-4">Open origin</a>\n    </div>\n</div>');

        var $closeX = $('.closing-x', $div)
            .on('click', QuoteGraph.deleteQuote);

        QuoteGraph.addNodeHelpers.addHandlersToTitle($('.quote-title', $div).parent());
        var $title = $('.quote-title', $div);
        $title.html(title);

        var $content = $('.x-content', $div);
        $content.text("Sample content");

        // Check if image.
        if (type == 'IMG') {
            var source = $(html_data).attr('src'); // Extract the source of the image.
            $($content).append($('<img>').attr('src', source));
        } else {
            $($content).text(text);
        }

        $($div).attr('id', QuoteGraph.i);


        // Add the endpointTemplate to it.
        endpointTemplate.uuid = id;
        var ret = QuoteGraph.instance.addEndpoint($div, endpointTemplate);
        //this.instance.setId(ret.getElement(), id); TODO unquote and/or relocate.

        return $div;
    },

    addNodeHelpers: {
        handleTitleInlineEdit: function (ev) {
            ev.preventDefault();
            var isClick = ev.originalEvent.type == "click";
            var child = $(":first-child", this);
            var childInput = $(":first-child", child);
            var isInput = childInput.length ? childInput.prop('tagName').toLowerCase() == "input" : false;

            if (isClick && !isInput) {
                var currentTitle = child.text();
                currentTitle = (currentTitle == '\xa0') ? "" : currentTitle;

                child.empty();
                child.append($('<input placeholder="Enter Title" id="title_form" type="text" class="validate">\n'));
                childInput = $(":first-child", child);
                childInput.attr('value', currentTitle);


                childInput.keypress(function (e) {
                    if (e.which == 13) {
                        $(this).blur();
                    }
                });
                // Focus and scroll to end of existing title.
                childInput.focus();
                var len = currentTitle.length;
                childInput[0].setSelectionRange(len, len);

            } else if (!isClick) {
                // Extract the text.
                var newTitle = childInput.val();
                var quoteID = childInput.parent().parent().parent().parent().attr('id');

                // Ensure that the resulting title contains at least one character.
                if (!$.trim(newTitle).length) {
                    newTitle = "&nbsp;";
                    child.html(newTitle);
                } else {
                    child.text(newTitle);
                }

                QuoteGraph.sendMessage({
                    type: QUOTE_TITLE_CHANGED,
                    data: {
                        new_title: newTitle,
                        quote_id: quoteID
                    }
                });
            }
        },

        addHandlersToTitle: function ($element) {
            $element
                .on("click", QuoteGraph.addNodeHelpers.handleTitleInlineEdit)
                .on("focusout", QuoteGraph.addNodeHelpers.handleTitleInlineEdit);
        }
    },

    deleteQuote: function (ev) {
        var originID = ev.originalEvent.path[1].id;

        QuoteGraph.sendMessage({
            type: QUOTE_DELETED,
            data: {
                id: originID
            }
        });
    },

    /**
     * Connect two graphs in the jsPlumb graph.
     * @param source {string | int} The source id.
     * @param target {string | int} The target id.
     */
    addConnection: function (source, target) {
        var connection = QuoteGraph.instance.connect({
            uuids: [source, target]
        });
        connection.bind("dblclick", QuoteGraph.deleteConnection);
    },

    deleteConnection: function (conn, ev) {
        var uuids = this.getUuids();

        QuoteGraph.sendMessage({
            type: QUOTE_CONNECTION_DELETED,
            data: uuids
        });
    },

    tools: {
        messageHandler: function (request, sender, sendResponse, sentFromExt) {
            switch (request.type) {
                case QUOTE_UPDATE:
                    QuoteGraph.eventHandlers.onQuoteUpdate(request.data);
                    break;

                case QUOTE_INIT_DATA:
                    QuoteGraph.eventHandlers.onQuoteUpdate(request.data);
                    break;

                default:
                    console.log("Quote message not recognised.");
            }

        }
    }
};


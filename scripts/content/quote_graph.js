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

        this.instance.bind('connection', QuoteGraph.onNewConnection);

        jsPlumb.bind("jsPlumbConnection", function (ci) {
            ci.connection.bind("click", function (con) {
                jsPlumb.detach(con);
            });
        });
        jsPlumb.fire("jsPlumbDemoLoaded", instance);
    },

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
     *
     * @param quoteStorage {QuoteStorage} updated quote storage object.
     */
    onQuoteUpdate: function (quoteStorage) {
        // Reset the canvas.
        this.instance.detachEveryConnection();
        this.instance.deleteEveryEndpoint();
        this.instance.empty(LEFT_PANE_IDENTIFIER);

        QuoteGraph.quotes = new QuoteStorage(quoteStorage);
        quoteStorage = QuoteGraph.quotes;

        // Create all nodes.
        var nodes = quoteStorage.getAllQuotes();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            QuoteGraph.addNode(node.location.x, node.location.y,
                node.URL, node.text, node.html_data, node.xPath, node.type, node.id);
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

        var id = QuoteGraph.addNode(x, y, url, text, html_data, source_selector, type);

        // Save the node to backend.
        var newRecord = new QuoteRecord(id, text, html_data, type, url, source_selector, {x: x, y: y});

        QuoteGraph.sendMessage({
            type: QUOTE_UPDATE,
            data: newRecord
        });
    },

    addNode: function (x, y, url, text, html_data, source_selector, type, id) {
        // Create div.
        if (id === undefined) {
            id = utils.guid(); // Create unique id.
        }

        var $div = $(
            '<div class="window">\n    <x-title>Sample Title here</x-title><img class="closing-x">\n    <br/><br/>\n    \n    <x-content>\n        Sample content here.\n    </x-content>\n    <!--Misc control items.-->\n    <a href="#" class="cmdLink hide" rel="dragDropWindow4">toggle\n        connections</a><br/>\n    <a href="#" class="cmdLink drag" rel="dragDropWindow4">disable dragging</a><br>\n    <a href="#" class="cmdLink detach" rel="dragDropWindow4">detach\n        all</a>\n</div>');

        var $closeX = $('.closing-x', $div).attr('src', chrome.extension.getURL('/assets/black-x-hi.png'));
        $closeX.on('click', QuoteGraph.deleteQuote);
        var $title = $('x-title', $div);
        $title.text("Sample title");

        var $content = $('x-content', $div);
        $content.text("Sample content");

        // Check if image.
        if (type == 'IMG') {
            var source = $(html_data).attr('src'); // Extract the source of the image.
            $($content).append($('<img>').attr('src', source));
        } else {
            $($content).text(text);
        }

        $($div).attr('id', this.i);
        // Append to container.
        $(LEFT_PANE_SELECTOR).append($div);

        // Set position.
        $div.css({top: y, left: x});

        // Add the endpointTemplate to it.
        endpointTemplate.uuid = id;
        var ret = this.instance.addEndpoint($div, endpointTemplate);
        this.instance.setId(ret.getElement(), id);

        // Make all nodes draggable, should use specific id, rather than class.
        this.instance.draggable(jsPlumb.getSelector(".drag-drop-demo .window"),
            {
                stop: function (event, ui) {
                    // Called when element is dropped.
                    var $element = $(event.el),
                        top = $element.css('top'),
                        left = $element.css('left');
                    console.log("Element dropped top:" + top + " left:" + left);
                    var data = {
                        uuid: $element.attr('id'),
                        x: left,
                        y: top
                    };

                    QuoteGraph.sendMessage({
                        type: QUOTE_LOCATION_UPDATE,
                        data: data
                    })
                }
            });

        return id;
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
        var connection = QuoteGraph.instance.connect({uuids: [source, target]});
        connection.bind("dblclick", QuoteGraph.deleteConnection);
    },

    deleteConnection: function (conn, ev) {
        var uuids = this.getUuids();

        QuoteGraph.sendMessage({
            type: QUOTE_CONNECTION_DELETED,
            data: uuids
        });
    },

    init: function () {
        // Register drag & drop event listeners.
        console.log("Quote graph initializing.");

        $(LEFT_PANE_SELECTOR).on('drop', QuoteGraph.drop);
        $(LEFT_PANE_SELECTOR).on('dragover', QuoteGraph.allowDrop);
        $('#' + WEBSITE_CONTENT_WRAPPER_ID).on('dragstart', QuoteGraph.startDrag);
        QuoteGraph.setup(); // Register setup method.

        console.log("Quote graph initialized.");

        // Request quote data update.
        QuoteGraph.sendMessage({
            type: QUOTE_INIT_DATA
        })
    },

    tools: {
        messageHandler: function (request, sender, sendResponse, sentFromExt) {
            switch (request.type) {
                case QUOTE_UPDATE:
                    QuoteGraph.onQuoteUpdate(request.data);
                    break;

                case QUOTE_INIT_DATA:
                    QuoteGraph.onQuoteUpdate(request.data);
                    break;

                default:
                    console.log("Quote message not recognised.");
            }

        }
    }
};


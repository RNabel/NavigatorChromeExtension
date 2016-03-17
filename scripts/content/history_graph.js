/**
 * Created by robin on 11/01/16.
 */

/**
 *
 */
var HistoryGraph = {
    history: undefined,
    columns: [], // All URLs drawn into each column.
    connectors: [], // The id pairs of all connectors.
    totalLevels: TOTAL_COLUMNS,
    currentNodeIndex: Math.floor(TOTAL_COLUMNS / 2), // The index of the centre node.
    edgeCount: 0,

    maxX: MAX_X,
    minX: MIN_X,
    maxY: MAX_Y,
    minY: MIN_Y,

    // Instantiate jsPlumb object.
    instance: undefined,

    init: function () {
        // Initialize jsPlumb instance.
        this.instance = jsPlumb.getInstance({
            Container: RIGHT_PANE_IDENTIFIER,
            Endpoint: "Rectangle"
        });

        this.endpointTemplate = {
            endpoint: ["Dot", {radius: HIST_ENDPOINT_RADIUS}],
            anchor: ["Left", "Right"],
            paintStyle: {fillStyle: HIST_CONNECTOR_COLOR, opacity: HIST_CONNECTOR_OPACITY},
            isSource: true,
            scope: 'yellow',
            connectorStyle: {
                strokeStyle: HIST_CONNECTOR_COLOR,
                lineWidth: HIST_CONNECTOR_WIDTH
            },
            connector: "Straight",
            isTarget: true,
            onMaxConnections: function (info) {
                alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpointTemplate.id);
            },
            maxConnections: 1000
        };

        // Add sample nodes.
        //var id1 = this.convertQuoteRecordToHTML(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 0);
        //var id2 = this.convertQuoteRecordToHTML(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 1);
        //var id3 = this.convertQuoteRecordToHTML(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 2);
        //var id4 = this.convertQuoteRecordToHTML(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 3);
        //var id5 = this.convertQuoteRecordToHTML(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 4);
        //
        //// Add sample connections.
        //this.connections.connect(id1, id2);
        //this.connections.connect(id2, id3);
        //this.connections.connect(id3, id4);
        //this.connections.connect(id4, id5);

        // Request information from back-end, supplying current title.
        HistoryGraph.sendMessage({
            type: HISTORY_INIT_DATA,
            data: {
                title: document.title,
                url: document.URL
            }
        });
    },

    /**
     * Create the initial graph based on recorded history.
     * @param historyStorage {HistoryStorage} The entire session's history used initialise the tree.
     */
    drawGraphFromStorage: function (historyStorage) {
        HistoryGraph.columns = [];
        HistoryGraph.connectors = [];

        // Create empty arrays for the columns.
        for (var i = 0; i < TOTAL_COLUMNS; i++) HistoryGraph.columns.push([]);

        // Instantiate history object from passed list.
        HistoryGraph.history = new HistoryStorage(historyStorage);

        // Find and create the root node.
        var currentURL = document.URL;
        var rootNode = HistoryGraph.history.findRecord(currentURL);

        // Escape if the current page does not exist in the history storage (yet). History will be updated and re-braodcast.
        if (!rootNode) {
            HistoryGraph.addNode(0, document.title, "", 2, "0", document.URL);
            return;
        }

        // Start recursive adding of parents and children.
        HistoryGraph.recursiveAddNode(rootNode, 2, undefined, false, []);
        HistoryGraph.recursiveAddNode(rootNode, 2, undefined, true, []);

        // Render all nodes.
        HistoryGraph.rendering.render();
    },

    connections: {
        connect: function (source, target) {
            // Create the relevant endpoints.
            var $source = $(document.getElementById(source)),
                $target = $(document.getElementById(target));

            var sourceEndpointID = HistoryGraph.addEndpoint($source),
                targetEndpointID = HistoryGraph.addEndpoint($target);

            var connection = HistoryGraph.instance.connect({
                uuids: [sourceEndpointID, targetEndpointID],
                overlays: [["Arrow", {width: 12, length: 12, location: 1}]]
            });
            // Any event listeners like so: connection.bind("dblclick", QuoteGraph.deleteConnection);
        },

        /**
         * Checks whether the passed history record already exists in the passed list of connections.
         * @param connectionPair {HistoryRecord[]}
         * @param connections {HistoryRecord[][]}
         * @returns {boolean} Whether the connection already exists.
         */
        existsConnection: function (connectionPair, connections) {
            for (var i = 0; i < connections.length; i++) {
                var connection = connections[i];
                if (connection[0] == connectionPair[0] && connection[1] == connectionPair[1]) {
                    return true;
                }
            }
            return false;
        }
    },

    /**
     * Recursively add parents/children of current node to the tree.
     * @param currentNode {HistoryRecord} The current history record.
     * @param currentColumnIndex {int} The index of the current column.
     * @param lastNode {HistoryRecord} The history record of the last node.
     * @param isChildDirection {boolean} Whether the direction of recursion is towards children or parents.
     * @param connectionsMade {HistoryRecord[][]} all the connections already seen, used to prevent cycles.
     */
    recursiveAddNode: function (currentNode, currentColumnIndex, lastNode, isChildDirection, connectionsMade) {
        // Return if level too large.
        if (currentColumnIndex < 0 || currentColumnIndex >= TOTAL_COLUMNS) {
            return;
        }

        // Find nodes to be drawn in next recursive level, and which index that level has.
        var nodes = (isChildDirection) ? currentNode.getChildren() : currentNode.getParents();
        var nextColumnIndex = (isChildDirection) ? currentColumnIndex + 1 : currentColumnIndex - 1;

        // Only add the currentNode, if it is not already added to the current column.
        var currentNodeID = currentNode.getID();
        var nodeAlreadyExists = false;
        for (i = 0; i < HistoryGraph.columns[currentColumnIndex].length; i++) {
            if (HistoryGraph.columns[currentColumnIndex][i].getID() == currentNodeID) {
                nodeAlreadyExists = true;
                break; // Could return here, but may make flow difficult to follow.
            }
        }


        var connectorPair = isChildDirection ? [lastNode, currentNode] : [currentNode, lastNode];
        var connectionAlreadyExists = HistoryGraph.connections.existsConnection(connectorPair, connectionsMade);

        // Only add the node and connection if it has NOT already been made.
        if (!nodeAlreadyExists && !connectionAlreadyExists) {
            HistoryGraph.columns[currentColumnIndex].push(currentNode);
            connectionsMade.push(connectorPair);

            if (lastNode !== undefined) { // Only add connection if lastNode exists.
                HistoryGraph.connectors.push(connectorPair);
            }

            // Add each child node, and call self with respective node.
            for (var i = 0; i < nodes.length; i++) {
                var nextNodeID = nodes[i];
                var nextNodeRecord = HistoryGraph.history.findRecord(nextNodeID);

                HistoryGraph.recursiveAddNode(nextNodeRecord, nextColumnIndex, currentNode, isChildDirection, connectionsMade)
            }
        }

    },

    /**
     * Adds new node to the history graph.
     * @param y {int} The height of the element measured from the top.
     * @param title {string} The title of the webpage.
     * @param faviconUrl {string} The URL of the favicon of the webpage.
     * @param column {int} The index of the column of the node.
     * @param nodeID {string} The unique selector of the webpage.
     * @param websiteURL {string} The URL of the webpage.
     * @returns {string} The unique identifier of the node element.
     */
    addNode: function (y, title, faviconUrl, column, nodeID, websiteURL) {
        // Create div.
        var $div = $(
            '<div class="history_entry chip truncate" title="'+ websiteURL + '">\n    <img class="favicon">\n    <x-title>Website title</x-title>\n</div>');

        var $favicon = $('.favicon', $div).attr({
            'src': faviconUrl
        });
        $favicon.on('click', function () {
            window.location.href = websiteURL
        });
        var $title = $('x-title', $div);
        $title.text(title);

        $div.addClass(nodeID);
        $div.addClass('column-' + column);

        var id = utils.guid();
        $div.attr('id', id); // Assign unique id.

        // Append to container.
        $(RIGHT_PANE_SELECTOR).append($div);

        // Set position.
        $div.css({top: (HIST_TOP_OFFSET + y * HIST_BOX_HEIGHT_DISTANCE) + "px"});

        return id;
    },

    /**
     * Attach new endpoint to the passed node, and return its ID.
     * @param $element {jQuery | object} The node to which to add the endpoint.
     * @returns {number}
     */
    addEndpoint: function ($element) {
        var id = utils.guid(); // Create unique id.

        this.endpointTemplate.uuid = id;
        var ret = this.instance.addEndpoint($element, this.endpointTemplate);

        return id;
    },

    rendering: {
        render: function () {
            // Clear current canvas.
            HistoryGraph.instance.detachEveryConnection();
            HistoryGraph.instance.deleteEveryEndpoint();
            HistoryGraph.instance.empty(RIGHT_PANE_IDENTIFIER);

            // Add all nodes in each column.
            for (var col = 0; col < HistoryGraph.columns.length; col++) {
                for (var row = 0; row < HistoryGraph.columns[col].length; row++) {
                    var currentNode = HistoryGraph.columns[col][row];

                    HistoryGraph.addNode(row, currentNode.getTitle(), currentNode.getFaviconURL(), col, currentNode.getID(), currentNode.getURL());
                }
            }

            // Add all connections.
            for (var i = 0; i < HistoryGraph.connectors.length; i++) {
                var currentPair = HistoryGraph.connectors[i],
                    origin = currentPair[0].getID(),
                    target = currentPair[1].getID();

                // For each column.
                //for (var columnIndex = 0; columnIndex < TOTAL_COLUMNS; columnIndex++) {
                //    var originElement = HistoryGraph.rendering.getElementByColumnAndURL(origin, columnIndex);
                //
                //    if (originElement) {
                //        var targetElement = HistoryGraph.rendering.getElementByColumnAndURL(target, (columnIndex + 1));
                //
                //        // If both origin and target exist in the correct columns, create connection.
                //        if (targetElement) {
                //            HistoryGraph.connections.connect($(originElement).attr('id'), $(targetElement).attr('id'));
                //        }
                //    }
                //}
                var centerColumnIndex = Math.ceil(TOTAL_COLUMNS / 2.0);
                // MASSIVE FIXME not working. To be worked on as soon as correct bubbles spawned.
                // --- FUTURE ---
                for (var columnIndex = centerColumnIndex; columnIndex < TOTAL_COLUMNS; columnIndex++) {
                    //  start from center index, and move outwards removing connectors as you move along
                    if (HistoryGraph.rendering.addConnectorsIfOriginAndTargetMatch(origin, target, columnIndex)) {
                        break;
                    }
                }

                // --- PAST ---
                for (columnIndex = centerColumnIndex - 1; columnIndex >= 0; columnIndex--) {
                    //  start from center index, and move outwards removing connectors as you move along
                    if (HistoryGraph.rendering.addConnectorsIfOriginAndTargetMatch(origin, target, columnIndex)) {
                        break;
                    }
                }
            }
        },

        /**
         * Return the element with classes websiteURL and columnIndex.
         * @param websiteURL {string} The website's URL.
         * @param columnIndex {int | string} The index of the column.
         * @returns {object | boolean} The element matching the criteria.
         */
        getElementByColumnAndURL: function (websiteURL, columnIndex) {
            // Get the column.
            columnIndex = columnIndex.toString();
            var rows = $('.' + HIST_COLUMN_INDENTIFIER_PREFIX + columnIndex + '.' + websiteURL);

            return (rows.length) ? rows[0] : false;
        },

        /**
         * Add a connection between the element with ID originID and the element with ID target ID, where the origin
         *     element is in column with index columnIndex.
         * @param originID {string}
         * @param targetID {string}
         * @param columnIndex {int}
         * @returns {boolean} whether a connection was made.
         */
        addConnectorsIfOriginAndTargetMatch: function (originID, targetID, columnIndex) {
            var originElement = HistoryGraph.rendering.getElementByColumnAndURL(originID, columnIndex);

            if (originElement) {
                var targetElement = HistoryGraph.rendering.getElementByColumnAndURL(targetID, (columnIndex + 1));

                // If both origin and target exist in the correct columns, create connection.
                if (targetElement) {
                    HistoryGraph.connections.connect($(originElement).attr('id'), $(targetElement).attr('id'));
                    return true; // Escape loop if connection used.
                }
            }

            return false;
        }
    },


    tools: {
        messageHandler: function (request, sender, sendResponse, sentFromExt) {
            switch (request.type) {
                case HISTORY_UPDATE:
                    HistoryGraph.drawGraphFromStorage(request.data.list);
                    break;
                case HISTORY_INIT_DATA:
                    HistoryGraph.drawGraphFromStorage(request.data.list);
                    break;
                default:
                    console.log("received message." + request);
            }
        }
    }
};

/**
 * Created by robin on 11/01/16.
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
            paintStyle: {fillStyle: HIST_ENDPOINT_COLOR, opacity: HIST_CONNECTOR_OPACITY},
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
        var centerNode = HistoryGraph.history.findRecord(currentURL);

        // Escape if the current page does not exist in the history storage (yet). History will be updated and re-braodcast.
        if (!centerNode) {
            var histNode = new HistoryRecord(document.URL, 0, document.title);
            HistoryGraph.columns[HistoryGraph.currentNodeIndex].push(histNode);
            HistoryGraph.rendering.render();
            // HistoryGraph.addNode(0, document.title,
            //     utils.createFaviconURL(document.URL),
            //     HIST_CENTER_COLUMN_INDEX,
            //     "0", document.URL);
            return;
        }

        // Start recursive adding of parents and children.
        HistoryGraph.recursiveAddNode(centerNode, HIST_CENTER_COLUMN_INDEX, undefined, false, []);
        HistoryGraph.recursiveAddNode(centerNode, HIST_CENTER_COLUMN_INDEX, undefined, true, []);

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
                if (connection[0] == connectionPair[0] && connection[1] == connectionPair[1] ||
                    connection[0] == connectionPair[1] && connection[1] == connectionPair[0]
                ) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Checks whether a node was already added to a column.
         * @param id {string} The unique ID of the node.
         * @param columnIndex {int} The index of the column.
         * @returns {boolean} Whether the node already exists.
         */
        existsNodeInColumn: function (id, columnIndex) {
            for (var i = 0; i < HistoryGraph.columns[columnIndex].length; i++) {
                if (HistoryGraph.columns[columnIndex][i].getID() == id) {
                    return true; // Node exists.
                }
            }

            return false; // Node does not exist.
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
        var nodeAlreadyExists = HistoryGraph.connections.existsNodeInColumn(currentNodeID, currentColumnIndex);


        // FIXME so far nodes only added as parents, check what's up with that!!
        // UPDATE: Children not added as parent recursion adds root node, and thus the children code is not entered.

        var connectorPair = isChildDirection ? [lastNode, currentNode] : [currentNode, lastNode];
        var connectionAlreadyExists = HistoryGraph.connections.existsConnection(connectorPair, connectionsMade);
        var isSecondRecursiveCallAtRoot = (currentColumnIndex == HIST_CENTER_COLUMN_INDEX && nodeAlreadyExists);

        // Only add the node and connection if it has NOT already been made.
        if (!nodeAlreadyExists && !connectionAlreadyExists || isSecondRecursiveCallAtRoot) {
            if (!isSecondRecursiveCallAtRoot) {
                HistoryGraph.columns[currentColumnIndex].push(currentNode)
            }

            if (lastNode !== undefined) { // Only add connection if lastNode exists.
                HistoryGraph.connectors.push(connectorPair);
                connectionsMade.push(connectorPair);
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
            '<div class="history_entry chip truncate" title="' + websiteURL + '">\n    <img class="favicon">\n    <x-title>Website title</x-title>\n</div>');

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
                for (var columnIndex = 0; columnIndex < TOTAL_COLUMNS; columnIndex++) {
                   var originElement = HistoryGraph.rendering.getElementByColumnAndURL(origin, columnIndex);

                   if (originElement) {
                       var targetElement = HistoryGraph.rendering.getElementByColumnAndURL(target, (columnIndex + 1));

                       // If both origin and target exist in the correct columns, create connection.
                       if (targetElement) {
                           HistoryGraph.connections.connect($(originElement).attr('id'), $(targetElement).attr('id'));
                       }
                   }
                }
            }

            $('.column-' + HIST_CENTER_COLUMN_INDEX).addClass(HIST_CENTRAL_NODE_STYLE_CLASSES)
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

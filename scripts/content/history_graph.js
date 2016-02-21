/**
 * Created by robin on 11/01/16.
 */

/**
 *
 * @type {{history: HistoryStorage, columns: HistoryRecord[], connectors: HistoryRecord[], sendMessage: function}}
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
        //var id1 = this.addNode(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 0);
        //var id2 = this.addNode(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 1);
        //var id3 = this.addNode(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 2);
        //var id4 = this.addNode(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 3);
        //var id5 = this.addNode(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 4);
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
        console.log("Drawing entire history.");
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
        if (!rootNode) return;

        // Start recursive adding of parents and children.
        HistoryGraph.recursiveAddNode(rootNode, 3, undefined, false);
        HistoryGraph.recursiveAddNode(rootNode, 3, undefined, true);

        // Render all nodes.
        HistoryGraph.render();
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
        }
    },

    /**
     * Recursively add parents/children of current node to the tree.
     * @param currentNode {HistoryRecord} The current history record.
     * @param currentColumnIndex {int} The index of the current column.
     * @param lastNode {HistoryRecord} The history record of the last node.
     * @param isChildDirection {boolean} Whether the direction of recursion is towards children or parents.
     */
    recursiveAddNode: function (currentNode, currentColumnIndex, lastNode, isChildDirection) {
        // Return if level too large.
        if (currentColumnIndex === 0 || currentColumnIndex > TOTAL_COLUMNS) {
            return;
        }

        // Find nodes to be drawn in next recursive level, and which index that level has.
        var nodes = (isChildDirection) ? currentNode.getChildren() : currentNode.getParents();
        var nextColumnIndex = (isChildDirection) ? currentColumnIndex + 1 : currentColumnIndex - 1;

        // Add each node, and call self with respective node.
        for (var i = 0; i < nodes.length; i++) {
            var nextNodeID = nodes[i];
            var nextNodeRecord = HistoryGraph.history.findRecord(nextNodeID);

            HistoryGraph.recursiveAddNode(nextNodeRecord, nextColumnIndex, currentNode, isChildDirection)
        }

        // Only add the currentNode, if it is not already added to the current column.
        var currentNodeID = currentNode.getID();
        var alreadyExists = false;
        for (i=0; i < HistoryGraph.columns[currentColumnIndex].length; i++) {
            if (HistoryGraph.columns[currentColumnIndex][i].getID() == currentNodeID) {
                alreadyExists = true;
                break; // Could return here, but may make flow difficult to follow.
            }
        }


        if (!alreadyExists) {
            HistoryGraph.columns[currentColumnIndex].push(currentNode);

            var connectorPair = isChildDirection ? [lastNode, currentNode] : [currentNode, lastNode];
            HistoryGraph.connectors.push(connectorPair);
        }
    },

    addNode: function (y, title, faviconUrl, column, id) {
        // Create div.
        var _id = id || utils.guid(); // Create unique id.

        var $div = $(
            '<div class="history_entry">\n    <img class="favicon" align="middle"><x-title>Website title</x-title>\n</div>');

        var $favicon = $('.favicon', $div).attr('src', faviconUrl);
        //$favicon.on('click', QuoteGraph.deleteQuote);
        var $title = $('x-title', $div);
        $title.text(title);

        $div.attr('id', _id);
        $div.addClass('column-' + column);

        // Append to container.
        $(RIGHT_PANE_SELECTOR).append($div);

        // Set position.
        $div.css({top: y * HIST_BOX_HEIGHT_DISTANCE});

        return _id;
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
        //this.instance.setId(ret.getElement(), id);

        return id;
    },


    ///**
    // * HistoryGraph interface function for graph creation from data source, validates input and stated dependencies,
    // *     and takes care of positioning.
    // * @param level {int} the number of the level [1 - max level]
    // * @param nodeID {string} the name of the node to be inserted.
    // * @param nodeLabel {string} The title of the page.
    // * @param [dependentNodeName] {string} the name of the node it connects to.
    // * @returns {boolean} - whether the node insertion was successful.
    // */
    //addNodeToLevel: function (level, nodeID, nodeLabel, dependentNodeName) {
    //    // Add the node to the internal data storage.
    //
    //    if (!(typeof dependentNodeName === 'string') && level != HistoryGraph.currentNodeIndex) {
    //        // Possible error-checking.
    //        console.log('No dependent stated for node "' + nodeID + '"')
    //        return false;
    //    }
    //
    //    var dependentLevelIndex;
    //    var isNodeAdded = false;
    //
    //    // Find the level of the dependent.
    //    if (level > HistoryGraph.currentNodeIndex) { // If parent.
    //        dependentLevelIndex = level - 1;
    //    } else if (level < HistoryGraph.currentNodeIndex) { // If child.
    //        dependentLevelIndex = level + 1;
    //    } else { // If current node.
    //        HistoryGraph.addNode(nodeID, nodeLabel, [], level);
    //        isNodeAdded = true;
    //    }
    //
    //    // Check if dependent exists in other level.
    //    if (!isNodeAdded) {
    //        // Ensure dependent node exists.
    //        if ($.inArray(dependentNodeName, HistoryGraph.columns[dependentLevelIndex])) {
    //            // Possible error-handling.
    //            return false;
    //        }
    //
    //        // Add node to graph.
    //        //HistoryGraph._addNode(nodeID, nodeLabel, [dependentNodeName], level);
    //    }
    //    if (!HistoryGraph.columns[level]) {
    //        HistoryGraph.columns[level] = [];
    //    }
    //    HistoryGraph.columns[level].push(nodeID);
    //    return true;
    //},

    render: function () {
        // Clear current canvas.
        HistoryGraph.instance.detachEveryConnection();
        HistoryGraph.instance.deleteEveryEndpoint();
        HistoryGraph.instance.empty(RIGHT_PANE_IDENTIFIER);

        // Add all nodes in each column.
        for (var col = 0; col < HistoryGraph.columns.length; col++) {
            for (var row = 0; row < HistoryGraph.columns[col].length; row++) {
                var currentNode = HistoryGraph.columns[col][row];

                HistoryGraph.addNode(row, currentNode.getTitle(), currentNode.getFaviconURL(), col, currentNode.getID());
            }
        }

        // Add all connections.
        for (var i = 0; i < HistoryGraph.connectors.length; i++) {
            var currentPair = HistoryGraph.connectors[i];
            HistoryGraph.connections.connect(currentPair[0].getID(), currentPair[1].getID())
        }
    },

    tools: {
        messageHandler: function (request, sender, sendResponse, sentFromExt) {
            console.log("History graph received message");

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

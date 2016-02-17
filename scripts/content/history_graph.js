/**
 * Created by robin on 11/01/16.
 */
var HistoryGraph = {
    history: undefined,
    levels: [],
    totalLevels: TOTAL_LEVELS,
    currentNodeIndex: Math.floor(TOTAL_LEVELS / 2), // The index of the centre node.
    edgeCount: 0,

    maxX: MAX_X,
    minX: MIN_X,
    maxY: MAX_Y,
    minY: MIN_Y,

    // Instantiate Sigma object.
    instance: undefined,

    init: function () {
        // Initialize jsPlumb instance.
        this.instance = jsPlumb.getInstance({
            Container: RIGHT_PANE_IDENTIFIER,
            Endpoint: "Rectangle"
        });

        this.endpointTemplate = {
            endpoint: ["Dot", {radius: 3}],
            anchor: "BottomLeft",
            paintStyle: {fillStyle: "rgba(229,219,61,0.5)", opacity: 0.5},
            isSource: true,
            scope: 'yellow',
            connectorStyle: {
                strokeStyle: "rgba(229,219,61,0.5)",
                lineWidth: 4
            },
            connector: "Straight",
            isTarget: true,
            onMaxConnections: function (info) {
                alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpointTemplate.id);
            }
        };
        this.addNode(10, 10, "bla", "text",  "html_data", "", "", undefined);
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
     * Creates the initial graph based on recorded history.
     * @param historyStorage {Array} The entire session's history used initialise the tree.
     */
    drawGraphFromStorage: function (historyStorage) {
        console.log("Drawing entire history.");
        HistoryGraph.instance.kill();
        HistoryGraph.initialiseSigmaInstance();
        HistoryGraph.levels = [];

        // Instantiate history object from passed list.
        HistoryGraph.history = new HistoryStorage(historyStorage);

        // Create the root node.
        var currentURL = document.URL;
        HistoryGraph.addNodeToLevel(HistoryGraph.currentNodeIndex, currentURL, document.title);

        // Start recursive adding of parents and children.
        HistoryGraph.recursiveAddNode(3, currentURL, false);
        HistoryGraph.recursiveAddNode(3, currentURL, true);
    },

    /**
     * (Re-)Initialises the instance of sigma.js used to draw the graph.
     */
    initialiseSigmaInstance: function () {
        HistoryGraph.instance = new sigma({
            container: RIGHT_PANE_IDENTIFIER,
            settings: {
                defaultNodeColor: '#ec5148'
            },
            renderer: {
                // IMPORTANT:
                // This works only with the canvas renderer, so the
                // renderer type set as "canvas" is necessary here.
                container: document.getElementById(RIGHT_PANE_IDENTIFIER),
                type: 'canvas'
            }
        });

        HistoryGraph.instance.bind('clickNode', HistoryGraph.onNodeClick);
    },

    /**
     * Recursively add parents/children of current node to the tree.
     * @param currentLevel {int} The index of the current level.
     * @param lastID {string} index of the last node appended to the tree.
     * @param isChild {boolean} Whether the current (and thus all following nodes are children).
     * @param [lastNodeName] {string} The id of the node the current node needs to be linked to.
     */
    recursiveAddNode: function (currentLevel, lastID, isChild, lastNodeName) {
        // Return if level too large.
        if (currentLevel === 0 || currentLevel > TOTAL_LEVELS) {
            return;
        }

        // Find children.
        var currentRecord = HistoryGraph.history.findRecord(lastID);
        if (currentRecord === false) { // If record can't be found, return recursive call.
            return;
        }
        var nodes = undefined;
        if (isChild) {
            currentLevel++;
            nodes = currentRecord.getChildren();

        } else {
            currentLevel--;
            nodes = currentRecord.getParents();
        }

        // Add each node, and call self with respective node.
        for (var i = 0; i < nodes.length; i++) {
            var nextNodeID = nodes[i];
            var nextNodeRecord = HistoryGraph.history.findRecord(nextNodeID);
            // Add node.
            HistoryGraph.addNodeToLevel(currentLevel, nextNodeID, nextNodeRecord.getTitle(), lastID);
            HistoryGraph.recursiveAddNode(currentLevel, nextNodeID, isChild, lastID)
        }
    },

    /**
     * Function which places a node in a specific level and interfaces with Sigma's HistoryGraph API.
     * @param nodeID {string} The ID of the node.
     * @param nodeLabel {string} The string label of the node.
     * @param edges {string[]} ids of parent and child nodes.
     * @param level - integer; the level for node insertion, range: [1 - max level].
     */
    _addNode: function (nodeID, nodeLabel, edges, level) {
        // Code adapted from tutorial:
        // https://github.com/jacomyal/sigma.js/wiki

        if (nodeID !== undefined) {

            // Calculate the location of the node.
            var yCoord,
                xCoord,
                diameter = 3,
                nodeFound = false;

            // Calculate y coordinate.
            xCoord = level - HistoryGraph.currentNodeIndex;

            // Calculate x coordinate.
            var numOfNodesInLevel = (HistoryGraph.levels[level] && HistoryGraph.levels[level].length) || 0;

            if (numOfNodesInLevel === 0) {
                yCoord = 0;
                nodeFound = true;
            } else {
                var dist = (HistoryGraph.maxY - HistoryGraph.minY) / (numOfNodesInLevel);
                yCoord = HistoryGraph.minY;

                for (var i = 0; i < numOfNodesInLevel; i++) {
                    var currNodeName = HistoryGraph.levels[level][i];

                    // Find index in graph nodes array.
                    for (var j = 0; j < HistoryGraph.instance.graph.nodes().length; j++) {
                        var node = HistoryGraph.instance.graph.nodes()[j];
                        if (node.id == currNodeName) {
                            nodeFound = true;
                            break;
                        }
                    }

                    HistoryGraph.instance.graph.nodes()[j].y = yCoord;
                    yCoord += dist;
                }
            }

            // Add node to graph if node found.
            if (nodeFound) {
                HistoryGraph.instance.graph.addNode({
                    id: nodeID, // FIXME potential duplicates, requires fixing if id is used uniquely.
                    label: nodeLabel,
                    y: yCoord,
                    x: xCoord,
                    size: diameter
                });
            }


            // Add edges to children and parents.
            if (edges !== undefined && edges.constructor === Array) {

                for (i = 0; i < edges.length; i++) {
                    var target = edges[i],
                        id = "e" + HistoryGraph.edgeCount++;
                    HistoryGraph.instance.graph.addEdge({
                        id: id,
                        // Reference extremities:
                        source: nodeID,
                        target: target
                    });

                }
            }

            // Refresh the graph.
            HistoryGraph.instance.refresh();
        }
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

        $($div).attr('id', id);
        // Append to container.
        $(RIGHT_PANE_SELECTOR).append($div);

        // Set position.
        $div.css({top: y, left: x});

        // Add the endpointTemplate to it.
        this.endpointTemplate.uuid = id;
        var ret = this.instance.addEndpoint($div, this.endpointTemplate);
        this.instance.setId(ret.getElement(), id);

        return id;
    },


    /**
     * HistoryGraph interface function for graph creation from data source, validates input and stated dependencies,
     *     and takes care of positioning.
     * @param level {int} the number of the level [1 - max level]
     * @param nodeID {string} the name of the node to be inserted.
     * @param nodeLabel {string} The title of the page.
     * @param [dependentNodeName] {string} the name of the node it connects to.
     * @returns {boolean} - whether the node insertion was successful.
     */
    addNodeToLevel: function (level, nodeID, nodeLabel, dependentNodeName) {
        // Add the node to the internal data storage.

        if (!(typeof dependentNodeName === 'string') && level != HistoryGraph.currentNodeIndex) {
            // Possible error-checking.
            console.log('No dependent stated for node "' + nodeID + '"')
            return false;
        }

        var dependentLevelIndex;
        var isNodeAdded = false;

        // Find the level of the dependent.
        if (level > HistoryGraph.currentNodeIndex) { // If parent.
            dependentLevelIndex = level - 1;
        } else if (level < HistoryGraph.currentNodeIndex) { // If child.
            dependentLevelIndex = level + 1;
        } else { // If current node.
            HistoryGraph._addNode(nodeID, nodeLabel, [], level);
            isNodeAdded = true;
        }

        // Check if dependent exists in other level.
        if (!isNodeAdded) {
            // Ensure dependent node exists.
            if ($.inArray(dependentNodeName, HistoryGraph.levels[dependentLevelIndex])) {
                // Possible error-handling.
                return false;
            }

            // Add node to graph.
            HistoryGraph._addNode(nodeID, nodeLabel, [dependentNodeName], level);
        }
        if (!HistoryGraph.levels[level]) {
            HistoryGraph.levels[level] = [];
        }
        HistoryGraph.levels[level].push(nodeID);
        return true;
    },

    onNodeClick: function (ev) {
        console.log("Node clicked");
        console.log(ev);
        location.replace(ev.data.node.id)
    },

    tools: {
        messageHandler: function (request, sender, sendResponse, sentFromExt) {
            console.log("History graph received message");

            switch (request.type) {
                case HISTORY_UPDATE:
                    HistoryGraph.drawGraphFromStorage(request.data.list);
                    break;
                case HISTORY_INIT_DATA:
                    // TODO validation with validate.js
                    HistoryGraph.drawGraphFromStorage(request.data.list);
                    break;
                default:
                    console.log("received message." + request);
            }
        }
    }
};

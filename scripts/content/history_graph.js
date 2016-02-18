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
    sig: undefined,

    init: function () {
        // Custom rendering code taken from https://github.com/jacomyal/sigma.js/blob/master/examples/plugin-customShapes.html
        // Custom renderer component for image type nodes.
        sigma.canvas.nodes.image = (function () {
            var _cache = {},
                _loading = {},
                _callbacks = {};
            // Return the renderer itself:
            var renderer = function (node, context, settings) {
                var prefix = settings('prefix') || '',
                    size = node[prefix + 'size'],
                    color = node.color || settings('defaultNodeColor'),
                    url = node.url;
                if (_cache[url]) {
                    context.save();
                    // Draw the clipping disc:
                    context.beginPath();
                    context.arc(
                        node[prefix + 'x'],
                        node[prefix + 'y'],
                        node[prefix + 'size'],
                        0,
                        Math.PI * 2,
                        true
                    );
                    context.closePath();
                    context.clip();
                    // Draw the image
                    context.drawImage(
                        _cache[url],
                        node[prefix + 'x'] - size,
                        node[prefix + 'y'] - size,
                        2 * size,
                        2 * size
                    );
                    // Quit the "clipping mode":
                    context.restore();
                    // Draw the border:
                    context.beginPath();
                    context.arc(
                        node[prefix + 'x'],
                        node[prefix + 'y'],
                        node[prefix + 'size'],
                        0,
                        Math.PI * 2,
                        true
                    );

                    context.lineWidth = size / 5;
                    context.strokeStyle = node.color || settings('defaultNodeColor');
                    context.stroke();
                } else {
                    sigma.canvas.nodes.image.cache(url);
                    sigma.canvas.nodes.def.apply(
                        sigma.canvas.nodes,
                        arguments
                    );
                }
            };
            // Let's add a public method to cache images, to make it possible to
            // preload images before the initial rendering:
            renderer.cache = function (url, callback) {
                if (callback)
                    _callbacks[url] = callback;
                if (_loading[url])
                    return;
                var img = new Image();
                img.onload = function () {
                    _loading[url] = false;
                    _cache[url] = img;
                    if (_callbacks[url]) {
                        _callbacks[url].call(this, img);
                        delete _callbacks[url];
                    }
                };
                _loading[url] = true;
                img.src = url;
            };
            return renderer;
        })();

        HistoryGraph.initialiseSigmaInstance();

        CustomShapes.init(HistoryGraph.sig);
        HistoryGraph.sig.refresh();

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
        HistoryGraph.sig.kill();
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
        HistoryGraph.sig = new sigma({
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

        HistoryGraph.sig.bind('clickNode', HistoryGraph.onNodeClick);
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
                    for (var j = 0; j < HistoryGraph.sig.graph.nodes().length; j++) {
                        var node = HistoryGraph.sig.graph.nodes()[j];
                        if (node.id == currNodeName) {
                            nodeFound = true;
                            break;
                        }
                    }

                    HistoryGraph.sig.graph.nodes()[j].y = yCoord;
                    yCoord += dist;
                }
            }

            // Add node to graph if node found.
            if (nodeFound) {
                HistoryGraph.sig.graph.addNode({
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
                    HistoryGraph.sig.graph.addEdge({
                        id: id,
                        // Reference extremities:
                        source: nodeID,
                        target: target
                    });

                }
            }

            // Refresh the graph.
            HistoryGraph.sig.refresh();
        }
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

    /**
     * Callback function to add new entries to the history.
     * @param source {string} The URL/ID of the source page.
     * @param target {string} The URL/ID of the source page.
     */
    historyUpdate: function (source, target) {
        // TODO finish this function.
        // Delete all current nodes, and add all current nodes.

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
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
            anchors: ["Left", "Right"],
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
        this.addNode(10, "bla", "https://www.wikipedia.org/static/favicon/wikipedia.ico", 3);
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
        //HistoryGraph.instance.kill();
        //HistoryGraph.initialiseSigmaInstance();
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
     * (Re-)Initialise the instance of sigma.js used to draw the graph.
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

    addNode: function (y, title, faviconUrl, column) {
        // Create div.
        var id = utils.guid(); // Create unique id.

        var $div = $(
            '<div class="history_entry">\n    <img class="favicon" align="middle"><x-title>Website title</x-title>\n</div>');

        var $favicon = $('.favicon', $div).attr('src', faviconUrl);
        //$favicon.on('click', QuoteGraph.deleteQuote);
        var $title = $('x-title', $div);
        $title.text("Web title");

        $div.attr('id', id);
        $div.addClass('column-' + column);

        // Append to container.
        $(RIGHT_PANE_SELECTOR).append($div);

        // Set position.
        $div.css({top: y});

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
                    HistoryGraph.drawGraphFromStorage(request.data.list);
                    break;
                default:
                    console.log("received message." + request);
            }
        }
    }
};

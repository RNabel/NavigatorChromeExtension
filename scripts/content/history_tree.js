/**
 * Created by robin on 11/01/16.
 */
function HistoryGraph() {
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

    // Create internal data structure. Level at index 4 is the current node.
    //      Level at index 1 is deepest level of children.
    this.levels = [];
    this.totalLevels = 7;
    this.currentNodeIndex = Math.floor(this.totalLevels / 2); // The index of the centre node.
    this.edgeCount = 0;

    this.maxX = 1.5;
    this.minX = -1.5;
    this.maxY = 3;
    this.minY = -3;

    // Instantiate Sigma object.
    this.sig = new sigma(
        {
            //graph: g, // TODO remove as testing code.
            container: 'rightPane',
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
        }
    );

    CustomShapes.init(this.sig);
    this.sig.refresh();
}

/**
 * Function which places a node in a specific level and interfaces with Sigma's HistoryGraph API.
 * @param nodeName - string; The ID of the node.
 * @param edges - array of strings; ids of parent and child nodes.
 * @param level - integer; the level for node insertion, range: [1 - max level].
 */
HistoryGraph.prototype.addNode = function (nodeName, edges, level) {
    // Code adapted from tutorial:
    // https://github.com/jacomyal/sigma.js/wiki

    if (nodeName !== undefined) {

        // Calculate the location of the node.
        var x,
            y,
            diameter = 3;

        // Calculate y coordinate.
        y = level - this.currentNodeIndex;

        // Calculate x coordinate.
        var numOfNodesInLevel = (this.levels[level] && this.levels[level].length) || 0;

        if (numOfNodesInLevel === 0) {
            x = 0;
        } else {
            var dist = (this.maxY - this.minY) / (numOfNodesInLevel);
            x = this.minY;

            for (var i = 0; i < numOfNodesInLevel; i++) {
                var currNodeName = this.levels[level][i];

                // Find index in graph nodes array.
                for (var j = 0; j < this.sig.graph.nodes().length; j++) {
                    var node = this.sig.graph.nodes()[j];
                    if (node.id == currNodeName) {
                        break;
                    }
                }
                this.sig.graph.nodes()[j].x = x;
                x += dist;
            }
        }

        // Add node to graph.
        this.sig.graph.addNode({
            id: nodeName,
            label: 'x:' + x + ';y:' + y + ';name:' + nodeName,
            x: x,
            y: y,
            size: diameter
        });


        // Add edges to children and parents.
        if (edges !== undefined && edges.constructor === Array) {

            for (i = 0; i < edges.length; i++) {
                var target = edges[i],
                    id = "e" + this.edgeCount++;
                this.sig.graph.addEdge({
                    id: id,
                    // Reference extremities:
                    source: nodeName,
                    target: target
                });

            }
        }

        // Refresh the graph.
        this.sig.refresh();
    }
};

/**
 * HistoryGraph interface function for graph creation from data source, validates input and stated dependencies,
 *     and takes care of positioning.
 * @param level - int; the number of the level [1 - max level]
 * @param nodeName - string; the name of the node to be inserted.
 * @param dependentNodeName - string; the name of the node it connects to.
 * @returns {boolean} - whether the node insertion was successful.
 */
HistoryGraph.prototype.addNodeToLevel = function (level, nodeName, dependentNodeName) {
    // Add the node to the internal data storage.

    if (!(typeof dependentNodeName === 'string') && level != this.currentNodeIndex) {
        // Possible error-checking.
        console.log('No dependent stated for node "' + nodeName + '"')
        return false;
    }

    var dependentLevelIndex;
    var isNodeAdded = false;

    // Find the level of the dependent.
    if (level > this.currentNodeIndex) { // If parent.
        dependentLevelIndex = level - 1;
    } else if (level < this.currentNodeIndex) { // If child.
        dependentLevelIndex = level + 1;
    } else { // If current node.
        this.addNode(nodeName, [], level);
        isNodeAdded = true;
    }

    // Check if dependent exists in other level.
    if (!isNodeAdded) {
        // Ensure dependent node exists.
        if ($.inArray(dependentNodeName, this.levels[dependentLevelIndex])) {
            // Possible error-handling.
            return false;
        }

        // Add node to graph.
        this.addNode(nodeName, [dependentNodeName], level);
    }
    if (!this.levels[level]) {
        this.levels[level] = [];
    }
    this.levels[level].push(nodeName);
    return true;
};
/**
 * Created by robin on 11/01/16.
 */
function initGraph() {
    // Custom renderer component for image type nodes.
    sigma.canvas.nodes.image = (function () {
        var _cache = {},
            _loading = {},
            _callbacks = {};
        // Return the renderer itself:
        var renderer = function (node, context, settings) {
            var args = arguments,
                prefix = settings('prefix') || '',
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
                    args
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

    // Create the graph.
    var g = {
        edges: [
            {
                "id": "e0",
                "source": "main",
                "target": "par1"
            },
            {
                "id": "e1",
                "source": "main",
                "target": "par2"
            },
            {
                "id": "e2",
                "source": "main",
                "target": "par3"
            },
            {
                "id": "e3",
                "source": "par1",
                "target": "par1par1"
            },
            {
                "id": "e4",
                "source": "par1",
                "target": "par1par2"
            },
            {
                "id": "e5",
                "source": "par1",
                "target": "par1par3"
            },
            {
                "id": "e6",
                "source": "child1",
                "target": "main"
            },
            {
                "id": "e7",
                "source": "child2",
                "target": "main"
            }


        ],
        nodes: [
            {
                "id": "main",
                "label": "Current",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": 0,
                "y": 0,
                "size": 2
            },
            {
                "id": "par1",
                "label": "Parent 1",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": -1,
                "y": -1,
                "size": 2
            },
            {
                "id": "par2",
                "label": "Parent 2",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": 0,
                "y": -1,
                "size": 2
            },
            {
                "id": "par3",
                "label": "Parent 3",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": 1,
                "y": -1,
                "size": 2
            },
            {
                "id": "par1par1",
                "label": "Grand parent 1.1",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": -1.5,
                "y": -2,
                "size": 1
            },
            {
                "id": "par1par2",
                "label": "Grand parent 1.2",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": -1,
                "y": -2,
                "size": 1
            },
            {
                "id": "par1par3",
                "label": "Grand parent 1.3",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": -0.5,
                "y": -2,
                "size": 1
            },
            {
                "id": "child1",
                "label": "Child 1",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": -1,
                "y": 1,
                "size": 2
            },
            {
                "id": "child2",
                "label": "Child 2",
                "type": "image",
                "url": "../../Fb_favicon.png",
                "x": 1,
                "y": 1,
                "size": 2
            }

        ]
    };

    // Instantiate Sigma object.
    var sig = new sigma(
        {
            graph: g,
            container: 'rightPane',
            settings: {
                defaultNodeColor: '#ec5148'
            },
            renderer: {
                // IMPORTANT:
                // This works only with the canvas renderer, so the
                // renderer type set as "canvas" is necessary here.
                container: document.getElementById(rightPaneIdentifier),
                type: 'canvas'
            }
        }
    );


    CustomShapes.init(sig);
    sig.refresh();
}

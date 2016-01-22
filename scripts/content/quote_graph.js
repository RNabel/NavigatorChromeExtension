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
    quotes: [], // List of all quotes in the graph.

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
        console.log("WAHEEEY");

        // suspend drawing and initialise.
        this.instance.batch(function () {
            console.log("BAAATCH");
            // configure some drop options for use by all endpoints.
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
                beforeDetach: function (conn) {
                    return confirm("Detach connection?");
                },
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

        jsPlumb.fire("jsPlumbDemoLoaded", instance);
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

        var url = window.location.href;
        var text = ev.originalEvent.dataTransfer.getData('text/plain');
        var html_data = ev.originalEvent.dataTransfer.getData('text/html');
        var source_selector = ev.originalEvent.dataTransfer.getData('src');

        setUpInfoBubble(text, html_data, url, source_selector);
    },
    addNodeExperimental: function (x, y) {
        // Create div.
        var $div = $('<div class="window" id="dragDropWindow5">five<br/><br/><a href="#" class="cmdLink hide" rel="dragDropWindow4">toggle\n    connections</a><br/><a href="#" class="cmdLink drag" rel="dragDropWindow4">disable dragging</a><br/>\n    <a href="#"\n       class="cmdLink detach"\n       rel="dragDropWindow4">detach\n        all</a>\n</div>')

        // Append to container.
        $(LEFT_PANE_SELECTOR).append($div);

        // Set position.
        $div.css({top: y, left: x});

        // Add the endpointTemplate to it.
        this.instance.addEndpoint($div, endpointTemplate);

        // Make all nodes draggable, should use specific id, rather than class.
        this.instance.draggable(jsPlumb.getSelector(".drag-drop-demo .window"));

        // TODO figure out how to position.
    },

    init: function () {
        // Register drag & drop event listeners.
        $(LEFT_PANE_SELECTOR).on('drop', this.drop);
        $(LEFT_PANE_SELECTOR).on('dragover', this.allowDrop);
        $('#' + WEBSITE_CONTENT_WRAPPER).on('dragstart', this.startDrag);
        QuoteGraph.setup(); // Register setup method.
        QuoteGraph.addNodeExperimental(100,100); // TODO delete as experimental.
    }
};


// Function which adds a text bubble to the left pane.
// dataTransfer - the object passed by the drop event.
// originUrl - the origin url of the dropped element.


//QuoteGraph.prototype.addInfoBubble = function (text, html_text, origin_url, source_selector) {
//    console.log('Create new data bubble called with text:\n' + text);
//
//    // Send data to the backend to store.
//    var obj_to_send = {
//        type: 'new_snippet',
//        text: text,
//        html: html_text,
//        url: origin_url,
//        selector: source_selector
//    };
//
//    // Send data to backing store.
//    sendMessage(obj_to_send);
//
//    var $box = this.createQuoteBox(origin_url);
//    $box.text(text);
//
//    // TODO set location of box.
//
//    $(LEFT_PANE_SELECTOR).append($box);
//    // TODO scroll to element. http://stackoverflow.com/a/9272017/3918512
//};
//
//QuoteGraph.prototype.createQuoteBox = function (url) {
//    // Add text box to left pane.
//    var $quoteBox = $('<div onclick="window.open(\'' + url + '\', \'_self\');">').css({
//        'background-color': 'white',
//        width: 100,
//        height: 60,
//        border: '1px solid #eee',
//        'margin-left': '5%', 'margin-top': '30%'
//    });
//
//    var quoteUrl = chrome.extension.getURL('assets/quotes.svg');
//    $quoteBox.append($('<img>').attr('src', quoteUrl).attr('width', '7%').css('margin', '1px 1px'));
//    $quoteBox.append($('<p>').attr('id', QUOTE_BUBBLE_CONTENT_ID));
//
//    return $quoteBox;
//};

(function () {
    jsPlumb.ready(QuoteGraph.init);
})();
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

function QuoteGraph() {
    this.quotes = []; // List of all quotes in the graph.

    // Register drag & drop event listeners.
    $(LEFT_PANE_SELECTOR).on('drop', this.drop);
    $(LEFT_PANE_SELECTOR).on('dragover', this.allowDrop);
    $('#' + WEBSITE_CONTENT_WRAPPER).on('dragstart', this.startDrag);
}

QuoteGraph.prototype.allowDrop = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
};

QuoteGraph.prototype.startDrag = function (ev) {
    var path = $(ev.originalEvent.path[1]).getPath(); // TODO update code to be resilient.
    ev.originalEvent.dataTransfer.setData('src', path);
};

QuoteGraph.prototype.drop = function (ev) {
    ev.preventDefault();

    var url = window.location.href;
    var text = ev.originalEvent.dataTransfer.getData('text/plain');
    var html_data = ev.originalEvent.dataTransfer.getData('text/html');
    var source_selector = ev.originalEvent.dataTransfer.getData('src');

    setUpInfoBubble(text, html_data, url, source_selector);
};

QuoteGraph.prototype.addNode = function () {
    // TODO add node here.
};

// Function which adds a text bubble to the left pane.
// dataTransfer - the object passed by the drop event.
// originUrl - the origin url of the dropped element.

QuoteGraph.prototype.addInfoBubble = function (text, html_text, origin_url, source_selector) {
    console.log('Create new data bubble called with text:\n' + text);

    // Send data to the backend to store.
    var obj_to_send = {
        type: 'new_snippet',
        text: text,
        html: html_text,
        url: origin_url,
        selector: source_selector
    };

    // Send data to backing store.
    sendMessage(obj_to_send);

    var $box = this.createQuoteBox(origin_url);
    $box.text(text);

    // TODO set location of box.

    $(LEFT_PANE_SELECTOR).append($box);
    // TODO scroll to element. http://stackoverflow.com/a/9272017/3918512
};


QuoteGraph.prototype.createQuoteBox = function (url) {
    // Add text box to left pane.
    var $quoteBox = $('<div onclick="window.open(\'' + url + '\', \'_self\');">').css({
        'background-color': 'white',
        width: 100,
        height: 60,
        border: '1px solid #eee',
        'margin-left': '5%', 'margin-top': '30%'
    });

    var quoteUrl = chrome.extension.getURL('assets/quotes.svg');
    $quoteBox.append($('<img>').attr('src', quoteUrl).attr('width', '7%').css('margin', '1px 1px'));
    $quoteBox.append($('<p>').attr('id', QUOTE_BUBBLE_CONTENT_ID));

    return $quoteBox;
};
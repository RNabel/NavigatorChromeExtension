/**
 * Created by Robin Nabel on 30/10/2015.
 */

console.log("Starting to run content script.");

// TODO add left and right side panes
// Adapted from: http://stackoverflow.com/questions/14290428/how-can-a-chrome-extension-add-a-floating-bar-at-the-bottom-of-pages
function addSidePanes() {
    var right = $('<div id="leftPane"></div>');
    var left = $('<div id="rightPane"></div>');

    function addStyle(el, isLeft) {
        el.css({
            'position': 'fixed',
            'top': '0px',
            'width': '20%',
            'height': '100%',
            'background': 'white',
            'z-index': '999999'
        });
        if (isLeft) {
            el.css({
                'left': '0px',
                'box-shadow' : 'inset 0 0 1em black'
            });
        } else {
            el.css({
                'right': '0px',
                'box-shadow' : 'inset 0 0 1em black'
            });
        }
    }

    addStyle(left, true);
    addStyle(right, false);

    $(document.body).append(left);
    $(document.body).append(right);

    // Wrap existing content in div element.
    //var iframeWrapper = $("<iframe></iframe>");
    //iframeWrapper.attr('src', window.location.href);
    //iframeWrapper.attr('style', 'height: 100%; width: 100%');
    //document.body.appendChild(iframeWrapper);

    $(document.body).width('60%');
    $(document.body).css('margin-left', '20%');
    $(document.body).css('position', 'absolute  ');
}

function entryPoint() {
    console.log("Entered entry point.");
    addSidePanes();
}

entryPoint();

console.log("Finished running the file.");
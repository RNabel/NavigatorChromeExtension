/**
 * Created by rn30 on 30/10/2015.
 */

// TODO add left and right side panes
// Adapted from: http://stackoverflow.com/questions/14290428/how-can-a-chrome-extension-add-a-floating-bar-at-the-bottom-of-pages
function addSidePanes() {
    var right = $("<div></div>");
    var left = $("<div></div>");

    function addStyle(el, isLeft) {
        // TODO detect isLeft flag.
        el.attr('style', 'position:fixed;\
                        top:0px;\
                        left:0px;\
                        width:30%;\
                        height:100%;\
                        background:white;\
                        box-shadow:inset 0 0 1em black;\
                        z-index:999999;');
    }

    addStyle(left, true);
    addStyle(right, false);

    $(document.body).append(left);

    // Wrap existing content in div element.
    //var iframeWrapper = $("<iframe></iframe>");
    //iframeWrapper.attr('src', window.location.href);
    //iframeWrapper.attr('style', 'height: 100%; width: 100%');
    //document.body.appendChild(iframeWrapper);
}

function entryPoint() {
    addSidePanes();
}

entryPoint();

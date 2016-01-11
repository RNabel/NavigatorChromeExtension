/**
 * Created by robin on 11/01/16.
 */
function initGraph() {
    // TODO fetch data from backend.
    // Add placeholder to right sidepane.
    sigma.parsers.json('dummy_nodes.json', {
        container: 'rightPane',
        settings: {
            defaultNodeColor: '#ec5148'
        }
    });
}

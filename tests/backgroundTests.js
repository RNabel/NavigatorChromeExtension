/**
 * Created by rn30 on 03/11/15.
 */

QUnit.test( "Test the gui function",  function( assert ) {
    assert.ok(guid().length == 36, "Length of guid is correct.");
    assert.ok(guid().indexOf("-") == 8, "Position of dash is correct.");
});
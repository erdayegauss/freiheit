// This is sanye's first js script for query
// query.js

function joinChannel()
{


  let _str = '';
  var options = {};

  options.channelName = document.channelform.channelName.value;
  options.peers  = document.channelform.peers.value;
  options.username  = "somebody";
  options.orgName  = document.channelform.orgName.value;

  $.when($.post('/fabric/channels/:channelName/peers', options)).done(function(_results)
    {
      _str +='<h2>Here is the join channel result:</h2>';
        _str +='<h4>'+_results+'</h4>';

    });




}



function newChannel()
{

/////////// it is still a crap function,   need more work  //////////
/// 1 configtxgen to generate a channel file, make sure the /////////
/// file name same as channel name, /////////////////////////////////
/// 2 fill the form in browser, first the channelname, then /////////
/// the folder path, and the channel host organization, done ////////


let _str = '';


var options = {};

options.channelName = document.channelform.channelName.value;
options.channelConfigPath  = document.channelform.channelConfigPath.value+document.channelform.channelName.value+".tx";
options.username  = "somebody";
options.orgName  = document.channelform.orgName.value;


$.when($.post('/fabric/channels', options)).done(function(_results)
  {
    _str +='<h2>Here is the channel creation result:</h2>';
      _str +='<h4>'+_results+'</h4>';

      $('#admin-forms').empty();
      $('#admin-forms').append(_str);


  });


}




function newPeer()
{


          let _str = '';


          var options = {};

          options.peerName = document.peerform.peerName.value;
          options.peerOrg  = document.peerform.peerOrg.value;
          options.tlsenabled = "true";
          options.tlscert  = document.peerform.tls.value;



          $.when($.post('/fabric/createPeer', options)).done(function(_results)
            {
              _str +='<h2>Here is the createPeer result:</h2>';
                _str +='<h4>'+_results+'</h4>';

                $('#admin-forms').empty();
                $('#admin-forms').append(_str);



            });



}



function install()
{

/*
The installation parameters are partly from the UI inputs, others are just default values
The instantiation is after the installation.
*/

        let _str = '';


        let options = {};

        options.org = "org1";

        options.peers = document.myform.peers.value;

        options.user = "admin";

        options.chaincodePath = "example_cc";

        options.chaincodeName = document.myform.name.value;

        options.chaincodeVersion = document.myform.version.value;

        options.channelName = "composerchannel";
        options.fcn = "";
        options.args = "a,100,b,200";


        $.when($.post('/fabric/installChaincode', options)).done(function(_results)
          {
            _str +='<h2>Here is the installation result:</h2>';
              _str +='<h4>'+_results+'</h4>';

                        $.when($.post('/fabric/instantiate', options)).done(function(_results)
                          {
                            _str +='<h2>Here is the instantiate result:</h2>';
                              _str +='<h4>'+_results+'</h4>';


                            $('#admin-forms').empty();
                            $('#admin-forms').append(_str);
                          });
          });

}




/**
 * Displays the create order form for the selected buyer
 */
function resetOrderForm()
  {  let toLoad = 'createOrder.html';
     let _orderDiv = $('#orderDiv');
      totalAmount = 0;
      newItems = [];

      // get the order creation web page and also get all of the items that a user can select
      $.when($.get(toLoad), $.get('/composer/client/getItemTable')).done(function (page, _items)
      {
          itemTable = _items[0].items;
          //clean the mess on the _orderDiv
          _orderDiv.empty();
          _orderDiv.append(page[0]);
          // update the page with the appropriate text for the selected language
          updatePage('createOrder');
        // update the page with the appropriate text for the selected language

        $('#seller').val($('#seller option:first').val());
        $('#orderNo').append('xxx');
        $('#status').append('New Order');
        $('#today').append(new Date().toISOString());
        $('#amount').append('$'+totalAmount+'.00');

        // build a select list for the buyers

        // build a select list for the Vendors

        // build a select list for the items
        let _str = '';
        for (let each in itemTable){(function(_idx, _arr){_str+='<option value="'+_idx+'">'+_arr[_idx].itemDescription+'</option>'})(each, itemTable)}
        $('#items').empty();
        $('#items').append(_str);
        // hide the submit new order function until an item has been selected
        $('#submitNewOrder').on('click', function ()
            { let options = {};

            var sel = document.getElementById("buyer");
            options.buyer = sel.options[sel.selectedIndex].text;

            var sel1 = document.getElementById("seller");

            options.seller = sel1.options[sel1.selectedIndex].text;
            options.items = newItems;
            console.log(options);
            _orderDiv.empty(); _orderDiv.append(formatMessage(textPrompts.orderProcess.create_msg));
            $.when($.post('/composer/client/addOrder', options)).done(function(_res)
            {    _orderDiv.empty(); _orderDiv.append(formatMessage(_res.result)); console.log(_res);});
        });
        // function to call when an item has been selected
        $('#addItem').on('click', function ()
        { let _ptr = $('#items').find(':selected').val();
            // remove the just selected item so that it cannot be added twice.
            $('#items').find(':selected').remove();
            // build a new item detail row in the display window
            let _item = itemTable[_ptr];
            let len = newItems.length;
            _str = '<tr><td>'+_item.itemNo+'</td><td>'+_item.itemDescription+'</td><td><input type="number" id="count'+len+'"</td><td id="price'+len+'"></td></tr>';
            $('#itemTable').append(_str);
            // set the initial item count to 1
            $('#count'+len).val(1);
            // set the initial price to the price of one item
            $('#price'+len).append('$'+_item.unitPrice+'.00');
            // add an entry into an array for this newly added item
            let _newItem = _item;
            _newItem.extendedPrice = _item.unitPrice;
            newItems[len] = _newItem;
            newItems[len].quantity=1;
            totalAmount += _newItem.extendedPrice;
            // update the order amount with this new item
            $('#amount').empty();
            $('#amount').append('$'+totalAmount+'.00');
            // function to update item detail row and total amount if itemm count is changed
            $('#count'+len).on('change', function ()
            {let len = this.id.substring(5);
                let qty = $('#count'+len).val();
                let price = newItems[len].unitPrice*qty;
                let delta = price - newItems[len].extendedPrice;
                totalAmount += delta;
                $('#amount').empty();
                $('#amount').append('$'+totalAmount+'.00');
                newItems[len].extendedPrice = price;
                newItems[len].quantity=qty;
                $('#price'+len).empty(); $('#price'+len).append('$'+price+'.00');
            });
        });
        $('#submitNewOrder').show();
    });


}

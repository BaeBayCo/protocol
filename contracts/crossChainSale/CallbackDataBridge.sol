// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Callback.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Callback Data Bridge
/// @author KaeBay on behalf of BaeBay (will dox eventually lmao)

/** @notice this callback is designed to collect data that BaeBay's servers/team can use to
    debit users on a different network to the one this contract is deployed on.
*/

contract CallbackDataBridge is Callback,Ownable{
    //number of addresses that participated on the sale on this network
    uint public lenCounter;
    //the amount purchased in USD (18 dp) per address
    mapping(address => uint) public addressPurchase;
    //the list of buyers, for easier indexing, off chain
    address[] public buyers;

    constructor(address _authorisedReceiver){
        authorisedReceiver  = _authorisedReceiver;
    }

    function _callback(address from, uint amount) override internal{
        // add buyer details if they haven't made a prior purchase for this given sale
        if (addressPurchase[from] == 0){
            buyers.push(from);
            lenCounter++;
        }
        // add purchase amount to total
        addressPurchase[from] += amount;
    }
}
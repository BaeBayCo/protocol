// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Callback.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CallbackDataBridge is Callback,Ownable{
    uint public lenCounter;
    mapping(address => uint) public addressPurchase;
    address[] public buyers;

    constructor(address _authorisedReceiver){
        authorisedReceiver  = _authorisedReceiver;
    }

    function _callback(address from, uint amount) override internal{
        if (addressPurchase[from] == 0){
            buyers.push(from);
            lenCounter++;
        }
        addressPurchase[from] += amount;
    }
}
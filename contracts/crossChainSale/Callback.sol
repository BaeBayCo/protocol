// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICallback.sol";

abstract contract Callback is ICallback{
    address public authorisedReceiver;

    function _callback(address from, uint amount) virtual internal;

    function callback(address from, uint amount) override external{
        require(msg.sender == authorisedReceiver, "Error : Callback : sender is not authorised");
        _callback(from,amount);
    }
}
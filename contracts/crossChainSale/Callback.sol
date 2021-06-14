// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICallback.sol";

/// @title Callback Abstract Template Contract
/// @author KaeBay on behalf of BaeBay (will dox eventually lmao)

/** @notice 
    This contract builds a template for more specific callbacks.
    A callback, in the context of BaeBay's Cross Chain Sale system, 
    is a trigger that is executed open receipt of payment by the HybridTokenSaleReceiver.
**/

abstract contract Callback is ICallback{
    /// @dev should be set to equal the hybrid token sale receiver being used for the given sale
    address public authorisedReceiver;

    function _callback(address from, uint amount) virtual internal;

    function callback(address from, uint amount) override external{
        /// @dev this check prevents random users/contracts from claiming they made payment
        require(msg.sender == authorisedReceiver, "Error : Callback : sender is not authorised");
        _callback(from,amount);
    }
}
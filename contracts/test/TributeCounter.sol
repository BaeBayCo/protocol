// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ITributeManager.sol";

contract TributeCounter is ITributeManager{
    uint public count;
    function doTribute() external override{
        count++;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC1155EscrowManager{
    function release(uint id, uint amount) external;
}
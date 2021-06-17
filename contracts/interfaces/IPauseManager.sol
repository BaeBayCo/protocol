// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPauseManager{
    function setPauser(address pauser, bool status) external;

    function pause() external;

    function unpause() external;
    
}
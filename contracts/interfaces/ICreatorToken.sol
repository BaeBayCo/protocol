// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICreatorToken{
    function burn(uint amount) external;
    function setDumpingAddress(address dump, bool status) external;
    function setTreasury(address _treasury) external;
    function setTributeManager(address _tributeManager) external;
    function unpause() external;
    function pause() external;
}
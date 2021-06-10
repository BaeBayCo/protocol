// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICreatorToken{
    function mint(address to, uint amount) external;
    function burn(uint amount) external;
    function setDumpingAddress(address dump, bool status) external;
    function setTreasury(address _treasury) external;
    function unpause() external;
    function pause() external;
}
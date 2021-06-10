pragma solidity ^0.8.0;

interface ICreatorToken{
    function mint(address to, uint amount) external;
    function unpause() external;
    function pause() external;
}
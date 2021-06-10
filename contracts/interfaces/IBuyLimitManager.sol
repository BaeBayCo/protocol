pragma solidity ^0.8.0;

interface IBuyLimitManager{
    function buyLimit(address user) external returns(uint);
}
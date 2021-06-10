pragma solidity ^0.8.0;

interface ICallback{
    function callback(address from,uint amount) external;
}
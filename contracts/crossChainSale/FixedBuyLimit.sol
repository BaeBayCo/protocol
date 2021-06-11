// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import buyLimitManager interface
import "../interfaces/IBuyLimitManager.sol";

contract FixedBuyLimit is IBuyLimitManager{
    uint limit;
    
    constructor(uint _limit){
        limit = _limit;
    }
    
    function buyLimit(address user) external override returns(uint){
        return limit;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import buyLimitManager interface
import "../interfaces/IBuyLimitManager.sol";

//DO NOT USE IN PRODUCTION

contract MockBuyLimit is IBuyLimitManager{
    uint limit;
    mapping(address => uint) internal userSpecificLimit;
    mapping(address => bool) internal userSpecificLimitSet;
    
    constructor(uint _limit){
        limit = _limit;
    }
    
    function buyLimit(address user) external view override returns(uint){
        if (userSpecificLimitSet[user]) return userSpecificLimit[user];
        return limit;
    }

    function setAddressSpecificLimit(address user, uint amount) external{
        userSpecificLimit[user] = amount;
        userSpecificLimitSet[user] = true;
    }
}
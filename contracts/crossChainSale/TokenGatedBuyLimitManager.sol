// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import buyLimitManager interface
import "../interfaces/IBuyLimitManager.sol";
import "./ERC1155EscrowManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract TokenGatedBuyLimitManager is IBuyLimitManager, ERC1155EscrowManager, Ownable{

    mapping(uint => uint) public idBuyLimit;
    mapping(address => uint) public userBuyLimit;

    constructor(address _tokenAddress,uint _expiry) ERC1155EscrowManager(_expiry, _tokenAddress){}

    function setIdBuyLimit(uint id, uint limit) external onlyOwner{
        require(idBuyLimit[id] == 0, "Error : tokenGatedBuyLimitManager : idBuyLimit already set");
        idBuyLimit[id] = limit;
    }

    function buyLimit(address user) external view override returns(uint){
        return userBuyLimit[user];
    }

    function escrowTokens(uint id, uint amount) external{
        require(idBuyLimit[id] != 0, "Error : tokenGatedBuyLimitManager : invalid token ID");
        _accept(msg.sender, id, amount);
        userBuyLimit[msg.sender] += (idBuyLimit[id]*amount);
    }

}
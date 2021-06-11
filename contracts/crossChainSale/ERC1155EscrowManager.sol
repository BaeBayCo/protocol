// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IERC1155EscrowManager.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract ERC1155EscrowManager is IERC1155EscrowManager{
    address public tokenAddress;

    mapping(uint256 => mapping(address => uint256)) public balances;

    uint public expiry;

    constructor(uint _expiry, address _tokenAddress){
        expiry = _expiry;
        tokenAddress = _tokenAddress;
    }

    function _accept(address user, uint id, uint amount) internal{
        ///move the NFT
        IERC1155(tokenAddress).safeTransferFrom(user,address(this),id,amount,"");
        ///record the move
        balances[id][user] += amount;
        ///event
    }

    function _release(address user, uint id,uint amount) internal{
        require(block.timestamp > expiry, "Error : ERC1155EscrowManager : Expiry time not reached");
        ///move the NFT
        IERC1155(tokenAddress).safeTransferFrom(address(this),user,id,amount,"");
        ///record the move
        balances[id][user] -= amount;
    }

    function release(uint id, uint amount) external override{
        _release(msg.sender, id, amount);
    }

}
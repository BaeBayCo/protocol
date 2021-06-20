// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IERC1155EscrowManager.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/// @title ERC1155 Escrow Manager
/// @author KaeBay on behalf of BaeBay (will dox eventually lmao)

/** @notice This contract handles the locking of NFTs during the duration of redemption events
 */

contract ERC1155EscrowManager is IERC1155EscrowManager,IERC1155Receiver,ERC165{

    /// This contract only supports escrowing of one type of ERC1155 token
    address public tokenAddress;

    /// this is duplicate of the ERC1155 balances data structure
    /// It's here so we can track balanaces 
    mapping(uint256 => mapping(address => uint256)) public balances;

    // When the escrowed tokens can be redeemed
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

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4){
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4){
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function _release(address user, uint id,uint amount) internal{
        require(block.timestamp > expiry, "Error : ERC1155EscrowManager : Expiry time not reached");
        require(balances[id][user] >= amount, "Error : ERC1155EscrowManager : amount > user balance");
        ///move the NFT
        IERC1155(tokenAddress).safeTransferFrom(address(this),user,id,amount,"");
        ///record the move
        balances[id][user] -= amount;
    }

    function release(uint id, uint amount) external override{
        _release(msg.sender, id, amount);
    }

}
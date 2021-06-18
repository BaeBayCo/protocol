// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Callback.sol";
import "../interfaces/ICreatorToken.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@openzeppelin/contracts/security/Pausable.sol";

/// @title Callback (Home Chain Flat Price)
/// @author KaeBay on behalf of BaeBay (will dox eventually lmao)

/** @notice This callback contract sends tokens to users as soon as purchase is made
 */

contract CallbackHomeChainFlatPrice is Ownable,Callback{

    address public saleToken;

    //wallet that holds tokens and has given approval to this contract
    address public stWallet;

    // USD Amount * priceNum / priceDenom = number of tokens
    // these figures must take into account decimal places of the tokens (should all be 18)
    uint public priceNum;
    uint public priceDenom;
    
    //in USD terms
    uint public maxPurchasable;
    uint public totalPurchased;

    constructor(
            address _saleToken,
            address _stWallet,
            address _authorisedReceiver,
            uint _priceNum,
            uint _priceDenom,
            uint _max
        )
        {
            saleToken           = _saleToken;
            stWallet            = _stWallet;
            authorisedReceiver  = _authorisedReceiver;
            priceNum            = _priceNum;
            priceDenom          = _priceDenom;
            maxPurchasable     = _max;
        }

    function setAuthorisedReceiver(address _authorisedReceiver) external onlyOwner{
        authorisedReceiver  = _authorisedReceiver;
    }

    function _callback(address from, uint amount) override internal{
        require(amount + totalPurchased < maxPurchasable, "CallbackHomeChainFlatPrice : Error: maxPurchasable would be exceeded");
        uint amountSaleToken = SafeMath.div(
            SafeMath.mul(amount, priceNum),
            priceDenom
        );
        //unpause sends and re-pauses
        bool saleTokenPaused = Pausable(saleToken).paused();
        if (saleTokenPaused) ICreatorToken(saleToken).unpause();
        SafeERC20.safeTransferFrom(IERC20(saleToken), stWallet, from, amountSaleToken);
        if (saleTokenPaused) ICreatorToken(saleToken).pause();
        totalPurchased += amount;
    } 

    
}
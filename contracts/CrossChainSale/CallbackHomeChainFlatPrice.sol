// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Callback.sol";
import "../interfaces/ICreatorToken.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CallbackHomeChainFlatPrice is Ownable,Callback{

    address public saleToken;
    address public stWallet;

    // USD Amount * priceNum / priceDenom = number of tokens
    // these figures must take into account decimal places of the tokens (should all be 18)
    uint public priceNum;
    uint public priceDenom;
    uint public max;

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
            max                 = _max;
        }

    function setAuthorisedReceiver(address _authorisedReceiver) external onlyOwner{
        authorisedReceiver  = _authorisedReceiver;
    }

    function _callback(address from, uint amount) override internal{
        uint amountSaleToken = SafeMath.div(
            SafeMath.mul(amount, priceNum),
            priceDenom
        );
        SafeERC20.safeTransferFrom(IERC20(saleToken), stWallet, from, amountSaleToken);
    } 

    
}
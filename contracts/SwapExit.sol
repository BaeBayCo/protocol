// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SwapExit is Ownable{

    using SafeERC20 for IERC20;

    address public tokenIn;
    address public tokenOut;
    
    uint public expiry;

    //number of tokens out per token in = num/denom
    uint public num;
    uint public denom;

    constructor(
        address tokenIn_,
        address tokenOut_,
        uint expiry_,
        uint num_,
        uint denom_
    )
    {
        tokenIn = tokenIn_;
        tokenOut = tokenOut_;
        expiry = expiry_;
        num = num_;
        denom = denom_;
    }

    function swap(uint amountIn) external{
        require(block.timestamp < expiry, "SwapExit : Error : Swap period has ended");
        IERC20(tokenIn).safeTransferFrom(msg.sender,address(this),amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender,amountIn*num/denom);
    }

    function ownerClaim(address token) external onlyOwner{
        require(block.timestamp > expiry, "SwapExit : Error : Swap period has not ended yet");
        IERC20 _token = IERC20(token);
        _token.safeTransfer(msg.sender,_token.balanceOf(address(this)));
    }

}
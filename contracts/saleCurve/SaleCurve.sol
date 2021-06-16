// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/ICreatorToken.sol";


abstract contract SaleCurve is Ownable{

    /// @notice all amounts purchased must be in whole multiples of this variable (in wei units)
    uint public multiple;

    /// @notice maximum amount of tokens purchaseable from the contract (in wei units)
    uint public saleLimit;

    /// @notice number of units currently sold (in wei)
    uint public unitsSold;

    /// @notice amount of payment tokens (in wei) accrued by the sale
    uint public revenue;

    uint public endTime;

    /// @notice the token we're selling
    address public saleToken;

    /// @notice the token we're accepting payment in
    address public paymentToken;

    event Buy(uint amountBought, uint amountPaid, address to);

    constructor(
                uint _multiple, 
                uint _saleLimit, 
                uint _endTime, 
                address _saleToken, 
                address _paymentToken
                ) 
            {

        require(_saleLimit % _multiple == 0, "Error : _saleLimit is not multiple of _multiple ");

        multiple       =  _multiple;
        saleLimit      =  _saleLimit;
        endTime        = _endTime;

        saleToken      = _saleToken;
        paymentToken   = _paymentToken;

    }

    function withdraw() external onlyOwner{
        SafeERC20.safeTransfer(
            IERC20(paymentToken),
            owner(),
            IERC20(paymentToken).balanceOf(address(this))
        );
    }

    function buy(uint amountOut, uint maxAmountIn, address to) external{

       //operates on assumption price only goes up, which is true cos a & b can only be positive ints

       require(saleLimit>unitsSold + amountOut,"Error : Not enough tokens remain to complete sale");

       //check end time

       (uint charge, uint amountOutRounded, uint newRevenue) = _computeCharge(amountOut);

       require(amountOutRounded > 0,"Error : Amount requested is below minimum buy quantity");
       require(charge <= maxAmountIn, "Error: token price too high");

       revenue = newRevenue;
       unitsSold += amountOutRounded;

       SafeERC20.safeTransferFrom(IERC20(paymentToken),msg.sender,address(this),charge);
       
       ICreatorToken(saleToken).unpause();
       SafeERC20.safeTransferFrom(IERC20(saleToken),owner(),to,amountOutRounded);
       ICreatorToken(saleToken).pause();

   }

    function computeCharge(uint amountOut) external view returns(uint charge){
        uint amountOutRounded;
        uint newRevenue;
        (charge,amountOutRounded, newRevenue) = _computeCharge(amountOut);
    }

    function _computeCharge(uint amountOut) view internal returns(uint charge, uint amountOutRounded, uint newRevenue){
        uint multiplesOut = SafeMath.div(amountOut,multiple);
        uint multiplesSold = SafeMath.div(unitsSold,multiple);
        uint s = SafeMath.add(multiplesOut,multiplesSold);
        newRevenue = _curveMath(s);
        charge = SafeMath.sub(newRevenue,revenue);
        amountOutRounded = SafeMath.mul(multiplesOut,multiple);
    }

    function _curveMath(uint s) internal virtual view returns (uint newRevenue);

}
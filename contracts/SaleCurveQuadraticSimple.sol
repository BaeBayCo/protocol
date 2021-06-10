pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./SaleCurve.sol";


contract SaleCurveQuadraticSimple is SaleCurve{

    /// @notice ax^2 is the price of the xth unit sold
    /// @notice the cost of a given purchase is equal to (a(s(s+1)(2s+1))/6) - (a(r(r+1)(2r+1))/6)
    /// @notice s = total number of MULTIPLES sold after tx, r = total amount of multiples sold before tx  

    uint public a;

   constructor(uint _multiple, 
               uint _saleLimit,
               uint _creatorShareBP,
               uint _endTime,
               uint _a, 
               address _saleToken, 
               address _paymentToken) 
        SaleCurve(
            _multiple,
            _saleLimit,
            _creatorShareBP,
            _endTime,
            _saleToken, 
            _paymentToken
        )
   {
       a = _a;
   }

   function _curveMath(uint s) internal view override returns (uint newRevenue){

       newRevenue = SafeMath.div(
            SafeMath.mul(
                a,
                SafeMath.mul(
                    s,
                    SafeMath.mul(
                        SafeMath.add(s,1),
                        SafeMath.add(
                            SafeMath.mul(2,s),1
                        )
                    )
                )),
            6
       );

   }

}
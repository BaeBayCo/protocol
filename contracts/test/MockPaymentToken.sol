// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//DO NOT USE IN PRODUCTION

contract MockPaymentToken is ERC20{

    uint8 internal _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
        )
        ERC20(name,symbol){
            _decimals = decimals_;
        }

    function decimals() public view virtual override returns(uint8){
        return _decimals;
    }

    function mint(address to, uint amount) external{
        _mint(to, amount);
    }
    
}
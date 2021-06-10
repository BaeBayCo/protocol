pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICreatorToken.sol";

contract ERC20CreatorToken is ERC20Pausable,Ownable,ICreatorToken{

    constructor (string memory name_, string memory symbol_) ERC20(name_,symbol_){
         _pause();
    }

    function mint(address to, uint amount) external override onlyOwner{
         bool _pauseAfterMint = paused();
         if(_pauseAfterMint)_unpause();
         _mint(to,amount);
         if(_pauseAfterMint)_pause();
    }

    function unpause() external override onlyOwner{
         _unpause();
    }

    function pause() external override onlyOwner{
         _pause();
    }

    //burn function

    //before transfer hook

}
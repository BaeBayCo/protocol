// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/ICreatorToken.sol";
import "./interfaces/ITributeManager.sol";

contract ERC20CreatorToken is ICreatorToken,ERC20Permit,Pausable,Ownable{

     uint public burnBP;
     uint public treasuryBP;

     mapping(address => bool) public isDumpingAddress;

     address public treasury;
     address public tributeManager;

     constructor (string memory name_, string memory symbol_) 
          ERC20(name_,symbol_) ERC20Permit(name_){
               _pause();
               treasury = msg.sender;
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

     function burn(uint amount) external override onlyOwner{
         _burn(owner(), amount);
     }

     function setDumpingAddress(address dump, bool status) external override onlyOwner{
         isDumpingAddress[dump] = status;
     }

     function setTreasury(address _treasury) external override onlyOwner{
         treasury = _treasury; 
     }

     function setTributeManager(address _tributeManager) external override onlyOwner{
          tributeManager = _tributeManager;
     }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override virtual {

        require(!paused(), "ERC20Pausable: token transfer while paused");

        _beforeTokenTransfer(sender, recipient, amount);

         if (isDumpingAddress[recipient]){

              uint burnAmount = SafeMath.div(
                   SafeMath.mul(
                        amount,
                        burnBP
                    ),
                   10000
               );

               uint treasuryAmount = SafeMath.div(
                   SafeMath.mul(
                        amount,
                        treasuryBP
                    ),
                   10000
               );

               amount = SafeMath.sub(
                    amount,
                    SafeMath.add(burnAmount,treasuryAmount)
               );

               _burn(sender, burnAmount);
               _transfer(sender, treasury, treasuryAmount);

               //We're implementing "dumper extracted value"
               if(tributeManager != address(0)) ITributeManager(tributeManager).doTribute();
         }

        super._transfer(sender,recipient,amount);
    }

}
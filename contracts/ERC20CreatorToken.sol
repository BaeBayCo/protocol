// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/ICreatorToken.sol";
import "./interfaces/ITributeManager.sol";

import "./utils/PauseManager.sol";

contract ERC20CreatorToken is ICreatorToken,ERC20Permit,PauseManager{

     uint public burnBP;
     uint public reflectBP;
     uint public treasuryBP;

     uint public denomTotalSupply;
     uint public numerTotalSupply;

     mapping(address => bool) public isDumpingAddress;

     address public treasury;
     address public tributeManager;

     string internal _tokenURI;

     event Reflection(address indexed account, uint indexed amount);

     constructor (
         string memory name_, 
         string memory symbol_, 
         address treasury_, 
         uint maxSupply,
         uint burnBP_,
         uint reflectBP_,
         uint treasuryBP_
         ) 
          ERC20(name_,symbol_) ERC20Permit(name_){
               _pause();
               _mint(treasury_,maxSupply);
               denomTotalSupply = maxSupply;
               numerTotalSupply = maxSupply;
               treasury = treasury_;
               burnBP = burnBP_;
               reflectBP = reflectBP_;
               treasuryBP = treasuryBP_;
     }

    function totalSupply() public view override returns(uint256){
        return numerTotalSupply;
    }

    function tokenURI() public view returns(string memory){
        return _tokenURI;
    }

    //onlyOwner so random users don't do something stupid
     function burn(uint amount) external override onlyOwner{
         _burn(owner(), _getRawAmount(amount));
     }

    //onlyOwner so random users don't do something stupid
    //here for testing & userbase-wide aidrops
     function reflect(uint amount) external onlyOwner{
         _reflect(owner(), amount);
     }

     function setTokenURI(string memory tokenURI_) external onlyOwner{
         _tokenURI = tokenURI_;
     }

     function setDumpingAddress(address dump, bool status) external override onlyOwner{
         isDumpingAddress[dump] = status;
     }

     function setTreasury(address _treasury) external override onlyOwner{
         treasury = _treasury; 
     }

     function setTributeManager(address _tributeManager) external override onlyOwner{
         tributeManager = _tributeManager;
         ITributeManager(tributeManager).doTribute();
     }

    function balanceOf(address account) public view virtual override returns (uint256){
        uint rawBalance = super.balanceOf(account);
        return _getAdjustedAmount(rawBalance);
    }

    function _getAdjustedAmount(uint amountRaw) internal view returns(uint){
        return SafeMath.div(
                        SafeMath.mul(
                            amountRaw,
                            totalSupply()
                        ),
                        denomTotalSupply
                    );
    }

    function _getRawAmount(uint amountAdjusted) internal view returns (uint){
        //(balance*denomTotalSupply)/totalSupply
        return SafeMath.div(
            SafeMath.mul(
                amountAdjusted,
                denomTotalSupply
            ),
            totalSupply()
        );
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override virtual {

        require(!paused(), "ERC20Pausable: token transfer while paused");

        uint rawAmount = _getRawAmount(amount);

        _beforeTokenTransfer(sender, recipient, rawAmount);

         if (isDumpingAddress[recipient] && recipient!=treasury){

              uint burnAmount = SafeMath.div(
                   SafeMath.mul(
                        amount,
                        burnBP
                    ),
                   10000
               );

               uint reflectAmount = SafeMath.div(
                   SafeMath.mul(
                        amount,
                        reflectBP
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

               rawAmount = _getRawAmount(SafeMath.sub(
                                                amount,
                                                SafeMath.add(
                                                    burnAmount,
                                                    SafeMath.add(
                                                        treasuryAmount,
                                                        reflectAmount))
                                        ));

               _burn(sender, burnAmount);
               _reflect(sender,reflectAmount);
               _transfer(sender, treasury, treasuryAmount);

               //We're implementing "dumper extracted value"
               if(tributeManager != address(0)) ITributeManager(tributeManager).doTribute();
         }

        //ERROR IS HERE
        super._transfer(sender,recipient,rawAmount);
        //This is causing emit Transfer(sender,recipient,rawAmount)
        //The event emitted should be Transfer(sender,recipient,amount)
        //The changing of balances is CORRRECT
        //The event data is WRONG
    }

    function _reflect(address account,uint amount) internal {
        uint rawAmount = _getRawAmount(amount);
        denomTotalSupply -= rawAmount;
        super._burn(account,rawAmount);
        emit Reflection(account, amount);
    }

    function _burn(address account, uint256 amount) internal override{
        uint rawAmount = _getRawAmount(amount);
        numerTotalSupply -= amount;
        denomTotalSupply -= rawAmount;
        super._burn(account,rawAmount);
    }

}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IPauseManager.sol";

//should be an abstract contract, will fix in future pull request (will need to modify tests too)

contract PauseManager is IPauseManager,Pausable,Ownable{

    mapping(address => bool) public isPauser;

    event SetPauser(address indexed pauser, bool indexed status);

    function setPauser(address pauser, bool status) external override onlyOwner{
        isPauser[pauser] = status;
        emit SetPauser(pauser, status);
    }

    function pause() external override{
        require(isPauser[msg.sender],"PauseManager : Error : Caller not authorised");
        _pause();
    }

    function unpause() external override{
        require(isPauser[msg.sender],"PauseManager : Error : Caller not authorised");
        _unpause();
    }

}

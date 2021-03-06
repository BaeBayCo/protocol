// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/PauseManager.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import "hardhat/console.sol";

//for gasless polygon purchases for Ethereum users that entered via the bridge
//not being used, but will be in future versions.
//import "@opengsn/contracts/src/BaseRelayRecipient.sol";

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV2V3Interface.sol";

//import callback interface
import "../interfaces/ICallback.sol";

//import buyLimitManager interface
import "../interfaces/IBuyLimitManager.sol";

/// @title Hybrid Token Sale Receiver
/// @author KaeBay on behalf of BaeBay (will dox eventually lmao)

/*** @notice 
    This contract enables us to accept token presale payments consistently in a cross chain context.

    The following are our design priorities :
    - accepting multiple payment tokens
    - consistant implementations that can rolled out on many chains
    - fair sale events and minimisation of whales

    It uses Chainlink pricefeeds to automatically determine the value of tokens in USD.

    To curb whale abuse, we have implemented a feature where USD limit can be set per user 
    - via the buyLimitManager contract.

    Additionaly, the sale can be paused if any undesired behaviour/abuse is detected.

    If the token being launched is on the same chain, 
    an optional callback can be triggered to mint/send the bought token within the purchase call.

    If the token being launched is on a different chain,
    our servers will capture Tx events, to debit the correct amount to the user on the launch chain.

    NOT ALL FEATURES WILL BE USED IN THE FIRST SALE
*/

contract HybridTokenSaleReceiver is PauseManager{

    /// @dev timestamps
    uint public start;
    uint public end;

    /// @dev address that receives the funds
    address public receiverAddress;

    /// @dev where the callback contract is deployed
    address public callbackAddress;

    /// @dev where the buyLimit manager is deployed
    address public buyLimitManager;

    /// @dev the address of the Chainlink price feed of a given token
    mapping(address => address) public paymentTokenPriceFeedAddress;

    /// @dev counter tracking per user spending in a given interval
    mapping(address => uint) public UserUsdWei;

    /// @dev we use this event to track deposits off-chain
    event Deposit(address indexed from, address indexed paymentToken, uint indexed amount);

    constructor(
                uint _start, 
                uint _end, 
                address _receiverAddress,
                address _callbackAddress,
                address _buyLimitManager
            )
        {
            /// @dev sarcastic comments are key to demoralising clueless forkers (lmao read the code first innit)
            require(
                _start < _end, 
                "HybridTokenSaleReceiver : Constructor : start time is after end, dumbass"
                );

            start                   = _start;
            end                     = _end;
            receiverAddress         = _receiverAddress;
            callbackAddress         = _callbackAddress;
            buyLimitManager         = _buyLimitManager;
    }


    function setReceiverAddress(address _receiverAddress) external onlyOwner {
        receiverAddress         = _receiverAddress;
    }


    function setCallbackAddress(address _callbackAddress) external onlyOwner {
        callbackAddress         = _callbackAddress;
    }


    function setBuyLimitManagerAddress(address _buyLimitManager) external onlyOwner {
        buyLimitManager        = _buyLimitManager;
    }


    function setPriceFeed(address token, address feed) external onlyOwner {
        paymentTokenPriceFeedAddress[token]     = feed;
    }

    // a future version of this contract will support gasless deposits, e.g. for ETH mainnet users.
    
    /**function setForwarder(address forwarder) external onlyOwner{
        trustedForwarder = forwarder;
    }**/

    function _computeValueInTokens(address token, uint amountUSD) internal view returns(uint){
        // price/10^oracleDecimals * (wei*10^(18-tokenDecimals))

        AggregatorV2V3Interface priceFeed = AggregatorV2V3Interface(paymentTokenPriceFeedAddress[token]);

        uint latestPrice = uint(priceFeed.latestAnswer());
        uint priceFeedDecimals = priceFeed.decimals();

        uint tokenDecimals = ERC20(token).decimals();

        uint amountPaymentToken = (amountUSD*(10**priceFeedDecimals))/(latestPrice*(10**(18-tokenDecimals)));

        //console.log("AmountUSD : ",amountUSD);
        //console.log("Price : ",latestPrice);
        //console.log("Amount PaymentToken : ",amountPaymentToken);

        return amountPaymentToken;
    }

    function deposit(address token, uint amountUSD) external whenNotPaused{

        require(block.timestamp > start, "HybridTokenSaleReceiver : Error : Sale has not started");
        require(block.timestamp < end, "HybridTokenSaleReceiver : Error : Sale has ended");

        //calculate dollar value using chainlink
        uint amountPaymentToken = _computeValueInTokens(token, amountUSD);
        
        //current amount in interval + amountDollars must be < limit for interval
        require(
            amountUSD + UserUsdWei[_msgSender()] 
                <= 
            IBuyLimitManager(buyLimitManager).buyLimit(_msgSender()), 
            "error: requested deposit would cause total interval spend to exceed limit"
        );

        UserUsdWei[_msgSender()] += amountUSD;

        SafeERC20.safeTransferFrom(IERC20(token),_msgSender(),receiverAddress,amountPaymentToken);

        if (callbackAddress != address(0)) ICallback(callbackAddress).callback(_msgSender(),amountUSD);

        //emit event
        emit Deposit(_msgSender(), token, amountUSD);
    }

}
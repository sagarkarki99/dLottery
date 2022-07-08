//SPDX-License-Identifier:MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

error DLottery__NotEnoughEth();
error DLottery__WinnerTransferFailed();
error DLottery__UpkeepNotNeeded();

contract DLottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    // Type declerations
    enum LotteryState {
        OPEN,
        CALCULATING
    }

    //State Variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATION = 3;
    uint32 private constant NUM_WORDS = 3;
    uint32 private immutable i_callbackGasLimit;
    address payable s_recentWinner;
    uint256 private s_lastTimestamp;
    uint256 private immutable i_interval;
    LotteryState private s_lotteryState = LotteryState.OPEN;

    // Events
    event LotteryEntered(address indexed player);
    event RequestLotterWinner(uint256 indexed requestId);
    event WinnerPicked(address recentWinner);

    // Functions
    constructor(
        address vrfCoordinator,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_interval = interval;
    }

    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert DLottery__UpkeepNotNeeded();
        }
        pickRandomWinner();
    }

    function checkUpkeep(
        bytes memory /*checkData*/
    ) public override returns (bool upkeepNeeded, bytes memory) {
        bool isOpen = s_lotteryState == LotteryState.OPEN;
        bool hasPlayer = s_players.length > 0;
        bool hasAmount = address(this).balance > 0;
        bool timePassed = (block.timestamp - s_lastTimestamp) > i_interval;
        upkeepNeeded = (isOpen && hasPlayer && hasAmount && timePassed);
    }

    function enterInLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert DLottery__NotEnoughEth();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEntered(msg.sender);
    }

    function pickRandomWinner() internal {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATION,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestLotterWinner(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords)
        internal
        virtual
        override
    {
        selectWinner(randomWords[0]);
    }

    function selectWinner(uint256 randomWord) private {
        s_lotteryState = LotteryState.CALCULATING;
        uint256 winnerIndex = randomWord % s_players.length;
        s_recentWinner = s_players[winnerIndex];
        (bool isSuccess, ) = s_recentWinner.call{value: address(this).balance}(
            ""
        );
        resetLottery();
        if (!isSuccess) {
            revert DLottery__WinnerTransferFailed();
        }

        emit WinnerPicked(s_recentWinner);
    }

    // View and Pure
    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function resetLottery() private {
        s_lotteryState = LotteryState.OPEN;
        s_players = new address payable[](0);
        s_lastTimestamp = block.timestamp;
    }
}

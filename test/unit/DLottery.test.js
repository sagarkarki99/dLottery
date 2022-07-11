const { developmentChains } = require('../../helper-hardhat-config');
const { ethers, getNamedAccounts, deployments, network } = require('hardhat');
const { assert, expect } = require('chai');
const { networkConfig } = require('../../helper-hardhat-config');
const { verify } = require('../../utils/verify');


!developmentChains.includes(network.name) ?
    describe.skip
    : describe("DLottery deploy", async function () {
        let dLottery, VRFCoordinatorV2Mock, lotteryEntranceFee, deployer, interval;

        const chainId = network.config.chainId

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            dLottery = await ethers.getContract("DLottery", deployer)
            VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            lotteryEntranceFee = ethers.utils.parseEther("0.01");
            interval = await dLottery.getInterval();
        })

        describe('constructor', () => {
            it('should initialize the DLottery correctly', async () => {
                const state = await dLottery.getLotteryState();

                assert.equal(state.toString(), "0")
                assert.equal(interval.toString(), networkConfig[chainId]["interval"])
            })
        })

        describe('entering in to the lottery', () => {
            it('should revert when money payment is not enough', async () => {
                await expect(dLottery.enterInLottery()).to.be.revertedWith("DLottery__NotEnoughEth");
            })

            it('should successfully register  the player when enough amount is paid', async () => {
                await dLottery.enterInLottery({ value: lotteryEntranceFee });
                const player = await dLottery.getPlayer(0);
                assert.equal(player, deployer)
            })

            it('should emit registered event when player is successfully registered', async () => {
                await expect(dLottery.enterInLottery({ value: lotteryEntranceFee })).to.emit(dLottery, "LotteryEntered");
            })

            it('should not allow to register when lottery is running', async () => {
                await dLottery.enterInLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", [])
                await dLottery.performUpkeep([])
                await expect(dLottery.enterInLottery({ value: lotteryEntranceFee })).to.be.revertedWith("DLottery__LotteryIsInProcess")
            })
        })

        describe('checkUpKeep', async () => {
            it('should return false when people have not sent any ETH', async () => {
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", []);
                const { upkeepNeeded } = await dLottery.callStatic.checkUpkeep([])
                assert(!upkeepNeeded)
            })

            it('should return false if dLottery currently running', async () => {
                await dLottery.enterInLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                await dLottery.performUpkeep([])
                const { upkeepNeeded } = await dLottery.callStatic.checkUpkeep([])
                assert(!upkeepNeeded)
            })

            it('should return false when block time has not passed', async () => {
                await dLottery.enterInLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]);
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await dLottery.callStatic.checkUpkeep([])
                assert(upkeepNeeded)
            })


            it('should return true when block time is passed,has amount,has player and dLottery is not running', async () => {
                await dLottery.enterInLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", [])
                const { upkeepNeeded } = await dLottery.callStatic.checkUpkeep([])
                assert(upkeepNeeded)
            })
        })

        describe('performUpkeep', () => {
            it('should run properly if checkupkeep is true', async () => {
                await dLottery.enterInLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", [])
                const tx = await dLottery.performUpkeep([])
                assert(tx)
            })

            it('should revert if checkupkeep is false', async () => {
                await expect(dLottery.performUpkeep([])).to.be.revertedWith("DLottery__UpkeepNotNeeded")
            })

        })

    });
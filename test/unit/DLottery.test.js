const { developmentChains } = require('../../helper-hardhat-config');
const { ethers, getNamedAccounts, deployments, network } = require('hardhat');
const { assert } = require('chai');
const { networkConfig } = require('../../helper-hardhat-config');


!developmentChains.includes(network.name) ?
    describe.skip
    : describe("DLottery deploy", async function () {
        let dLottery, VRFCoordinatorV2Mock;
        const chainId = network.config.chainId

        beforeEach(async () => {
            const { deployer } = await getNamedAccounts();
            await deployments.fixture(["all"]);
            dLottery = await ethers.getContract("DLottery", deployer)
            VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        })

        describe('constructor', () => {
            it('should initialize the DLottery correctly', async () => {
                const state = await dLottery.getLotteryState();
                const interval = await dLottery.getInterval();
                assert.equal(state.toString(), "0")
                assert.equal(interval.toString(), networkConfig[chainId]["interval"])
            })
        })

    });
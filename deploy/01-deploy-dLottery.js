const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");


const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("20");

module.exports = async function ({ getNamedAccounts, deployments }) {

    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    let vrfCoordinatorAddress, subscriptionId;

    const chainId = network.config.chainId;
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = vrfCoordinatorMock.address;
        const response = await vrfCoordinatorMock.createSubscription();
        const receipt = await response.wait(1);
        subscriptionId = receipt.events[0].args.subId;
        console.log(`SUbscription ID is ${subscriptionId}`);
        await vrfCoordinatorMock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);

    } else {
        console.log("No network name ", network.name);
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    console.log("VRFCoordinator address is ", vrfCoordinatorAddress);
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    const args = [vrfCoordinatorAddress, entranceFee, gasLane, subscriptionId, callbackGasLimit, interval];

    console.log(args);
    const dLottery = await deploy("DLottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmmations: network.config.blockConfirmations || 1,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(dLottery.address, args);
    }

    log("------------------------------------");
}


module.exports.tags = ["all", "DLottery"];
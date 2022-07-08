const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
module.exports = async function ({ getNamedAccounts, deployments }) {

    const BASE_FEE = ethers.utils.parseEther("0.03");
    const GAS_PRICE_LINK = 1e9;

    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    if (developmentChains.includes(network.name)) {
        log("Local networkd detected");

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK]
        });
        log('Mock deployed!!')
        log('------------------------------------')
    }

}

module.exports.tags = ["all", "DLottery"];
import hre, { ethers } from "hardhat";
import { developmentChains } from "../helper-hardhat.config";
import verify from "../utils/verify";
import governanceTokenModule from "../ignition/modules/governance-token";

async function main() {
    console.log("Deploying GovernanceToken Module...");

    const { network } = hre;
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();

    const governanceTokenDeployed = await hre.ignition.deploy(
        governanceTokenModule,
    );

    const governanceToken = governanceTokenDeployed.governanceToken;

    const governanceTokenAddress = await governanceToken.getAddress();

    console.log(`Contract was deployed to: ${governanceTokenAddress}`);

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(governanceTokenAddress, []);
    }

    console.log(`Delegating to ${deployerAddress}`);

    await delegate(governanceTokenAddress, deployerAddress);

    console.log("Delegated!");
}

async function delegate(govTokenAddress: string, delegatedAccount: string) {
    const governanceToken = await ethers.getContractAt(
        "GovernanceToken",
        govTokenAddress,
    );

    const transactionResponse =
        await governanceToken.delegate(delegatedAccount);
    await transactionResponse.wait(1);
    console.log(
        `Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

import hre from "hardhat";
import {
    developmentChains,
    QUORUM_PERCENTAGE,
    VOTING_PERIOD,
    VOTING_DELAY,
} from "../helper-hardhat.config";
import verify from "../utils/verify";
import governorContractModule from "../ignition/modules/governor-contract";
import path from "path";
import fs from "fs";

async function main() {
    console.log("Deploying Governor Contract Module...");

    const { network } = hre;

    const governorContractDeployed = await hre.ignition.deploy(
        governorContractModule,
    );

    const governorContract = governorContractDeployed.governorContract;

    const governorContractAddress = await governorContract.getAddress();

    console.log(`Contract was deployed to: ${governorContractAddress}`);

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        const chainId = network.config.chainId ?? 31337;
        const deploymentPath = path.join(
            __dirname,
            `../ignition/deployments/chain-${chainId}/deployed_addresses.json`,
        );
        const deploymentJson = JSON.parse(
            fs.readFileSync(deploymentPath, "utf8"),
        );

        const governanceTokenAddress =
            deploymentJson["GovernanceTokenModule#GovernanceToken"];
        const timeLockAddress = deploymentJson["TimeLockModule#TimeLock"];

        await verify(governorContractAddress, [
            governanceTokenAddress,
            timeLockAddress,
            QUORUM_PERCENTAGE,
            VOTING_PERIOD,
            VOTING_DELAY,
        ]);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

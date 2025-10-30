import hre from "hardhat";
import {
    developmentChains,
    QUORUM_PERCENTAGE,
    VOTING_PERIOD,
    VOTING_DELAY,
} from "../helper-hardhat.config";
import verify from "../utils/verify";
import governorContractModule from "../ignition/modules/governor-contract";

async function main() {
    console.log("Deploying Box (with Proxy) Module...");

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
        await verify(governorContractAddress, [
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

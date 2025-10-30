import hre from "hardhat";
import { developmentChains, MIN_DELAY } from "../helper-hardhat.config";
import verify from "../utils/verify";
import timeLockModule from "../ignition/modules/time-lock";

async function main() {
    console.log("Deploying Box (with Proxy) Module...");

    const { network } = hre;

    const timeLockDeployed = await hre.ignition.deploy(timeLockModule);

    const timeLock = timeLockDeployed.timeLock;

    const timeLockAddress = await timeLock.getAddress();

    console.log(`Contract was deployed to: ${timeLockAddress}`);

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(timeLockAddress, [MIN_DELAY]);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

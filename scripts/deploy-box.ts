import hre from "hardhat";
import { developmentChains } from "../helper-hardhat.config";
import verify from "../utils/verify";
import boxModule from "../ignition/modules/box";
import fs from "fs";
import path from "path";

async function main() {
    console.log("Deploying Box Module...");

    const { network } = hre;

    const boxDeployed = await hre.ignition.deploy(boxModule);

    const box = boxDeployed.box;

    const boxAddress = await box.getAddress();

    console.log(`Contract was deployed to: ${boxAddress}`);

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(boxAddress, []);
    }

    console.log("Transferring ownership to TimeLock...");

    const chainId = network.config.chainId ?? 31337;

    const deploymentPath = path.join(
        __dirname,
        `../ignition/deployments/chain-${chainId}/deployed_addresses.json`,
    );

    const deploymentJson = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    const timeLockAddress = deploymentJson["TimeLockModule#TimeLock"];

    const transferTx = await box.transferOwnership(timeLockAddress);
    await transferTx.wait(1);

    console.log(`Ownership transferred to TimeLock at ${timeLockAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

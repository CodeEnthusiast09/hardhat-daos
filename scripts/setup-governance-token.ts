import { ethers, network } from "hardhat";
import { ADDRESS_ZERO } from "../helper-hardhat.config";
import path from "path";
import fs from "fs";

async function setupContracts() {
    const [deployer] = await ethers.getSigners();

    const deployerAddress = await deployer.getAddress();

    const chainId = network.config.chainId ?? 31337;

    const deploymentPath = path.join(
        __dirname,
        `../ignition/deployments/chain-${chainId}/deployed_addresses.json`,
    );

    const deploymentJson = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    // --- TimeLock ---
    const timeLockAddress = deploymentJson["TimeLockModule#TimeLock"];

    // Use TimelockController instead of TimeLock
    const timeLock = await ethers.getContractAt(
        // "TimelockController",
        "TimeLock",
        timeLockAddress,
        deployer,
    );

    // --- GovernorContract ---
    const governorContractAddress =
        deploymentJson["GovernorContractModule#GovernorContract"];
    const governor = await ethers.getContractAt(
        "GovernorContract",
        governorContractAddress,
        deployer,
    );

    console.log("----------------------------------------------------");
    console.log("Setting up contracts for roles...");

    const proposerRole = await timeLock.PROPOSER_ROLE();
    const executorRole = await timeLock.EXECUTOR_ROLE();
    const adminRole = await timeLock.DEFAULT_ADMIN_ROLE();

    const governorAddress = await governor.getAddress();

    const proposerTx = await timeLock.grantRole(proposerRole, governorAddress);
    await proposerTx.wait(1);

    const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZERO);
    await executorTx.wait(1);

    const revokeTx = await timeLock.revokeRole(adminRole, deployerAddress);
    await revokeTx.wait(1);

    console.log("Roles setup complete!");
}

setupContracts().catch((error) => {
    console.error(error);
    process.exit(1);
});

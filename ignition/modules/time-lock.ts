// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { MIN_DELAY } from "../../helper-hardhat.config";

const timeLockModule = buildModule("TimeLockModule", (m) => {
    const deployer = m.getAccount(0);

    const timeLock = m.contract(
        "TimeLock",
        [
            MIN_DELAY,
            [], // proposers (empty initially)
            [], // executors (empty initially)
            deployer,
        ],
        {
            from: deployer,
        },
    );

    return { timeLock };
});

export default timeLockModule;

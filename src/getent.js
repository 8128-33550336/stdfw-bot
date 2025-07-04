import { spawn } from "node:child_process";

export const getGetent = async (hostname) => {
    const proc = spawn("ssh", [hostname, "getent passwd"]);
    const output = [];
    const errorOutput = [];
    proc.stdout.on("data", (data) => {
        output.push(data);
    });
    proc.stderr.on("data", (data) => {
        errorOutput.push(data);
    });
    return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`getent command failed with code ${code}: ${errorOutput.toString()}`));
                return;
            }
            const users = output
                .toString("utf8")
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== "")
                .map((line) => {
                    const parts = line.split(":");
                    return {
                        user: parts[0],
                        displayName: parts[4],
                    };
                });
            resolve(users);
        });
    });
};

// console.log(await getGetent("azalea03"));

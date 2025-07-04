import { getRequestDigest } from "./getRequestDigest.js";
import { search } from "./getStudents.js";
import { useCacheIfAvailable } from "../cache.js";
import { getGetent } from "../getent.js";

import { setTimeout } from "node:timers/promises";

const tryForever = async (fn, retry) => {
    try {
        return await fn();
    } catch (error) {
        await retry();
        return await tryForever(fn, retry);
    }
};

const getAllUsers = async () => {
    const getentResult = await getGetent("kiri");
    let requestDigest = await getRequestDigest();

    const results = [];
    for (const user of getentResult) {
        const userEmail = user.user;
        console.log(`Searching for user: ${userEmail}`);

        const result = await tryForever(
            async () => {
                return await useCacheIfAvailable(
                    `share.${userEmail}`,
                    async () => {
                        await setTimeout(1000);
                        return await search(`${userEmail}@u.tsukuba.ac.jp`, requestDigest);
                    },
                    true
                );
            },
            async () => {
                requestDigest = await getRequestDigest();
            }
        );
        const officeUser = result
            .filter((item) => item.EntityType === "User")
            .map((item) => ({
                name: item.DisplayText,
                email: item.EntityData.Email,
            }))[0];
        if (!officeUser) {
            console.warn(`User not found in search: ${userEmail}`);
            continue;
        }
        results.push(officeUser);
    }

    return results;
};

const execute = async (parsedOptions) => {
    if (parsedOptions.reload) {
        console.log("Reloading user data...");
        console.log(await useCacheIfAvailable("share", getAllUsers, false));
    }
    const results = new Map();
    {
        const keyword = parsedOptions.keyword.join(" ");
        const searchQuery = /20\d+$/.test(keyword) ? `s${keyword.slice(2)}` : keyword;
        const requestDigest = await getRequestDigest();
        const result = await search(searchQuery, requestDigest);
        const users = result
            .filter((item) => parsedOptions.group || item.EntityType === "User")
            .map((item) => ({
                name: item.DisplayText,
                email: item.EntityData.Email,
            }));
        for (const user of users) {
            results.set(user.email, user.name);
        }
    }
    {
        const allUsers = await useCacheIfAvailable("share", getAllUsers, true);
        const result = allUsers.filter((user) => {
            return parsedOptions.keyword.every((keyword) => {
                return (
                    (parsedOptions.select.includes("name") && user.name.includes(keyword)) ||
                    (/20\d+$/.test(keyword) && parsedOptions.select.includes("email") && user.email.includes(`s${keyword.slice(2)}`)) ||
                    (parsedOptions.select.includes("email") && user.email.includes(keyword))
                );
            });
            // if (r) {
            //     console.log(`Matched user: ${user.email} - ${user.name}`);
            //     for (const keyword of parsedOptions.keyword) {
            //         console.log(`Keyword: ${keyword}, name: ${parsedOptions.select.includes("name") && user.name.includes(keyword)}`);
            //         console.log(`Keyword: ${keyword}, email: ${/20\d+$/.test(keyword) && parsedOptions.select.includes("email") && user.email.includes(`s${keyword.slice(2)}`)}`);
            //         console.log(`Keyword: ${keyword}, email: ${parsedOptions.select.includes("email") && user.email.includes(keyword)}`);
            //     }
            // }
            // return r;
        });
        for (const user of result) {
            results.set(user.email, user.name);
        }
    }
    return [...results].map(([email, name]) => ({
        name,
        email,
    }));
};

export default execute;

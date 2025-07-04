import { useCacheIfAvailable } from "../cache.js";
import { githubToken, wordListUrl } from "../secrets.js";

const getAllUsers = async () => {
    const res = await fetch(wordListUrl, {
        headers: {
            Authorization: `token ${githubToken}`,
        },
    });
    const data = await res.json();
    const content = Buffer.from(data.content.replaceAll("\n", ""), "base64").toString("utf8");
    return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line_1) => line_1 !== "")
        .filter((line_2) => line_2.startsWith("|"))
        .map((line_3) => line_3.split("|"))
        .map((line_4) => {
            return {
                name: [line_4[4], line_4[5], line_4[10], line_4[9]].join(" / "),
                email: `s${line_4[7].slice(2)}`,
            };
        });
};

/*

        select: select.length > 0 ? select : ["name", "email"], // default to name and email if none specified
        keyword,
*/

const execute = async (parsedOptions) => {
    const allUsers = await useCacheIfAvailable("word", getAllUsers, parsedOptions.cache);

    const result = allUsers.filter((user) => {
        return parsedOptions.keyword.every((keyword) => {
            return (parsedOptions.select.includes("name") && user.name.includes(keyword)) || (parsedOptions.select.includes("email") && user.email.includes(keyword));
        });
    });

    return result;
};

export default execute;

#!/home/pi/.nvm/versions/node/v22.14.0/bin/node

import { Client, GatewayIntentBits, Events } from "discord.js";
// import { executeSearchStudent } from "./sharepoint/commandSearchId.js";
import searchWord from "./word/command.js";
import searchCoins from "./coins/command.js";
import searchSharePoint from "./sharepoint/command.js";
import { allowedServerIds, discordToken } from "./secrets.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, , GatewayIntentBits.MessageContent],
});
client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
});

const parseOptions = (options) => {
    const select = [];
    let group = false;
    let cache = true;
    let reload = false;
    const typeList = [];
    const keyword = [];

    // change clasic for
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.startsWith("-")) {
            // default name and email
            if (option === "-n" || option === "--name") {
                select.push("name");
            } else if (option === "-e" || option === "--email") {
                select.push("email");
            } else if (option === "-g" || option === "--group") {
                // include group
                group = true;
            } else if (option === "-C" || option === "--nocache") {
                cache = false;
            } else if (option === "-r" || option === "--reload") {
                reload = true;
            } else if (option === "-t" || option === "--type") {
                const nextOption = options[i + 1];
                if (nextOption !== undefined) {
                    if (nextOption.startsWith("-")) {
                        return {
                            error: `Expected type after ${option}, but got another option: ${nextOption}`,
                        };
                    } else {
                        const types = {
                            share: ["share", "s", "office", "o"],
                            coins: ["coins", "c"],
                            word: ["word", "w"],
                            // "entra": ["entra", "e"],
                        };
                        const type = Object.keys(types).find((key) => types[key].includes(nextOption));
                        if (!type) {
                            return {
                                error: `Unknown type: ${nextOption}`,
                            };
                        }
                        typeList.push(type);
                        i++; // Skip the next option since it's the type
                    }
                } else {
                    return {
                        error: `Expected type after ${option}, but no argument provided`,
                    };
                }
            } else if (option === "--") {
                keyword.push(...options.slice(i + 1));
                break; // Stop processing further options
            } else if (option === "-h" || option === "--help") {
                return {
                    error: [
                        "使い方: !student [オプション] [キーワード]",
                        "-n, --name      名前で検索（デフォルト：名前とメール）",
                        "-e, --email     メールで検索（デフォルト：名前とメール）",
                        "-g, --group     グループも表示（デフォルト：非表示）",
                        "-C, --nocache   キャッシュ無効（デフォルト：使用）",
                        "-r, --reload    データ再読み込み",
                        "-t, --type <タイプ> タイプ指定（share / coins / word）（デフォルト：全部）",
                        "-h, --help      ヘルプ",
                    ].join("\n"),
                };
            } else {
                console.warn(`Unknown option: ${option}`);
                return null; // Stop processing further
            }
        } else {
            keyword.push(option);
        }
    }
    if (keyword.length === 0) {
        return {
            error: "キーワードを指定してください。",
        };
    }
    if (!cache && reload) {
        return {
            error: "キャッシュを無効の場合、再読み込みはできません。",
        };
    }
    return {
        select: select.length > 0 ? select : ["name", "email"], // default to name and email if none specified
        group,
        cache,
        reload,
        type: typeList.length > 0 ? typeList : ["share", "coins", "word"], // default to all types if none specified
        keyword,
    };
};

const processCommand = async (options) => {
    const parsedOptions = parseOptions(options);
    if (parsedOptions?.error) {
        throw new Error(parsedOptions.error);
    }

    console.log(`Parsed options: ${JSON.stringify(parsedOptions)}`);

    const result = [];

    if (parsedOptions.type.includes("word")) {
        result.push(...(await searchWord(parsedOptions)).map((v) => ({ type: "word", name: v.name, email: v.email })));
    }

    if (parsedOptions.type.includes("coins")) {
        result.push(...(await searchCoins(parsedOptions)).map((v) => ({ type: "coins", name: v.name, email: v.email })));
    }
    if (parsedOptions.type.includes("share")) {
        result.push(...(await searchSharePoint(parsedOptions)).map((v) => ({ type: "share", name: v.name, email: v.email })));
    }
    console.log(options, parsedOptions, result);

    return result;
};

const resultToString = (result) => {
    const userMap = new Map();
    for (const item of result) {
        if (item.email.match(/s\d{7}/)) {
            userMap.set("20" + item.email.match(/s\d{7}/)[0].slice(1), item.name);
        }
    }

    return "検索結果:\n" + result.map((item) => `[${item.type.padEnd(5, " ")}] ${item.email}: ${item.name}`).join("\n") + "\n" + [...userMap].map(([id, name]) => `${id} ${name}`).join("\n");
};

console.log(`process.argv.length: ${process.argv.length} ${process.argv}`);
if (process.argv.length > 2) {
    const options = process.argv.slice(2);
    console.log(`Received command line options: ${options.join(" ")}`);
    try {
        const result = await processCommand(options);
        console.log(resultToString(result));
    } catch (error) {
        console.error("Error processing command:", error);
        process.exit(1);
    }
} else {
    // ! message start with !student
    client.on(Events.MessageCreate, async (message) => {
        console.log(`Received message: ${message.content}`);
        if (message.author.bot) return;

        if (!allowedServerIds.includes(message.guildId)) {
            await message.reply("このサーバーでは使用できません。");
            return;
        }

        const command = message.content.split(" ")[0];

        if (command !== "!student") {
            return;
        }

        const options = message.content.split(" ").slice(1);
        try {
            const result = await processCommand(options);
            const resultString = resultToString(result);
            const messageLengthMax = 1990; // Discord message limit
            const messageLengthSomMax = messageLengthMax * 3;

            if (resultString.length > messageLengthSomMax) {
                await message.reply({ content: `検索結果が長すぎます。(${result.length} 件,  ${resultString.length} 文字)`, ephemeral: true });
                await message.reply({ content: resultString.slice(0, messageLengthMax), ephemeral: true });
                return;
            }

            const splitBy15Chars = (str) => Array.from({ length: Math.ceil(str.length / messageLengthMax) }, (_, i) => str.slice(i * messageLengthMax, (i + 1) * messageLengthMax));
            const chunks = splitBy15Chars(resultString);

            console.log(chunks);
            for (const chunk of chunks) {
                await message.reply({ content: chunk, ephemeral: true });
            }
        } catch (error) {
            await message.reply({ content: "" + error, ephemeral: true });
        }
    });

    client.login(discordToken).catch((error) => {
        console.error("Failed to login:", error);
        process.exit(1);
    });
}

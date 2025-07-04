// install dotenv expand
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand.expand(dotenv.config());

// move to .env file

export const rtFa = process.env.RTFA || "";
export const FedAuth = process.env.FEDAUTH || "";
export const discordToken = process.env.DISCORD_TOKEN || "";
export const o365SharepointUrl = process.env.O365_SHAREPOINT_URL || "";
export const allowedServerIds = (process.env.ALLOWED_GUILDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");

export const githubToken = process.env.GITHUB_TOKEN || "";
export const wordListUrl = process.env.WORD_LIST_URL || "";

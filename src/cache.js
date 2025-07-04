import { readFile, writeFile } from "fs/promises";

const cacheFileRoot = "./cache/";

export const useCacheIfAvailable = async (cacheKey, fetchFunction, useCache) => {
    const filePath = `${cacheFileRoot}${cacheKey}.json`;

    try {
        if (!useCache) {
            console.log(`Cache not used for ${cacheKey}`);
            throw new Error("Cache not used");
        }
        const data = await readFile(filePath, "utf8");
        console.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(data);
    } catch {
        console.log(`Cache miss for ${cacheKey}`);
        const result = await fetchFunction();
        await writeFile(filePath, JSON.stringify(result, null, 4), "utf8");
        console.log(`Cache written for ${cacheKey}`);
        return result;
    }
};

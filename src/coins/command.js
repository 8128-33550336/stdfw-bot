import { useCacheIfAvailable } from "../cache.js";
import { getGetent } from "../getent.js";

const getAllUsers = async () => {
    const getentResult = await getGetent("azalea03");
    // {user: "{email}", displayName: "{name}"}[]
    return getentResult.map((user) => ({
        name: user.displayName,
        email: user.user,
    }));
};

const execute = async (parsedOptions) => {
    const allUsers = await useCacheIfAvailable("coins", getAllUsers, parsedOptions.cache);

    const result = allUsers.filter((user) => {
        return parsedOptions.keyword.every((keyword) => {
            return (parsedOptions.select.includes("name") && user.name.includes(keyword)) || (parsedOptions.select.includes("email") && user.email.includes(keyword));
        });
    });

    return result;
};

export default execute;

import { FedAuth, o365SharepointUrl, rtFa } from "../secrets.js";

export const search = async (query, requestDigest) => {
    console.log(query);
    return fetch(`${o365SharepointUrl}/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.ClientPeoplePickerSearchUser`, {
        method: "POST",
        headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            Cookie: `rtFa=${rtFa}; FedAuth=${FedAuth}`,
            "x-requestdigest": requestDigest,
            // collectspperfmetrics: "SPSQLQueryCount",
        },
        body: JSON.stringify({
            queryParams: {
                QueryString: query,
                MaximumEntitySuggestions: 100,
            },
        }),
    })
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            return JSON.parse(result.d.ClientPeoplePickerSearchUser);
        })
        .catch((error) => {
            console.error(error);
            throw error;
        });
};

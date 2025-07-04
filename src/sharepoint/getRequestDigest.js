import { FedAuth, o365SharepointUrl, rtFa } from "../secrets.js";

export const getRequestDigest = () => {
    return fetch(`${o365SharepointUrl}/_layouts/15/sharedialog.aspx`, {
        method: "GET",
        headers: {
            Cookie: `rtFa=${rtFa}; FedAuth=${FedAuth}`,
        },
    })
        .then((response) => {
            console.log(response.status);
            return response.text();
        })
        .then((result) => {
            // console.log(result);
            const digestKeyIndex = result.indexOf('"formDigestValue":');
            if (digestKeyIndex === -1) {
                throw new Error("Request digest not found in response");
            }
            const digestStartIndex = result.indexOf(":", digestKeyIndex) + 2;
            const digestEndIndex = result.indexOf('"', digestStartIndex);
            const requestDigest = result.slice(digestStartIndex, digestEndIndex);
            console.log(`Digest found at indices: ${digestStartIndex} to ${digestEndIndex}: ${requestDigest}`);
            return requestDigest;
        })
        .catch((error) => {
            console.error(error);
            throw new Error(`Failed to fetch request digest: ${error.message}`);
        });
};

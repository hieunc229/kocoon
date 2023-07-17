"use strict";
function extractParamsFromURL(urlPattern, url) {
    const params = {};
    // Remove any leading/trailing slashes and split the URL pattern and URL by slashes
    const patternParts = urlPattern.replace(/^\/+|\/+$/g, "").split("/");
    const urlParts = url.replace(/^\/+|\/+$/g, "").split("/");
    // Iterate over the pattern parts
    patternParts.forEach((part, index) => {
        // Check if the part matches the param placeholder format
        if (part.startsWith(":")) {
            const paramName = part.slice(1); // Remove the leading colon
            const paramValue = urlParts[index]; // Get the corresponding value from the URL
            params[paramName] = paramValue; // Set the param with its value
        }
    });
    return params;
}

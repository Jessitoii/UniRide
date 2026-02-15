/**
 * A utility to safely parse JSON strings or return the original value if it's not a string.
 * This helper prevents double-parsing errors and unexpected token crashes when APIs
 * or navigation parameters return objects instead of the expected JSON strings.
 * 
 * @param input The value to safeguard. Can be a JSON string, an object, or null/undefined.
 * @returns The parsed object if input was a valid JSON string, or the input itself if it was already an object/primitive.
 */
export const safeParse = <T = any>(input: any): T => {
    if (input === null || input === undefined) {
        return input;
    }

    if (typeof input === 'string') {
        try {
            const firstParse = JSON.parse(input);
            // Handle double-encoded strings (common in some legacy APIs)
            if (typeof firstParse === 'string') {
                try {
                    return JSON.parse(firstParse);
                } catch {
                    return firstParse; // Return singly parsed string if second parse fails
                }
            }
            return firstParse;
        } catch (error) {
            console.warn('safeParse: Failed to parse string, returning original value.', error);
            return input; // Fallback to original string on failure
        }
    }

    // Input is already an object or primitive (number, boolean)
    return input;
};

import { supabase, getAuthUser } from "../lib/supabase";
import { withRetry } from "../utils/retryWithBackoff";

// Convert snake_case to camelCase
const toCamelCase = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj?.map(toCamelCase);
    if (typeof obj !== "object") return obj;

    return Object.keys(obj)?.reduce((acc, key) => {
        const camelKey = key?.replace(/_([a-z])/g, (_, letter) => letter?.toUpperCase());
        acc[camelKey] = toCamelCase(obj?.[key]);
        return acc;
    }, {});
};

// Convert camelCase to snake_case
const toSnakeCase = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj?.map(toSnakeCase);
    if (typeof obj !== "object") return obj;

    return Object.keys(obj)?.reduce((acc, key) => {
        const snakeKey = key?.replace(/[A-Z]/g, (letter) => `_${letter?.toLowerCase()}`);
        acc[snakeKey] = toSnakeCase(obj?.[key]);
        return acc;
    }, {});
};

// Check if error is schema cache related
const isSchemaError = (error) => {
    if (!error) return false;

    if (error?.code && typeof error?.code === "string") {
        const errorClass = error?.code?.substring(0, 2);
        if (errorClass === "42" || errorClass === "08") {
            return true;
        }
        if (errorClass === "23") {
            return false;
        }
    }

    if (error?.message) {
        const schemaErrorPatterns = [
            /relation.*does not exist/i,
            /column.*does not exist/i,
            /function.*does not exist/i,
            /syntax error/i,
            /invalid.*syntax/i,
            /type.*does not exist/i,
            /undefined.*column/i,
            /undefined.*table/i,
            /undefined.*function/i,
            /schema cache/i,
            /could not find.*table/i,
        ];

        return schemaErrorPatterns?.some((pattern) => pattern?.test(error?.message));
    }

    return false;
};

export const externalTradeService = {
    // Get all trades for current user
    async getAllTrades() {
        return withRetry(async () => {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("external_trades")
                ?.select("*")
                ?.eq("user_id", user?.id)
                ?.order("created_at", { ascending: false });

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                return [];
            }

            return toCamelCase(data || []);
        }, "getAllTrades");
    },

    // Get single trade by ID
    async getTradeById(id) {
        return withRetry(async () => {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("external_trades")
                ?.select("*")
                ?.eq("id", id)
                ?.eq("user_id", user?.id)
                ?.maybeSingle();

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                return null;
            }

            return toCamelCase(data);
        }, `getTradeById(${id})`);
    },

    // Create new trade (trade_code will be auto-generated)
    async createTrade(tradeData) {
        return withRetry(async () => {
            const user = await getAuthUser();

            const snakeCaseData = toSnakeCase({
                ...tradeData,
                userId: user?.id,
                tradeCode: "", // Empty string triggers auto-generation
            });

            const { data, error } = await supabase?.from("external_trades")?.insert(snakeCaseData)?.select()?.single();

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error(error.message || "Failed to create trade");
            }

            return toCamelCase(data);
        }, "createTrade");
    },

    // Update trade
    async updateTrade(id, tradeData) {
        try {
            const user = await getAuthUser();

            const snakeCaseData = toSnakeCase(tradeData);

            const { data, error } = await supabase
                ?.from("external_trades")
                ?.update(snakeCaseData)
                ?.eq("id", id)
                ?.eq("user_id", user?.id)
                ?.select()
                ?.single();

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error(error.message || "Failed to update trade");
            }

            return toCamelCase(data);
        } catch (error) {
            console.error("Error updating trade:", error);
            throw error;
        }
    },

    // Delete trade
    async deleteTrade(id) {
        try {
            const user = await getAuthUser();

            const { error } = await supabase?.from("external_trades")?.delete()?.eq("id", id)?.eq("user_id", user?.id);

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error(error.message || "Failed to delete trade");
            }

            return true;
        } catch (error) {
            console.error("Error deleting trade:", error);
            throw error;
        }
    },
};

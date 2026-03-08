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

export const additionalScopeService = {
    // Get all scopes for current user
    async getAllScopes() {
        return withRetry(async () => {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("additional_scopes")
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
        }, "getAllScopes");
    },

    // Get single scope by ID
    async getScopeById(id) {
        return withRetry(async () => {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("additional_scopes")
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
        }, `getScopeById(${id})`);
    },

    // Create new scope (scope_code will be auto-generated)
    async createScope(scopeData) {
        return withRetry(async () => {
            const user = await getAuthUser();

            const snakeCaseData = toSnakeCase({
                ...scopeData,
                userId: user?.id,
                scopeCode: "", // Empty string triggers auto-generation
            });

            const { data, error } = await supabase
                ?.from("additional_scopes")
                ?.insert(snakeCaseData)
                ?.select()
                ?.single();

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error(error.message || "Failed to create scope");
            }

            return toCamelCase(data);
        }, "createScope");
    },

    // Update scope
    async updateScope(id, scopeData) {
        try {
            const user = await getAuthUser();

            const snakeCaseData = toSnakeCase(scopeData);

            const { data, error } = await supabase
                ?.from("additional_scopes")
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
                throw new Error(error.message || "Failed to update scope");
            }

            return toCamelCase(data);
        } catch (error) {
            console.error("Error updating scope:", error);
            throw error;
        }
    },

    // Delete scope
    async deleteScope(id) {
        try {
            const user = await getAuthUser();

            const { error } = await supabase
                ?.from("additional_scopes")
                ?.delete()
                ?.eq("id", id)
                ?.eq("user_id", user?.id);

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error(error.message || "Failed to delete scope");
            }

            return true;
        } catch (error) {
            console.error("Error deleting scope:", error);
            throw error;
        }
    },
};

import { supabase, getAuthUser } from "../lib/supabase";
import { withRetry } from "../utils/retryWithBackoff";

function isSchemaError(error) {
    if (!error) return false;

    if (error?.code && typeof error?.code === "string") {
        const errorClass = error?.code?.substring(0, 2);
        if (errorClass === "42") return true;
        if (errorClass === "23") return false;
        if (errorClass === "08") return true;
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
        ];
        return schemaErrorPatterns?.some((pattern) => pattern?.test(error?.message));
    }

    return false;
}

function isNetworkError(error) {
    if (!error) return false;

    const networkErrorPatterns = [
        /failed to fetch/i,
        /network error/i,
        /unable to connect/i,
        /connection refused/i,
        /timeout/i,
        /aborted/i,
    ];

    return networkErrorPatterns?.some((pattern) => pattern?.test(error?.message) || pattern?.test(error?.toString()));
}

function handleError(error, context = "") {
    if (isSchemaError(error)) {
        console.error(`Schema error ${context}:`, error?.message);
        throw error;
    }

    if (isNetworkError(error)) {
        console.error(`Network error ${context}:`, error?.message);
        throw new Error("Unable to connect to the database. Please check your internet connection and try again.");
    }

    console.error(`Data error ${context}:`, error?.message || error);
    throw error;
}

export const materialService = {
    async getAllMaterials() {
        return withRetry(async () => {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("materials_library")
                ?.select("*")
                ?.eq("user_id", user?.id)
                ?.order("created_at", { ascending: false });

            if (error) {
                handleError(error, "in getAllMaterials");
            }

            return data || [];
        }, "getAllMaterials");
    },

    async getMaterialById(id) {
        try {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("materials_library")
                ?.select("*")
                ?.eq("id", id)
                ?.eq("user_id", user?.id);

            if (error) {
                handleError(error, "in getMaterialById");
            }

            return data?.[0] || null;
        } catch (error) {
            if (isNetworkError(error)) {
                throw error; // Already formatted by handleError
            }
            console.error("Get material error:", error);
            throw error;
        }
    },

    async searchMaterials(searchQuery, categoryFilter = null) {
        try {
            const user = await getAuthUser();

            let query = supabase
                ?.from("materials_library")
                ?.select("*")
                ?.eq("user_id", user?.id)
                ?.eq("is_active", true);

            if (searchQuery) {
                query = query?.or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
            }

            if (categoryFilter) {
                query = query?.eq("category", categoryFilter);
            }

            query = query?.order("name", { ascending: true });

            const { data, error } = await query;

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error("Search materials error:", error);
            throw error;
        }
    },

    async createMaterial(materialData) {
        try {
            const user = await getAuthUser();

            // Build CSI code from form data
            const categoryPrefix = materialData?.category?.substring(0, 2) || "00";
            const code1 = materialData?.csiCode1?.padStart(2, "0") || "00";
            const code2 = materialData?.csiCode2?.padStart(2, "0") || "00";
            const csiCode = `${categoryPrefix}.${code1}.${code2}`;

            const { data, error } = await supabase
                ?.from("materials_library")
                ?.insert({
                    user_id: user?.id,
                    name: materialData?.name,
                    description: materialData?.description || null,
                    unit_cost: materialData?.unitCost || 0,
                    unit: materialData?.unit || "piece",
                    category: materialData?.category || "01_General Requirements",
                    csi_code: csiCode,
                    is_active: true,
                })
                ?.select();

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw error;
            }

            // Handle array response - return first item or null
            return data?.[0] || null;
        } catch (error) {
            console.error("Create material error:", error);
            throw error;
        }
    },

    async updateMaterial(id, materialData) {
        try {
            const user = await getAuthUser();

            // Build CSI code from form data if provided
            let updateData = {
                name: materialData?.name,
                description: materialData?.description,
                unit_cost: materialData?.unitCost,
                unit: materialData?.unit,
                category: materialData?.category,
                updated_at: new Date()?.toISOString(),
            };

            // Only update CSI code if the component provides the parts
            if (materialData?.csiCode1 !== undefined && materialData?.csiCode2 !== undefined) {
                const categoryPrefix = materialData?.category?.substring(0, 2) || "00";
                const code1 = materialData?.csiCode1?.padStart(2, "0") || "00";
                const code2 = materialData?.csiCode2?.padStart(2, "0") || "00";
                updateData.csi_code = `${categoryPrefix}.${code1}.${code2}`;
            }

            const { data, error } = await supabase
                ?.from("materials_library")
                ?.update(updateData)
                ?.eq("id", id)
                ?.eq("user_id", user?.id)
                ?.select();

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error("Failed to update material");
            }

            // Handle the response - data is an array, return first item or null
            const updatedMaterial = data?.[0] || null;

            if (!updatedMaterial) {
                console.warn("No rows were updated for material ID:", id);
            }

            return updatedMaterial;
        } catch (error) {
            console.error("Update material error:", error);
            throw error;
        }
    },

    async deleteMaterial(id) {
        try {
            const user = await getAuthUser();

            const { error } = await supabase
                ?.from("materials_library")
                ?.update({ is_active: false })
                ?.eq("id", id)
                ?.eq("user_id", user?.id);

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw error;
            }

            return true;
        } catch (error) {
            console.error("Delete material error:", error);
            throw error;
        }
    },

    async getMaterialsByCategory(category) {
        try {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("materials_library")
                ?.select("*")
                ?.eq("user_id", user?.id)
                ?.eq("category", category)
                ?.eq("is_active", true)
                ?.order("name", { ascending: true });

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error("Get materials by category error:", error);
            throw error;
        }
    },
};

export default materialService;

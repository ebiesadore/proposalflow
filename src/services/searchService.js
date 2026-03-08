import { supabase, getAuthUser } from "../lib/supabase";

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

export const searchService = {
    /**
     * Search across all modules (proposals, clients, templates)
     * @param {string} query - Search query string
     * @param {Object} filters - Filter options
     * @returns {Object} - Search results grouped by module
     */
    async searchAll(query, filters = {}) {
        try {
            const user = await getAuthUser();

            const results = {
                proposals: [],
                clients: [],
                templates: [],
                total: 0,
            };

            // Search proposals
            if (!filters?.modules || filters?.modules?.includes("proposals")) {
                const proposalResults = await this.searchProposals(query, filters, user?.id);
                results.proposals = proposalResults;
                results.total += proposalResults?.length;
            }

            // Search clients
            if (!filters?.modules || filters?.modules?.includes("clients")) {
                const clientResults = await this.searchClients(query, filters, user?.id);
                results.clients = clientResults;
                results.total += clientResults?.length;
            }

            // Search templates
            if (!filters?.modules || filters?.modules?.includes("templates")) {
                const templateResults = await this.searchTemplates(query, filters, user?.id);
                results.templates = templateResults;
                results.total += templateResults?.length;
            }

            return results;
        } catch (error) {
            handleError(error, "in searchAll");
            throw error;
        }
    },

    /**
     * Search proposals
     */
    async searchProposals(query, filters = {}, userId) {
        try {
            let queryBuilder = supabase
                ?.from("proposals")
                ?.select(
                    `
          *,
          client:clients!client_id(company_name, email)
        `,
                )
                ?.eq("user_id", userId);

            // Text search
            if (query) {
                queryBuilder = queryBuilder?.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
            }

            // Status filter
            if (filters?.status && filters?.status?.length > 0) {
                queryBuilder = queryBuilder?.in("status", filters?.status);
            }

            // Client filter
            if (filters?.clientId) {
                queryBuilder = queryBuilder?.eq("client_id", filters?.clientId);
            }

            // Date range filter
            if (filters?.dateFrom) {
                queryBuilder = queryBuilder?.gte("created_at", filters?.dateFrom);
            }
            if (filters?.dateTo) {
                queryBuilder = queryBuilder?.lte("created_at", filters?.dateTo);
            }

            // Value range filter
            if (filters?.valueMin) {
                queryBuilder = queryBuilder?.gte("value", filters?.valueMin);
            }
            if (filters?.valueMax) {
                queryBuilder = queryBuilder?.lte("value", filters?.valueMax);
            }

            queryBuilder = queryBuilder?.order("created_at", { ascending: false });

            const { data, error } = await queryBuilder;

            if (error) {
                handleError(error, "in searchProposals");
            }

            return (data || [])?.map((item) => ({
                ...item,
                module: "proposals",
                displayTitle: item?.title,
                displaySubtitle: item?.client?.company_name || "No client",
                displayMeta: `${item?.status} • ${item?.value || "No value"}`,
            }));
        } catch (error) {
            console.error("Search proposals error:", error);
            return [];
        }
    },

    /**
     * Search clients
     */
    async searchClients(query, filters = {}, userId) {
        try {
            let queryBuilder = supabase?.from("clients")?.select("*")?.eq("user_id", userId);

            // Text search
            if (query) {
                queryBuilder = queryBuilder?.or(
                    `company_name.ilike.%${query}%,primary_contact.ilike.%${query}%,email.ilike.%${query}%,industry.ilike.%${query}%`,
                );
            }

            // Status filter
            if (filters?.clientStatus && filters?.clientStatus?.length > 0) {
                queryBuilder = queryBuilder?.in("status", filters?.clientStatus);
            }

            // Industry filter
            if (filters?.industry) {
                queryBuilder = queryBuilder?.eq("industry", filters?.industry);
            }

            queryBuilder = queryBuilder?.order("created_at", { ascending: false });

            const { data, error } = await queryBuilder;

            if (error) {
                handleError(error, "in searchClients");
            }

            return (data || [])?.map((item) => ({
                ...item,
                module: "clients",
                displayTitle: item?.company_name,
                displaySubtitle: item?.primary_contact,
                displayMeta: `${item?.status} • ${item?.industry || "No industry"}`,
            }));
        } catch (error) {
            console.error("Search clients error:", error);
            return [];
        }
    },

    /**
     * Search templates
     */
    async searchTemplates(query, filters = {}, userId) {
        try {
            let queryBuilder = supabase?.from("templates")?.select("*")?.eq("user_id", userId);

            // Text search
            if (query) {
                queryBuilder = queryBuilder?.or(
                    `name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`,
                );
            }

            // Status filter
            if (filters?.templateStatus && filters?.templateStatus?.length > 0) {
                queryBuilder = queryBuilder?.in("status", filters?.templateStatus);
            }

            // Category filter
            if (filters?.category) {
                queryBuilder = queryBuilder?.eq("category", filters?.category);
            }

            queryBuilder = queryBuilder?.order("created_at", { ascending: false });

            const { data, error } = await queryBuilder;

            if (error) {
                handleError(error, "in searchTemplates");
            }

            return (data || [])?.map((item) => ({
                ...item,
                module: "templates",
                displayTitle: item?.name,
                displaySubtitle: item?.category || "No category",
                displayMeta: `${item?.status} • ${item?.description || "No description"}`,
            }));
        } catch (error) {
            console.error("Search templates error:", error);
            return [];
        }
    },

    /**
     * Get search suggestions based on query
     */
    async getSearchSuggestions(query) {
        try {
            const user = await getAuthUser();

            const suggestions = [];

            // Get recent proposals
            const { data: proposals } = await supabase
                ?.from("proposals")
                ?.select("title")
                ?.eq("user_id", user?.id)
                ?.ilike("title", `%${query}%`)
                ?.limit(3);

            if (proposals) {
                suggestions?.push(...proposals?.map((p) => ({ text: p?.title, type: "proposal" })));
            }

            // Get recent clients
            const { data: clients } = await supabase
                ?.from("clients")
                ?.select("company_name")
                ?.eq("user_id", user?.id)
                ?.ilike("company_name", `%${query}%`)
                ?.limit(3);

            if (clients) {
                suggestions?.push(...clients?.map((c) => ({ text: c?.company_name, type: "client" })));
            }

            return suggestions;
        } catch (error) {
            console.error("Get search suggestions error:", error);
            return [];
        }
    },
};

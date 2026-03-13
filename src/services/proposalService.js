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

    // Don't re-process errors that are already user-friendly messages
    if (error?.category) return false;

    const networkErrorPatterns = [
        /failed to fetch/i,
        /network error/i,
        /connection refused/i,
        /timeout/i,
        /aborted/i,
        /fetch.*failed/i,
        /network.*request.*failed/i,
    ];

    // Check original error if it exists
    const errorToCheck = error?.originalError || error;

    return networkErrorPatterns?.some(
        (pattern) => pattern?.test(errorToCheck?.message) || pattern?.test(errorToCheck?.toString()),
    );
}

function handleError(error, context = "") {
    // If error already has a category (from enhancedFetch), pass it through
    if (error?.category) {
        console.error(`Categorized error ${context}:`, error?.message);
        throw error;
    }

    if (isSchemaError(error)) {
        console.error(`Schema error ${context}:`, error?.message);
        throw error;
    }

    if (isNetworkError(error)) {
        console.error(`Network error ${context}:`, error?.message);
        const networkError = new Error(
            "Unable to connect to the database. Please check your internet connection and try again.",
        );
        networkError.category = "network";
        networkError.originalError = error;
        throw networkError;
    }

    console.error(`Data error ${context}:`, error?.message || error);
    throw error;
}

export const proposalService = {
    async getAllProposals() {
        return withRetry(async () => {
        // Get authenticated user from session cache (prevents hanging on refresh)
        const user = await getAuthUser();

        // Try with client join first, fall back to plain query if FK relationship doesn't exist
        let data, error;
        const joinResult = await supabase
            ?.from("proposals")
            ?.select("*, client:clients!client_id(id, company_name, primary_contact, logo)")
            ?.eq("user_id", user?.id)
            ?.order("created_at", { ascending: false });

        if (joinResult?.error) {
            // Join failed (likely no FK constraint) — fall back to plain query
            console.warn("[proposalService] Client join failed, falling back to plain query:", joinResult?.error?.message);
            const plainResult = await supabase
                ?.from("proposals")
                ?.select("*")
                ?.eq("user_id", user?.id)
                ?.order("created_at", { ascending: false });
            data = plainResult?.data;
            error = plainResult?.error;
        } else {
            data = joinResult?.data;
            error = joinResult?.error;
        }

        if (error) {
            if (isSchemaError(error)) {
                throw new Error(`Database schema error: ${error.message}. Please check your database migrations.`);
            }
            throw error;
        }

        // CRITICAL FIX: Return consistent format {data, error} to match hook expectations
        return { data: data || [], error: null };
        }, "getAllProposals");
    },

    async getProposalById(id) {
        return withRetry(async () => {
            // Try with client join first, fall back to plain query if FK relationship doesn't exist
            let joinResult = await supabase?.from("proposals")?.select("*, client:clients!client_id(id, company_name, logo)")?.eq("id", id);

            let data, error;
            if (joinResult?.error) {
                console.warn("[proposalService] Client join failed in getProposalById, falling back:", joinResult?.error?.message);
                const plainResult = await supabase?.from("proposals")?.select("*")?.eq("id", id);
                data = plainResult?.data;
                error = plainResult?.error;
            } else {
                data = joinResult?.data;
                error = joinResult?.error;
            }

            if (error) {
                handleError(error, "in getProposalById");
            }

            return { data: data?.[0] || null, error: null };
        }, `getProposalById(${id})`);
    },

    async createProposal(proposalData) {
        return withRetry(async () => {
            const user = await getAuthUser();

            console.log("=== CREATE PROPOSAL DEBUG ===");
            console.log("User ID:", user?.id);
            console.log("Title:", proposalData?.title);
            console.log("Status:", proposalData?.status);
            console.log("ClientId:", proposalData?.clientId);

            const { data, error } = await supabase
                ?.from("proposals")
                ?.insert([
                    {
                        user_id: user?.id, // Add user_id for RLS policy
                        title: proposalData?.title,
                        project_name: proposalData?.projectName,
                        description: proposalData?.description,
                        value: proposalData?.value ? String(proposalData?.value) : "0",
                        estimated_total_budget: proposalData?.estimatedTotalBudget,
                        progress: proposalData?.progress || 0,
                        deadline: proposalData?.deadline,
                        start_date: proposalData?.startDate,
                        status: proposalData?.status || "Draft",
                        client_id: proposalData?.clientId,
                        modules: proposalData?.modules || [],
                        milestones: proposalData?.milestones || [],
                        materials: proposalData?.materials || [],
                        labour: proposalData?.labour || [],
                        estimation_model: proposalData?.estimationModel || "single-module",
                        overheads: proposalData?.overheads || [],
                        site_costs: proposalData?.siteCosts || [],
                        logistics: proposalData?.logistics || [],
                        commission: proposalData?.commission || 0,
                        commission_items: proposalData?.commissionItems || [],
                        margin_percentage: proposalData?.marginPercentage || 0,
                        revenue_centers: proposalData?.revenueCenters || {},
                        financing: proposalData?.financing || {},
                        risks: proposalData?.risks || [],
                        payment_terms: proposalData?.paymentTerms || {},
                        project_details: proposalData?.projectDetails || {},
                        project_duration: proposalData?.projectDuration || {},
                        internal_value_added_scope: proposalData?.internalValueAddedScope || [],
                        margined_sub_contractors: proposalData?.marginedSubContractors || [],
                        zero_margined_supply: proposalData?.zeroMarginedSupply || [],
                        ft2_rate_bua: proposalData?.ft2RateBUA || 0,
                    },
                ])
                ?.select();

            console.log("Supabase insert result — data:", data, "error:", error);
            console.log("=== END CREATE PROPOSAL DEBUG ===");

            if (error) throw error;

            // Handle array response - return first item or null
            return data?.[0] || null;
        }, "createProposal");
    },

    async updateProposal(id, proposalData, options = {}) {
        return withRetry(async () => {
            console.log("=== UPDATE PROPOSAL DEBUG ===");
            console.log("Proposal ID:", id);
            console.log("Proposal Data Keys:", Object.keys(proposalData));
            console.log("CLIENT ID VALUE:", proposalData?.clientId);
            console.log("CLIENT ID TYPE:", typeof proposalData?.clientId);
            console.log("Materials data:", proposalData?.materials);
            console.log("Labour data:", proposalData?.labour);
            console.log("Estimation Model:", proposalData?.estimationModel);
            console.log("===========================");

            // CRITICAL FIX: Validate required fields before sending to database
            if (!id) {
                throw new Error("Proposal ID is required for update");
            }

            // Build query with abort signal if provided
            let query = supabase
                ?.from("proposals")
                ?.update({
                    title: proposalData?.title,
                    project_name: proposalData?.projectName,
                    description: proposalData?.description,
                    value: proposalData?.value ? String(proposalData?.value) : "0",
                    estimated_total_budget: proposalData?.estimatedTotalBudget,
                    progress: proposalData?.progress,
                    deadline: proposalData?.deadline,
                    start_date: proposalData?.startDate,
                    status: proposalData?.status,
                    client_id: proposalData?.clientId,
                    modules: proposalData?.modules || [],
                    milestones: proposalData?.milestones || [],
                    materials: proposalData?.materials || [],
                    labour: proposalData?.labour || [],
                    estimation_model: proposalData?.estimationModel || "single-module",
                    overheads: proposalData?.overheads || [],
                    site_costs: proposalData?.siteCosts || [],
                    logistics: proposalData?.logistics || [],
                    commission: proposalData?.commission || 0,
                    commission_items: proposalData?.commissionItems || [],
                    margin_percentage: proposalData?.marginPercentage || 0,
                    revenue_centers: proposalData?.revenueCenters || {},
                    financing: proposalData?.financing || {},
                    risks: proposalData?.risks || [],
                    payment_terms: proposalData?.paymentTerms || {},
                    project_details: proposalData?.projectDetails || {},
                    project_duration: proposalData?.projectDuration || {},
                    internal_value_added_scope: proposalData?.internalValueAddedScope || [],
                    margined_sub_contractors: proposalData?.marginedSubContractors || [],
                    zero_margined_supply: proposalData?.zeroMarginedSupply || [],
                    ft2_rate_bua: proposalData?.ft2RateBUA || 0,
                    updated_at: new Date()?.toISOString(),
                })
                ?.eq("id", id);

            // Apply abort signal if provided
            if (options?.signal) {
                query = query?.abortSignal(options?.signal);
            }

            const { data, error } = await query?.select();

            if (error) {
                console.error("=== SUPABASE UPDATE ERROR ===");
                console.error("Error Code:", error?.code);
                console.error("Error Message:", error?.message);
                console.error("Error Details:", error?.details);
                console.error("Error Hint:", error?.hint);
                console.error("===========================");

                // CRITICAL FIX: Provide user-friendly error messages
                if (error?.code === "22P02") {
                    throw new Error(`Invalid data format: ${error?.message}`);
                } else if (error?.code === "23505") {
                    throw new Error("Duplicate entry detected");
                } else if (error?.code === "23503") {
                    throw new Error("Referenced record does not exist");
                }

                throw error;
            }

            // Handle the response - data is an array, return first item or null
            const updatedProposal = data?.[0] || null;

            if (!updatedProposal) {
                console.warn("=== UPDATE WARNING ===");
                console.warn("No rows were updated. This might indicate:");
                console.warn("1. The proposal ID does not exist");
                console.warn("2. RLS policy blocked the update");
                console.warn("3. No changes were made");
                console.warn("=====================");

                // Return a soft warning instead of throwing - let the caller decide
                // Throwing here causes silent save failures when RLS blocks the update
                return { data: null, error: new Error("Failed to update proposal - no rows affected. The proposal may not exist or you may not have permission to edit it.") };
            } else {
                console.log("=== UPDATE SUCCESS ===");
                console.log("Updated data:", updatedProposal);
                console.log("Client ID in response:", updatedProposal?.client_id);
                console.log("=====================");
            }

            return { data: updatedProposal, error: null };
        }, `updateProposal(${id})`);
    },

    async deleteProposal(id) {
        try {
            const user = await getAuthUser();

            // Explicitly delete related proposal_versions first as a safety net
            // (ON DELETE CASCADE is set in the DB, but RLS on proposal_versions
            // could block the cascade if the policy check fails mid-transaction)
            const { error: versionsError } = await supabase
                ?.from("proposal_versions")
                ?.delete()
                ?.eq("proposal_id", id);

            if (versionsError) {
                console.warn("[deleteProposal] Could not pre-delete versions (cascade will handle it):", versionsError?.message);
                // Non-fatal: cascade delete on the proposal will clean these up
            }

            const { error } = await supabase?.from("proposals")?.delete()?.eq("id", id)?.eq("user_id", user?.id);

            if (error) {
                handleError(error, "in deleteProposal");
                throw new Error(error?.message || "Failed to delete proposal");
            }

            return true;
        } catch (error) {
            if (isNetworkError(error)) {
                throw error; // Already formatted by handleError
            }
            console.error("Delete proposal error:", error);
            throw error;
        }
    },

    async getProposalsByClientId(clientId) {
        try {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("proposals")
                ?.select(
                    `
          id,
          project_number,
          status,
          project_type,
          value,
          created_at,
          client:clients!client_id(
            primary_contact
          )
        `,
                )
                ?.eq("client_id", clientId)
                ?.eq("user_id", user?.id)
                ?.order("created_at", { ascending: false });

            if (error) {
                handleError(error, "in getProposalsByClientId");
            }

            return data || [];
        } catch (error) {
            if (isNetworkError(error)) {
                throw error;
            }
            console.error("Get proposals by client error:", error);
            throw error;
        }
    },

    async bulkDeleteProposals(ids) {
        try {
            const user = await getAuthUser();

            // Pre-delete all related proposal_versions for every proposal in the batch.
            // This is required because the RLS DELETE policy on proposal_versions checks
            // created_by = auth.uid() OR the parent proposal exists. During a cascade delete
            // the parent proposal is already gone, so the OR branch fails. Pre-deleting
            // versions while the proposals still exist ensures RLS passes cleanly.
            const { error: versionsError } = await supabase
                ?.from("proposal_versions")
                ?.delete()
                ?.in("proposal_id", ids);

            if (versionsError) {
                console.warn("[bulkDeleteProposals] Could not pre-delete versions (cascade will handle it):", versionsError?.message);
                // Non-fatal: cascade delete on the proposals will clean these up
            }

            const { error } = await supabase?.from("proposals")?.delete()?.in("id", ids)?.eq("user_id", user?.id);

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error("Failed to delete proposals");
            }

            return true;
        } catch (error) {
            console.error("Bulk delete proposals error:", error);
            throw error;
        }
    },

    // Real-time subscription management
    subscribeToProposals(userId, callback) {
        const channel = supabase
            ?.channel(`proposals_changes_${userId}`)
            ?.on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "proposals",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    callback(payload);
                },
            )
            ?.subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    },

    subscribeToProposal(proposalId, callback) {
        const channel = supabase
            ?.channel(`proposal_${proposalId}`)
            ?.on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "proposals",
                    filter: `id=eq.${proposalId}`,
                },
                (payload) => {
                    callback(payload);
                },
            )
            ?.subscribe();

        return channel;
    },

    unsubscribe(channel) {
        if (channel) {
            supabase?.removeChannel(channel);
        }
    },

    subscribeToProposalChanges(clientId, callback) {
        const channel = supabase
            ?.channel(`proposals-client-${clientId}`)
            ?.on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "proposals",
                    filter: `client_id=eq.${clientId}`,
                },
                callback,
            )
            ?.subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    },

    // ─── Version History Methods ───────────────────────────────────────────────

    async createVersion(proposalId, formData, options = {}) {
        try {
            const user = await getAuthUser();

            // Get the latest version number for this proposal
            const { data: existingVersions, error: fetchError } = await supabase
                ?.from("proposal_versions")
                ?.select("version_number")
                ?.eq("proposal_id", proposalId)
                ?.order("version_number", { ascending: false })
                ?.limit(1);

            if (fetchError) {
                console.warn("[proposalService] Could not fetch existing versions:", fetchError?.message);
            }

            const nextVersionNumber = existingVersions?.length > 0
                ? (existingVersions?.[0]?.version_number || 0) + 1
                : 1;

            const { data, error } = await supabase
                ?.from("proposal_versions")
                ?.insert([{
                    proposal_id: proposalId,
                    version_number: nextVersionNumber,
                    version_label: options?.versionLabel || `Version ${nextVersionNumber}`,
                    snapshot: formData || {},
                    version_status: options?.versionStatus || "draft",
                    created_by: user?.id,
                    versioned_at: new Date()?.toISOString(),
                    change_notes: options?.changeNotes || "",
                    proposal_value: options?.proposalValue || 0,
                }])
                ?.select();

            if (error) {
                console.error("[proposalService] createVersion error:", error);
                throw error;
            }

            return { data: data?.[0] || null, error: null };
        } catch (error) {
            console.error("[proposalService] createVersion failed:", error);
            return { data: null, error };
        }
    },

    async getVersionHistory(proposalId) {
        try {
            const { data, error } = await supabase
                ?.from("proposal_versions")
                ?.select(`
                    id,
                    proposal_id,
                    version_number,
                    version_label,
                    version_status,
                    created_by,
                    versioned_at,
                    change_notes,
                    proposal_value,
                    snapshot,
                    author:user_profiles!created_by(id, full_name, email)
                `)
                ?.eq("proposal_id", proposalId)
                ?.order("version_number", { ascending: false });

            if (error) {
                // Fallback without join if user_profiles FK doesn't resolve
                console.warn("[proposalService] getVersionHistory join failed, falling back:", error?.message);
                const plainResult = await supabase
                    ?.from("proposal_versions")
                    ?.select("*")
                    ?.eq("proposal_id", proposalId)
                    ?.order("version_number", { ascending: false });
                return { data: plainResult?.data || [], error: plainResult?.error };
            }

            return { data: data || [], error: null };
        } catch (error) {
            console.error("[proposalService] getVersionHistory failed:", error);
            return { data: [], error };
        }
    },

    async getVersionSnapshot(versionId) {
        try {
            const { data, error } = await supabase
                ?.from("proposal_versions")
                ?.select("*")
                ?.eq("id", versionId)
                ?.single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("[proposalService] getVersionSnapshot failed:", error);
            return { data: null, error };
        }
    },

    async restoreVersion(proposalId, versionId) {
        try {
            // Get the snapshot from the version
            const { data: version, error: versionError } = await supabase
                ?.from("proposal_versions")
                ?.select("snapshot, version_number, proposal_value")
                ?.eq("id", versionId)
                ?.single();

            if (versionError) throw versionError;
            if (!version) throw new Error("Version not found");

            return { data: version, error: null };
        } catch (error) {
            console.error("[proposalService] restoreVersion failed:", error);
            return { data: null, error };
        }
    },

    async updateVersionStatus(versionId, newStatus) {
        try {
            const { data, error } = await supabase
                ?.from("proposal_versions")
                ?.update({ version_status: newStatus })
                ?.eq("id", versionId)
                ?.select();

            if (error) throw error;
            return { data: data?.[0] || null, error: null };
        } catch (error) {
            console.error("[proposalService] updateVersionStatus failed:", error);
            return { data: null, error };
        }
    },

    async getLatestVersionNumber(proposalId) {
        try {
            const { data, error } = await supabase
                ?.from("proposal_versions")
                ?.select("version_number")
                ?.eq("proposal_id", proposalId)
                ?.order("version_number", { ascending: false })
                ?.limit(1);

            if (error) return { data: 0, error };
            return { data: data?.[0]?.version_number || 0, error: null };
        } catch (error) {
            return { data: 0, error };
        }
    },
};

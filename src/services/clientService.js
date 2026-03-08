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

export const clientService = {
    async getAllClients() {
        return withRetry(async () => {
            const user = await getAuthUser();

            // Try fetching clients with proposal data join; fall back to plain query if FK doesn't exist
            let clients, clientsError;
            const joinResult = await supabase
                ?.from("clients")
                ?.select(
                    `
          *,
          proposals:proposals(
            status,
            value
          )
        `,
                )
                ?.eq("user_id", user?.id)
                ?.order("created_at", { ascending: false });

            if (joinResult?.error) {
                // Join failed (likely no FK constraint) — fall back to plain query
                console.warn("[clientService] Proposals join failed, falling back to plain query:", joinResult?.error?.message);
                const plainResult = await supabase
                    ?.from("clients")
                    ?.select("*")
                    ?.eq("user_id", user?.id)
                    ?.order("created_at", { ascending: false });
                clients = plainResult?.data;
                clientsError = plainResult?.error;
            } else {
                clients = joinResult?.data;
                clientsError = joinResult?.error;
            }

            if (clientsError) {
                handleError(clientsError, "in getAllClients");
            }

            // Process proposal data for each client (no additional queries)
            const clientsWithProposalData = (clients || [])?.map((client) => {
                const proposals = client?.proposals || [];

                // Calculate counts and totals
                const proposalCount = proposals?.length || 0;
                const totalValue = proposals?.reduce((sum, proposal) => {
                    const value = parseFloat(proposal?.value?.replace(/[^0-9.-]+/g, "") || 0);
                    return sum + value;
                }, 0);

                // Calculate status breakdown
                const statusBreakdown = proposals?.reduce(
                    (acc, proposal) => {
                        const status = proposal?.status || "Draft";
                        acc[status] = (acc?.[status] || 0) + 1;
                        return acc;
                    },
                    { Draft: 0, Approved: 0, Closed: 0, Won: 0 },
                );

                // Remove proposals array from client object (we only need the aggregated data)
                const { proposals: _, ...clientWithoutProposals } = client;

                return {
                    ...clientWithoutProposals,
                    proposal_count: proposalCount,
                    total_value: totalValue,
                    status_breakdown: statusBreakdown,
                };
            });

            return clientsWithProposalData || [];
        });
    },

    async getClientById(id) {
        try {
            const user = await getAuthUser();

            const { data, error } = await supabase?.from("clients")?.select("*")?.eq("id", id)?.eq("user_id", user?.id);

            if (error) {
                handleError(error, "in getClientById");
            }

            // Handle array response - return first item or null
            return data?.[0] || null;
        } catch (error) {
            if (isNetworkError(error)) {
                throw error; // Already formatted by handleError
            }
            console.error("Get client error:", error);
            throw error;
        }
    },

    async createClient(clientData) {
        try {
            const user = await getAuthUser();

            // Ensure user_profile exists before creating client
            const { data: existingProfile } = await supabase
                ?.from("user_profiles")
                ?.select("id")
                ?.eq("id", user?.id)
                ?.single();

            // If user_profile doesn't exist, create it
            if (!existingProfile) {
                const { error: profileError } = await supabase?.from("user_profiles")?.insert({
                    id: user?.id,
                    email: user?.email,
                    full_name: user?.user_metadata?.full_name || user?.email?.split("@")?.[0] || "User",
                    role: "Standard User",
                });

                if (profileError) {
                    console.error("Failed to create user profile:", profileError);
                    throw new Error("Failed to initialize user profile");
                }
            }

            const { data, error } = await supabase
                ?.from("clients")
                ?.insert({
                    user_id: user?.id,
                    company_name: clientData?.companyName,
                    logo: clientData?.logo || "",
                    logo_alt: clientData?.logoAlt || `${clientData?.companyName} company logo`,
                    primary_contact: clientData?.primaryContact,
                    email: clientData?.email,
                    phone: clientData?.phone,
                    industry: clientData?.industry,
                    location: clientData?.location,
                    status: clientData?.status || "Active",
                    client_since: clientData?.clientSince,
                    description: clientData?.description,
                })
                ?.select();

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error("Failed to create client");
            }

            // Handle array response - return first item or null
            return data?.[0] || null;
        } catch (error) {
            console.error("Create client error:", error);
            throw error;
        }
    },

    async updateClient(id, clientData) {
        try {
            const user = await getAuthUser();

            const updateData = {
                company_name: clientData?.companyName,
                primary_contact: clientData?.primaryContact,
                email: clientData?.email,
                phone: clientData?.phone,
                industry: clientData?.industry,
                location: clientData?.location,
                status: clientData?.status,
                client_since: clientData?.clientSince,
                description: clientData?.description,
                updated_at: new Date()?.toISOString(),
            };

            // Only update logo fields if provided
            if (clientData?.logo !== undefined) {
                updateData.logo = clientData?.logo;
            }
            if (clientData?.logoAlt !== undefined) {
                updateData.logo_alt = clientData?.logoAlt;
            }

            const { data, error } = await supabase
                ?.from("clients")
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
                throw new Error("Failed to update client");
            }

            // Handle the response - data is an array, return first item or null
            const updatedClient = data?.[0] || null;

            if (!updatedClient) {
                console.warn("No rows were updated for client ID:", id);
            }

            return updatedClient;
        } catch (error) {
            console.error("Update client error:", error);
            throw error;
        }
    },

    async deleteClient(id) {
        try {
            const user = await getAuthUser();

            const { error } = await supabase?.from("clients")?.delete()?.eq("id", id)?.eq("user_id", user?.id);

            if (error) {
                if (isSchemaError(error)) {
                    console.error("Schema error:", error?.message);
                    throw error;
                }
                console.error("Data error:", error?.message);
                throw new Error("Failed to delete client");
            }

            return true;
        } catch (error) {
            console.error("Delete client error:", error);
            throw error;
        }
    },

    async searchClients(searchTerm) {
        try {
            const user = await getAuthUser();

            const { data, error } = await supabase
                ?.from("clients")
                ?.select("*")
                ?.eq("user_id", user?.id)
                ?.or(
                    `company_name.ilike.%${searchTerm}%,primary_contact.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
                )
                ?.order("created_at", { ascending: false });

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
            console.error("Search clients error:", error);
            throw error;
        }
    },
};

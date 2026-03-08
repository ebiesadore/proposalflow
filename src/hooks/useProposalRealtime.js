import { useState, useEffect, useCallback, useRef } from "react";
import { proposalService } from "../services/proposalService";
import { useAuth } from "../contexts/AuthContext";

export const useProposalRealtime = (proposalId = null) => {
    const { user, sessionRestored } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [currentProposal, setCurrentProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);
    // CRITICAL FIX: Use a ref for user to avoid recreating fetchProposals on every
    // user object reference change. The effect depends on user?.id (primitive) instead.
    const userRef = useRef(user);
    userRef.current = user;
    // Track fetch request IDs to ignore stale responses
    const fetchIdRef = useRef(0);
    // Deduplication: track in-flight fetches to prevent concurrent lock contention
    const fetchingRef = useRef(false);
    const fetchingProposalRef = useRef(false);

    // Fetch all proposals — stable callback that doesn't depend on user object reference
    const fetchProposals = useCallback(async () => {
        if (!userRef?.current) {
            console.warn("[useProposalRealtime] fetchProposals skipped: no user");
            return;
        }

        // Deduplicate: skip if a fetch is already in flight
        if (fetchingRef?.current) {
            console.log("[useProposalRealtime] fetchProposals skipped: already in flight");
            return;
        }

        // Increment fetch ID so any in-flight request from a previous call is ignored
        const currentFetchId = ++fetchIdRef.current;
        fetchingRef.current = true;

        try {
            setError(null);
            setLoading(true);

            console.log("[useProposalRealtime] Fetching proposals...");
            const result = await proposalService?.getAllProposals();
            const data = result?.data || [];

            // Only apply result if this is still the latest request and component is mounted
            if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                console.log("[useProposalRealtime] Proposals loaded:", data?.length);
                setProposals(data);
            }
        } catch (err) {
            // Ignore abort errors
            if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
                return;
            }

            // Ignore lock timeout errors — they are transient; the next refetch will succeed
            if (err?.message?.includes("Lock") && err?.message?.includes("timed out")) {
                console.warn("[useProposalRealtime] Auth lock timeout — will retry on next interaction");
                if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                    setLoading(false);
                }
                return;
            }

            console.error("[useProposalRealtime] Error fetching proposals:", err);
            if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                setError(err?.message || "Failed to fetch proposals");
            }
        } finally {
            fetchingRef.current = false;
            if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                setLoading(false);
            }
        }
    }, []); // No dependencies — uses userRef to read current user

    const fetchProposal = useCallback(async (id) => {
        if (!userRef?.current || !id) {
            console.warn("[useProposalRealtime] fetchProposal skipped: no user or no ID");
            return;
        }

        // Deduplicate: skip if a fetch is already in flight for this proposal
        if (fetchingProposalRef?.current) {
            console.log("[useProposalRealtime] fetchProposal skipped: already in flight");
            return;
        }

        const currentFetchId = ++fetchIdRef.current;
        fetchingProposalRef.current = true;

        try {
            setError(null);
            setLoading(true);

            console.log("[useProposalRealtime] Fetching proposal:", id);
            const result = await proposalService?.getProposalById(id);
            const data = result?.data;

            if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                setCurrentProposal(data);
            }
        } catch (err) {
            if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
                return;
            }

            // Ignore lock timeout errors — transient, next refetch will succeed
            if (err?.message?.includes("Lock") && err?.message?.includes("timed out")) {
                console.warn("[useProposalRealtime] Auth lock timeout on proposal fetch — will retry");
                if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                    setLoading(false);
                }
                return;
            }

            console.error("[useProposalRealtime] Error fetching proposal:", err);
            if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                setError(err?.message || "Failed to fetch proposal");
            }
        } finally {
            fetchingProposalRef.current = false;
            if (isMountedRef?.current && fetchIdRef?.current === currentFetchId) {
                setLoading(false);
            }
        }
    }, []); // No dependencies — uses userRef

    // Track component mount/unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // CRITICAL FIX: Fetch initial data when session is restored and user is available.
    // Uses user?.id (primitive string) instead of user (object reference) to prevent
    // the effect from re-triggering when the user object reference changes but the
    // identity is the same (e.g., from onAuthStateChange firing SIGNED_IN on refresh).
    const userId = user?.id;

    useEffect(() => {
        if (!sessionRestored) {
            console.log("[useProposalRealtime] Waiting for session restoration...");
            return;
        }

        if (!userId) {
            console.log("[useProposalRealtime] No user, skipping fetch");
            return;
        }

        console.log("[useProposalRealtime] Session restored, user available — triggering fetch", proposalId);

        if (proposalId) {
            fetchProposal(proposalId);
        } else {
            fetchProposals();
        }
    }, [proposalId, fetchProposal, fetchProposals, userId, sessionRestored]);

    return {
        proposals,
        currentProposal,
        loading,
        error,
        refetch: fetchProposals,
        refetchProposal: fetchProposal,
    };
};

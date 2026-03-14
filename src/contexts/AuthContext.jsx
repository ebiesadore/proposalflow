import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionRestored, setSessionRestored] = useState(false);
    const initializedRef = useRef(false);

    useEffect(() => {
        let mounted = true;
        let authSubscription = null;
        let fallbackTimer = null;

        const markInitialized = (sessionUser) => {
            console.log("sessionUser", sessionUser);
            if (!mounted || initializedRef?.current) return;
            initializedRef.current = true;
            setUser(sessionUser ?? null);
            setSessionRestored(true);
            setLoading(false);
            if (fallbackTimer) clearTimeout(fallbackTimer);
        };

        // 1. Listen for auth changes — INITIAL_SESSION is the primary restore path
        try {
            const { data } = supabase?.auth?.onAuthStateChange(async (event, session) => {
                if (!mounted) return;
                console.log("[AuthContext] Auth state changed:", event);

                if (event === "INITIAL_SESSION") {
                    console.log("[AuthContext] INITIAL_SESSION received:", session?.user ? "User found" : "No session");
                    markInitialized(session?.user);
                    if (session?.user) {
                        supabase?.from("user_profiles")?.upsert(
                            {
                                id: session?.user?.id,
                                email: session?.user?.email,
                                full_name: session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")?.[0] || "User",
                                role: "Standard User",
                            },
                            { onConflict: "id", ignoreDuplicates: true }
                        )?.then(({ error }) => {
                            if (error) console.error("[AuthContext] Profile upsert error:", error);
                        });
                    }
                    return;
                }

                if (event === "TOKEN_REFRESHED") return;

                if (event === "TOKEN_REFRESH_FAILED") {
                    console.warn("[AuthContext] Token refresh failed — attempting retries before signing out");

                    let retryCount = 0;
                    const maxRetries = 3;
                    const retryDelay = 2000; // 2 seconds between retries

                    const attemptRefresh = async () => {
                        if (!mounted) return;
                        retryCount++;
                        console.log(`[AuthContext] Token refresh retry ${retryCount}/${maxRetries}...`);
                        try {
                            const { data, error } = await supabase?.auth?.refreshSession();
                            if (!error && data?.session) {
                                console.log("[AuthContext] Token refresh retry succeeded on attempt", retryCount);
                                if (mounted) setUser(data?.session?.user);
                                return; // success — do not sign out
                            }
                            throw error || new Error("No session returned");
                        } catch (err) {
                            console.warn(`[AuthContext] Retry ${retryCount} failed:`, err?.message);
                            if (retryCount < maxRetries) {
                                setTimeout(attemptRefresh, retryDelay);
                            } else {
                                console.warn("[AuthContext] All retries exhausted — signing out and redirecting to login");
                                if (mounted) setUser(null);
                                try {
                                    await supabase?.auth?.signOut();
                                } catch {
                                    // ignore sign-out errors during refresh failure
                                }
                                window.location.href = "/login-and-authentication-portal";
                            }
                        }
                    };

                    // Start first retry after initial delay
                    setTimeout(attemptRefresh, retryDelay);
                    return;
                }

                if (event === "SIGNED_IN" || event === "USER_UPDATED") {
                    setUser(session?.user ?? null);
                    // Also resolve loading in case INITIAL_SESSION was missed
                    markInitialized(session?.user);
                    if (session?.user) {
                        supabase?.from("user_profiles")?.upsert(
                            {
                                id: session?.user?.id,
                                email: session?.user?.email,
                                full_name: session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")?.[0] || "User",
                                role: "Standard User",
                            },
                            { onConflict: "id", ignoreDuplicates: true }
                        )?.then(({ error }) => {
                            if (error) console.error("[AuthContext] Profile upsert error:", error);
                        });
                    }
                } else if (event === "SIGNED_OUT") {
                    if (mounted) setUser(null);
                }
            });
            authSubscription = data?.subscription;
        } catch (error) {
            console.error("[AuthContext] Failed to setup auth listener:", error);
        }

        const restoreSessionFallback = async () => {
            try {
                if (!supabase?.auth) throw new Error("Supabase client not initialized");
                const { data, error } = await supabase?.auth?.getSession();
                console.log("data", data, "dax");
                console.log("error", error, "dax");
                if (error) throw error;
                console.log("[AuthContext] Fallback getSession:", data?.session?.user ? "User found" : "No session");
                markInitialized(data?.session?.user);
            } catch (error) {
                // Handle lock timeout gracefully - INITIAL_SESSION likely succeeded
                if (error?.message?.includes("Lock") && error?.message?.includes("timed out")) {
                    console.warn("[AuthContext] Lock timeout in fallback - INITIAL_SESSION likely handled auth");
                    // Don't mark as initialized here - let INITIAL_SESSION complete
                    return;
                }
                console.error("[AuthContext] Fallback session restore failed:", error);
                markInitialized(null);
            }
        };

        // Give INITIAL_SESSION more time to fire (2s instead of 1s) to reduce race conditions
        fallbackTimer = setTimeout(() => {
            if (!initializedRef?.current) {
                console.log("[AuthContext] INITIAL_SESSION not received, using getSession fallback");
                restoreSessionFallback();
            }
        }, 2000);

        return () => {
            mounted = false;
            initializedRef.current = false;
            authSubscription?.unsubscribe();
            if (fallbackTimer) clearTimeout(fallbackTimer);
        };
    }, []);

    const signUp = async (email, password, metadata = {}) => {
        const { data, error } = await supabase?.auth?.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        if (error) throw error;
        return data;
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase?.auth?.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        setUser(null);
        try {
            const { error } = await supabase?.auth?.signOut();
            if (error) {
                console.error("[AuthContext] Sign out error:", error);
            }
        } catch (error) {
            console.error("[AuthContext] Sign out error:", error);
        }
    };

    const resetPassword = async (email) => {
        const { error } = await supabase?.auth?.resetPasswordForEmail(email);
        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await supabase?.auth?.updateUser({
            password: newPassword,
        });
        if (error) throw error;
    };

    const isEmailVerified = () => {
        return user?.email_confirmed_at != null;
    };

    const value = {
        user,
        loading,
        sessionRestored,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        isEmailVerified,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

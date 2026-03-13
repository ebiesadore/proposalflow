import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

/**
 * Process-level lock implementation to replace the browser's Navigator LockManager API.
 *
 * CRITICAL FIX: Supabase JS v2 uses navigator.locks internally for auth operations.
 * On page refresh, the following deadlock occurs:
 *   1. `initializePromise` acquires a navigator lock and runs `_initialize()`
 *   2. `_initialize()` fires SIGNED_IN → React renders → component calls supabase query
 *   3. Every supabase query goes through `fetchWithAuth` → `_getAccessToken()` → `getSession()`
 *   4. `getSession()` does `await initializePromise` which hasn't resolved yet *      (it's blocked waiting for _initialize to fully complete, including token refresh)
 *   5. The query hangs indefinitely, causing "Loading proposals..." forever
 *
 * This process-level lock provides the same serialization guarantees within a single
 * tab but does NOT use navigator.locks, so it cannot deadlock. Cross-tab coordination
 * is sacrificed, which is acceptable — the worst case is a rare duplicate token refresh
 * across tabs, which Supabase handles gracefully.
 *
 * TIMEOUT FIX: We always ignore the acquireTimeout passed by Supabase (which is 30000ms)
 * and run with NO timeout. This prevents the "Lock acquire timed out after 30000ms" error
 * that occurs when multiple auth operations queue up (e.g., concurrent proposal fetches
 * all triggering getSession() while a token refresh is in progress).
 */
const _pendingLocks = {};
function processLock(name, _acquireTimeout, fn) {
    const previous = _pendingLocks?.[name] || Promise.resolve();

    // Chain onto the previous lock — no timeout, always completes
    const current = previous?.catch(() => null)?.then(async () => {
        return await fn();
    });

    _pendingLocks[name] = current?.catch(() => null);
    return current;
}

// Create Supabase client with process-level lock to prevent navigator.locks deadlock
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: "supabase.auth.token",
        lock: processLock,
    },
});

// Storage key must match the auth config above
const supabaseStorageKey = "supabase.auth.token";

/**
 * Get the authenticated user from the current session.
 *
 * CRITICAL: In Supabase JS v2.39+, both getUser() and getSession() can hang
 * indefinitely on page refresh because they use internal navigator.locks that
 * deadlock when the auth token refresh is in progress (triggered by
 * onAuthStateChange / INITIAL_SESSION).
 *
 * This helper first reads the user directly from localStorage — the same storage
 * Supabase uses — so it is synchronous, instant, and cannot deadlock.
 * If localStorage is empty or missing (e.g. incognito, cleared storage, SSR),
 * it falls back to supabase.auth.getSession() for graceful session recovery.
 * Only throws "Not authenticated" after both paths fail.
 */
export async function getAuthUser() {
    try {
        const raw = localStorage.getItem(supabaseStorageKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            const user = parsed?.user;
            if (user?.id) return user;
        }
    } catch {
        // localStorage parse failed — fall through to getSession()
    }

    // Fallback: attempt session recovery via Supabase
    const { data, error } = await supabase?.auth?.getSession();
    if (!error && data?.session?.user?.id) {
        return data?.session?.user;
    }

    throw new Error("Not authenticated");
}

// Export default
export default supabase;

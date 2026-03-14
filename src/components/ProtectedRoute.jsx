import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user, loading, sessionRestored } = useAuth();
    const [forceRender, setForceRender] = useState(false);
    const [confirmedFailed, setConfirmedFailed] = useState(false);

    // Safety timeout: if session restoration takes too long, show spinner then confirm failure
    useEffect(() => {
        let forceTimer = null;
        let failTimer = null;

        if (loading || !sessionRestored) {
            // At 8 seconds, force render but show spinner (not redirect yet)
            forceTimer = setTimeout(() => {
                if (loading || !sessionRestored) {
                    console.warn("[ProtectedRoute] Session restoration timeout (8s) - showing spinner, awaiting confirmation");
                    setForceRender(true);
                }
            }, 8000);

            // At 12 seconds, confirm session has genuinely failed and allow redirect
            failTimer = setTimeout(() => {
                if (loading || !sessionRestored) {
                    console.warn("[ProtectedRoute] Session confirmed failed (12s) - redirecting to login");
                    setConfirmedFailed(true);
                }
            }, 12000);
        }

        return () => {
            if (forceTimer) clearTimeout(forceTimer);
            if (failTimer) clearTimeout(failTimer);
        };
    }, [loading, sessionRestored]);

    // Wait for session restoration before making routing decisions
    if ((loading || !sessionRestored) && !forceRender) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Authenticating...</p>
                    <p className="mt-2 text-sm text-gray-400">Restoring your session</p>
                </div>
            </div>
        );
    }

    // forceRender triggered but session not confirmed failed yet — keep showing spinner
    if (forceRender && !confirmedFailed && !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying session...</p>
                    <p className="mt-2 text-sm text-gray-400">This is taking longer than expected</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login-and-authentication-portal" replace />;
    }

    return children;
};

export default ProtectedRoute;

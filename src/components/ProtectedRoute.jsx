import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user, loading, sessionRestored } = useAuth();
    const [forceRender, setForceRender] = useState(false);

    // Safety timeout: if session restoration takes too long, force render
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading || !sessionRestored) {
                console.warn("[ProtectedRoute] Session restoration timeout - forcing render");
                setForceRender(true);
            }
        }, 3000);

        return () => clearTimeout(timeout);
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

    if (!user) {
        return <Navigate to="/login-and-authentication-portal" replace />;
    }

    return children;
};

export default ProtectedRoute;

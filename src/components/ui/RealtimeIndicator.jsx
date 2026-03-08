import React from "react";
import Icon from "../AppIcon";

const RealtimeIndicator = ({ connectionState, networkStatus, queuedChanges, lastUpdate, enhanced = false }) => {
    // FEATURE FLAG: Enhanced real-time display
    const ENHANCED_REALTIME_ENABLED = import.meta.env?.VITE_ENABLE_ENHANCED_REALTIME === "true";

    if (!ENHANCED_REALTIME_ENABLED && !enhanced) {
        // Legacy indicator (preserved for rollback)
        // When enhanced realtime is disabled, show a neutral "Connected" state
        // since the app still works via regular polling/fetching
        const isDisabledOrHealthy = connectionState === "disabled" || connectionState === "healthy";
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                <div
                    className={`w-2 h-2 rounded-full ${
                        connectionState === "connected" || isDisabledOrHealthy ?"bg-success animate-pulse"
                            : connectionState === "connecting" ?"bg-warning animate-pulse" :"bg-destructive"
                    }`}
                />
                <span className="text-xs font-caption text-muted-foreground">
                    {connectionState === "connected"|| isDisabledOrHealthy ?"Connected"
                        : connectionState === "connecting" ?"Connecting..." :"Disconnected"}
                </span>
            </div>
        );
    }

    // Enhanced indicator with detailed status
    const getStatusColor = () => {
        if (networkStatus === "offline") return "bg-destructive";
        if (connectionState === "connected" || connectionState === "disabled" || connectionState === "healthy")
            return "bg-success";
        if (connectionState === "connecting" || connectionState === "reconnecting") return "bg-warning";
        if (connectionState === "error") return "bg-destructive";
        return "bg-muted-foreground";
    };

    const getStatusText = () => {
        if (networkStatus === "offline") return "Offline";
        if (connectionState === "connected" || connectionState === "disabled" || connectionState === "healthy")
            return "Connected";
        if (connectionState === "connecting") return "Connecting...";
        if (connectionState === "reconnecting") return "Reconnecting...";
        if (connectionState === "error") return "Error";
        return "Disconnected";
    };

    const getStatusIcon = () => {
        if (networkStatus === "offline") return "WifiOff";
        if (connectionState === "connected" || connectionState === "disabled" || connectionState === "healthy")
            return "Wifi";
        if (connectionState === "connecting" || connectionState === "reconnecting") return "Loader2";
        if (connectionState === "error") return "AlertCircle";
        return "WifiOff";
    };

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-muted/50">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
                <div
                    className={`w-2 h-2 rounded-full ${getStatusColor()} ${
                        connectionState === "connecting" || connectionState === "reconnecting" ? "animate-pulse" : ""
                    }`}
                />
                <Icon
                    name={getStatusIcon()}
                    size={12}
                    className={`text-muted-foreground ${
                        connectionState === "connecting" || connectionState === "reconnecting" ? "animate-spin" : ""
                    }`}
                />
                <span className="text-xs font-caption text-muted-foreground">{getStatusText()}</span>
            </div>
            {/* Queued Changes Indicator */}
            {queuedChanges > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 border border-warning/20">
                    <Icon name="Clock" size={10} className="text-warning" />
                    <span className="text-xs font-caption font-medium text-warning">{queuedChanges} queued</span>
                </div>
            )}
            {/* Last Update Time */}
            {lastUpdate && connectionState === "connected" && (
                <span className="text-xs font-caption text-muted-foreground">
                    {new Date(lastUpdate)?.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })}
                </span>
            )}
        </div>
    );
};

export default RealtimeIndicator;

"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Wifi, WifiOff, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { networkMonitor, NetworkStatus } from "@/lib/api-error-handling";
import { showInfoToast, showWarningToast } from "@/lib/toast-utils";

// Hook for network status
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({ isOnline: true });
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  useEffect(() => {
    // Get initial status
    setStatus(networkMonitor.getStatus());

    // Subscribe to changes
    const unsubscribe = networkMonitor.addListener((newStatus) => {
      const wasOffline = !status.isOnline;
      const isNowOnline = newStatus.isOnline;

      setStatus(newStatus);

      // Track when we went offline
      if (wasOffline && isNowOnline) {
        setLastOnlineTime(null);
      } else if (!wasOffline && !isNowOnline) {
        setLastOnlineTime(new Date());
      }
    });

    return unsubscribe;
  }, [status.isOnline]);

  return {
    ...status,
    lastOnlineTime,
    hasSlowConnection: networkMonitor.hasSlowConnection(),
  };
}

// Compact network status indicator
interface NetworkStatusIndicatorProps {
  className?: string;
  showText?: boolean;
  showConnectionQuality?: boolean;
}

export function NetworkStatusIndicator({
  className,
  showText = false,
  showConnectionQuality = false,
}: NetworkStatusIndicatorProps) {
  const status = useNetworkStatus();

  const getConnectionQualityColor = () => {
    if (!status.isOnline) return "text-destructive";
    if (status.hasSlowConnection) return "text-yellow-500";
    if (status.effectiveType === "4g") return "text-green-500";
    return "text-blue-500";
  };

  const getConnectionQualityText = () => {
    if (!status.isOnline) return "Offline";
    if (status.hasSlowConnection) return "Slow";
    return status.effectiveType?.toUpperCase() || "Online";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status.isOnline ? (
        <Wifi className={cn("h-4 w-4", getConnectionQualityColor())} />
      ) : (
        <WifiOff className="h-4 w-4 text-destructive" />
      )}

      {showText && (
        <span
          className={cn("text-sm font-medium", getConnectionQualityColor())}
        >
          {status.isOnline ? "Online" : "Offline"}
        </span>
      )}

      {showConnectionQuality && status.isOnline && (
        <Badge
          variant="outline"
          className={cn("text-xs", getConnectionQualityColor())}
        >
          {getConnectionQualityText()}
        </Badge>
      )}
    </div>
  );
}

// Detailed offline banner
interface OfflineBannerProps {
  className?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function OfflineBanner({
  className,
  showRetryButton = true,
  onRetry,
}: OfflineBannerProps) {
  const status = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  if (status.isOnline) return null;

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    } else {
      // Default retry behavior: reload the page
      window.location.reload();
    }
  };

  const formatOfflineTime = () => {
    if (!status.lastOnlineTime) return "";
    const minutes = Math.floor(
      (Date.now() - status.lastOnlineTime.getTime()) / 60000
    );
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 minute ago";
    return `${minutes} minutes ago`;
  };

  return (
    <Alert className={cn("border-orange-200 bg-orange-50", className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>You're currently offline</span>
        {showRetryButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-auto"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </>
            )}
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>
        Some features may not work until your connection is restored.
        {status.lastOnlineTime && (
          <span className="block text-xs text-muted-foreground mt-1">
            Last online: {formatOfflineTime()}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Offline fallback component
interface OfflineFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function OfflineFallback({
  children,
  fallback,
  showRetry = true,
  onRetry,
  className,
}: OfflineFallbackProps) {
  const status = useNetworkStatus();

  if (status.isOnline) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
          <WifiOff className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle>You're offline</CardTitle>
        <CardDescription>
          This content isn't available offline. Please check your connection and
          try again.
        </CardDescription>
      </CardHeader>
      {showRetry && (
        <CardContent className="text-center">
          <Button
            onClick={onRetry || (() => window.location.reload())}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Offline-aware component wrapper
interface OfflineAwareProps {
  children: React.ReactNode;
  onOffline?: () => void;
  onOnline?: () => void;
  showBanner?: boolean;
  enableCaching?: boolean;
}

export function OfflineAware({
  children,
  onOffline,
  onOnline,
  showBanner = true,
  enableCaching = false,
}: OfflineAwareProps) {
  const status = useNetworkStatus();
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!status.isOnline && !hasBeenOffline) {
      setHasBeenOffline(true);
      onOffline?.();
    } else if (status.isOnline && hasBeenOffline) {
      onOnline?.();
      showInfoToast("You're back online!", {
        description: "Your connection has been restored.",
      });
    }
  }, [status.isOnline, hasBeenOffline, onOffline, onOnline]);

  return (
    <div className="relative">
      {showBanner && !status.isOnline && (
        <div className="sticky top-0 z-50 mb-4">
          <OfflineBanner />
        </div>
      )}
      {children}
    </div>
  );
}

// Connection quality indicator
interface ConnectionQualityProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionQuality({
  className,
  showDetails = false,
}: ConnectionQualityProps) {
  const status = useNetworkStatus();

  if (!status.isOnline) return null;

  const getQualityLevel = (): "excellent" | "good" | "fair" | "poor" => {
    if (!status.effectiveType) return "good";

    switch (status.effectiveType) {
      case "4g":
        return "excellent";
      case "3g":
        return "good";
      case "2g":
        return "fair";
      case "slow-2g":
        return "poor";
      default:
        return "good";
    }
  };

  const qualityLevel = getQualityLevel();

  const qualityConfig = {
    excellent: { color: "text-green-500", label: "Excellent", bars: 4 },
    good: { color: "text-blue-500", label: "Good", bars: 3 },
    fair: { color: "text-yellow-500", label: "Fair", bars: 2 },
    poor: { color: "text-red-500", label: "Poor", bars: 1 },
  };

  const config = qualityConfig[qualityLevel];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Signal strength bars */}
      <div className="flex items-end gap-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={cn(
              "w-1 rounded-t-sm transition-colors",
              bar <= config.bars ? config.color : "text-gray-300",
              {
                "h-2": bar === 1,
                "h-3": bar === 2,
                "h-4": bar === 3,
                "h-5": bar === 4,
              }
            )}
            style={{
              backgroundColor:
                bar <= config.bars ? "currentColor" : "currentColor",
            }}
          />
        ))}
      </div>

      {showDetails && (
        <div className="text-xs text-muted-foreground">
          <span className={config.color}>{config.label}</span>
          {status.rtt && <span className="ml-1">({status.rtt}ms)</span>}
        </div>
      )}
    </div>
  );
}

// Offline queue indicator
interface OfflineQueueProps {
  queueSize: number;
  onClearQueue?: () => void;
  className?: string;
}

export function OfflineQueue({
  queueSize,
  onClearQueue,
  className,
}: OfflineQueueProps) {
  const status = useNetworkStatus();

  if (queueSize === 0) return null;

  return (
    <Alert className={cn("border-blue-200 bg-blue-50", className)}>
      <Clock className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>
          {queueSize} action{queueSize !== 1 ? "s" : ""} queued
        </span>
        {onClearQueue && (
          <Button variant="outline" size="sm" onClick={onClearQueue}>
            Clear queue
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>
        {status.isOnline
          ? "These actions will be processed automatically."
          : "These actions will be processed when you're back online."}
      </AlertDescription>
    </Alert>
  );
}

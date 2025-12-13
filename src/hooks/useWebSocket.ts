import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  WebSocketService,
  WebSocketEventType,
  getDefaultWebSocketConfig,
} from "@/services/websocketService";
import { WebSocketPolicyEvents } from "@/types/policy";
import { toast } from "@/components/ui/use-toast";

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: <T extends WebSocketEventType>(
    eventType: T,
    callback: (data: WebSocketPolicyEvents[T]) => void,
  ) => () => void;
  unsubscribe: (
    eventType: WebSocketEventType,
    callback?: (data: unknown) => void,
  ) => void;
}

export const useWebSocket = (
  options: UseWebSocketOptions = {},
): UseWebSocketReturn => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocketService | null>(null);
  const queryClient = useQueryClient();

  // Initialize WebSocket service
  useEffect(() => {
    if (!wsRef.current) {
      try {
        wsRef.current = WebSocketService.getInstance(
          getDefaultWebSocketConfig(),
        );
      } catch (error) {
        console.error("Failed to initialize WebSocket service:", error);
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!wsRef.current) return;

    try {
      await wsRef.current.connect();
      setIsConnected(true);
      onConnect?.();
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      setIsConnected(false);
      onError?.(error as Event);
    }
  }, [onConnect, onError]);

  const disconnect = useCallback(() => {
    if (!wsRef.current) return;

    wsRef.current.disconnect();
    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  const subscribe = useCallback(
    <T extends WebSocketEventType>(
      eventType: T,
      callback: (data: WebSocketPolicyEvents[T]) => void,
    ) => {
      if (!wsRef.current) {
        console.warn("WebSocket service not initialized");
        return () => {};
      }

      return wsRef.current.subscribe(eventType, callback);
    },
    [],
  );

  const unsubscribe = useCallback(
    (eventType: WebSocketEventType, callback?: (data: unknown) => void) => {
      if (!wsRef.current) return;
      wsRef.current.unsubscribe(eventType, callback);
    },
    [],
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && wsRef.current) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      if (wsRef.current) {
        const currentStatus = wsRef.current.getConnectionStatus();
        setIsConnected(currentStatus);
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
};

// Hook specifically for policy-related WebSocket events
export const usePolicyWebSocket = () => {
  const queryClient = useQueryClient();
  const webSocket = useWebSocket({
    onConnect: () => {
      
    },
    onDisconnect: () => {
      
    },
    onError: (error) => {
      console.error("Policy WebSocket error:", error);
      toast({
        title: "Connection Issue",
        description:
          "Real-time updates may be delayed. Please refresh the page if needed.",
        variant: "destructive",
      });
    },
  });

  // Subscribe to policy status changes
  useEffect(() => {
    const unsubscribeStatusChange = webSocket.subscribe(
      "policy.status.changed",
      (data) => {

        // Invalidate policy queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["policies"] });
        queryClient.invalidateQueries({ queryKey: ["policy", data.policy_id] });

        toast({
          title: "Policy Status Updated",
          description: `Policy ${data.policy_id} status changed from ${data.old_status} to ${data.new_status}`,
        });
      },
    );

    return unsubscribeStatusChange;
  }, [webSocket, queryClient]);

  // Subscribe to payment events
  useEffect(() => {
    const unsubscribePaymentProcessed = webSocket.subscribe(
      "payment.processed",
      (data) => {

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["policies"] });
        queryClient.invalidateQueries({ queryKey: ["policy", data.policy_id] });
        queryClient.invalidateQueries({ queryKey: ["policy-analytics"] });

        toast({
          title: "Payment Processed",
          description: `Payment of $${data.amount} processed successfully for policy ${data.policy_id}`,
        });
      },
    );

    const unsubscribePaymentFailed = webSocket.subscribe(
      "payment.failed",
      (data) => {

        toast({
          title: "Payment Failed",
          description: `Payment of $${data.amount} failed for policy ${data.policy_id}`,
          variant: "destructive",
        });
      },
    );

    return () => {
      unsubscribePaymentProcessed();
      unsubscribePaymentFailed();
    };
  }, [webSocket, queryClient]);

  // Subscribe to reinstatement events
  useEffect(() => {
    const unsubscribeReinstatement = webSocket.subscribe(
      "reinstatement.status.changed",
      (data) => {

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["policies"] });
        queryClient.invalidateQueries({ queryKey: ["policy", data.policy_id] });

        toast({
          title: "Reinstatement Status Updated",
          description: `Reinstatement request ${data.request_id} status changed to ${data.new_status}`,
        });
      },
    );

    return unsubscribeReinstatement;
  }, [webSocket, queryClient]);

  // Subscribe to grace period events
  useEffect(() => {
    const unsubscribeGraceStarted = webSocket.subscribe(
      "grace.period.started",
      (data) => {

        queryClient.invalidateQueries({ queryKey: ["policies"] });
        queryClient.invalidateQueries({ queryKey: ["policy", data.policy_id] });

        toast({
          title: "Grace Period Started",
          description: `Policy ${data.policy_id} has entered grace period`,
          variant: "destructive",
        });
      },
    );

    const unsubscribeGraceEnded = webSocket.subscribe(
      "grace.period.ended",
      (data) => {

        queryClient.invalidateQueries({ queryKey: ["policies"] });
        queryClient.invalidateQueries({ queryKey: ["policy", data.policy_id] });

        toast({
          title: "Grace Period Ended",
          description: `Grace period for policy ${data.policy_id} has ended`,
          variant: "destructive",
        });
      },
    );

    return () => {
      unsubscribeGraceStarted();
      unsubscribeGraceEnded();
    };
  }, [webSocket, queryClient]);

  return webSocket;
};

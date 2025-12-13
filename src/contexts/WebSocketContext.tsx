import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketService, getDefaultWebSocketConfig } from '@/services/websocketService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

interface WebSocketContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  connectionAttempts: number;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  autoConnect = true,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);
  const queryClient = useQueryClient();

  // Initialize WebSocket service
  useEffect(() => {
    try {
      const service = WebSocketService.getInstance(getDefaultWebSocketConfig());
      setWsService(service);
    } catch (error) {
      console.error('Failed to initialize WebSocket service:', error);
    }
  }, []);

  // Set up event listeners and connection monitoring
  useEffect(() => {
    if (!wsService) return;

    const checkConnection = () => {
      const status = wsService.getConnectionStatus();
      setIsConnected(status);
    };

    // Check connection status periodically
    const statusInterval = setInterval(checkConnection, 2000);

    // Set up policy event listeners
    const unsubscribeStatusChange = wsService.subscribe('policy.status.changed', (data) => {

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy_id] });
      queryClient.invalidateQueries({ queryKey: ['policy-analytics'] });

      toast({
        title: 'Policy Status Updated',
        description: `Policy ${data.policy_id} status changed from ${data.old_status} to ${data.new_status}`,
      });
    });

    const unsubscribePaymentProcessed = wsService.subscribe('payment.processed', (data) => {

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy_id] });
      queryClient.invalidateQueries({ queryKey: ['policy-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });

      toast({
        title: 'Payment Processed',
        description: `Payment of $${data.amount.toLocaleString()} processed successfully`,
      });
    });

    const unsubscribePaymentFailed = wsService.subscribe('payment.failed', (data) => {

      toast({
        title: 'Payment Failed',
        description: `Payment of $${data.amount.toLocaleString()} failed. Please try again.`,
        variant: 'destructive',
      });
    });

    const unsubscribeReinstatement = wsService.subscribe('reinstatement.status.changed', (data) => {

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy_id] });
      queryClient.invalidateQueries({ queryKey: ['reinstatement-requests'] });

      let description = '';
      switch (data.new_status) {
        case 'approved':
          description = 'Reinstatement request has been approved';
          break;
        case 'rejected':
          description = 'Reinstatement request has been rejected';
          break;
        case 'completed':
          description = 'Policy reinstatement has been completed successfully';
          break;
        case 'pending_payment':
          description = 'Reinstatement is pending payment';
          break;
        case 'pending_underwriting':
          description = 'Reinstatement is pending underwriting review';
          break;
        default:
          description = `Reinstatement status changed to ${data.new_status}`;
      }

      toast({
        title: 'Reinstatement Update',
        description,
        variant: data.new_status === 'rejected' ? 'destructive' : 'default',
      });
    });

    const unsubscribeGraceStarted = wsService.subscribe('grace.period.started', (data) => {

      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy_id] });
      queryClient.invalidateQueries({ queryKey: ['grace-periods'] });

      toast({
        title: 'Grace Period Started',
        description: `Policy ${data.policy_id} has entered its grace period. Payment is overdue.`,
        variant: 'destructive',
      });
    });

    const unsubscribeGraceEnded = wsService.subscribe('grace.period.ended', (data) => {

      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['policy', data.policy_id] });
      queryClient.invalidateQueries({ queryKey: ['grace-periods'] });

      toast({
        title: 'Grace Period Ended',
        description: `Grace period for policy ${data.policy_id} has ended. Policy may have lapsed.`,
        variant: 'destructive',
      });
    });

    return () => {
      clearInterval(statusInterval);
      unsubscribeStatusChange();
      unsubscribePaymentProcessed();
      unsubscribePaymentFailed();
      unsubscribeReinstatement();
      unsubscribeGraceStarted();
      unsubscribeGraceEnded();
    };
  }, [wsService, queryClient]);

  const connect = async () => {
    if (!wsService) {
      throw new Error('WebSocket service not initialized');
    }

    try {
      setConnectionAttempts(prev => prev + 1);
      await wsService.connect();
      setIsConnected(true);

      toast({
        title: 'Connected',
        description: 'Real-time updates are now active.',
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);

      toast({
        title: 'Connection Failed',
        description: 'Unable to establish real-time connection. Some features may be limited.',
        variant: 'destructive',
      });

      throw error;
    }
  };

  const disconnect = () => {
    if (!wsService) return;

    wsService.disconnect();
    setIsConnected(false);

    toast({
      title: 'Disconnected',
      description: 'Real-time updates have been disabled.',
    });
  };

  const reconnect = async () => {
    if (!wsService) {
      throw new Error('WebSocket service not initialized');
    }

    disconnect();

    // Wait a moment before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));

    return connect();
  };

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && wsService) {
      connect().catch(error => {
        console.error('Auto-connect failed:', error);
      });
    }

    return () => {
      if (wsService) {
        disconnect();
      }
    };
  }, [autoConnect, wsService]);

  const value: WebSocketContextType = {
    isConnected,
    connect,
    disconnect,
    reconnect,
    connectionAttempts,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;

import { WebSocketPolicyEvents } from "@/types/policy";

export type WebSocketEventType = keyof WebSocketPolicyEvents;

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private listeners: Map<WebSocketEventType, Set<(data: unknown) => void>> =
    new Map();
  private isConnected = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  public static getInstance(config?: WebSocketConfig): WebSocketService {
    if (!WebSocketService.instance) {
      if (!config) {
        throw new Error(
          "WebSocket configuration is required for first initialization",
        );
      }
      WebSocketService.instance = new WebSocketService(config);
    }
    return WebSocketService.instance;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          
          this.isConnected = false;
          this.stopHeartbeat();

          if (!event.wasClean && this.shouldReconnect()) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.stopHeartbeat();
    this.stopReconnect();

    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }

    this.isConnected = false;
  }

  public subscribe<T extends WebSocketEventType>(
    eventType: T,
    callback: (data: WebSocketPolicyEvents[T]) => void,
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  public unsubscribe(
    eventType: WebSocketEventType,
    callback?: (data: unknown) => void,
  ): void {
    if (!callback) {
      // Remove all listeners for this event type
      this.listeners.delete(eventType);
      return;
    }

    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  public send(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected. Cannot send message.");
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private handleMessage(data: Record<string, unknown>): void {
    const { type, payload } = data;

    if (type === "heartbeat") {
      this.handleHeartbeat();
      return;
    }

    const eventListeners = this.listeners.get(type as WebSocketEventType);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error("Error in WebSocket event callback:", error);
        }
      });
    }
  }

  private handleHeartbeat(): void {
    // Send heartbeat response
    this.send({ type: "heartbeat_response" });
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval) {
      this.heartbeatTimer = setInterval(() => {
        this.send({ type: "heartbeat" });
      }, this.config.heartbeatInterval);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < this.config.maxReconnectAttempts!;
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect()) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
        if (this.shouldReconnect()) {
          this.attemptReconnect();
        }
      });
    }, this.config.reconnectInterval);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Factory function for easier usage
export const createWebSocketService = (
  config: WebSocketConfig,
): WebSocketService => {
  return WebSocketService.getInstance(config);
};

// Default configuration
export const getDefaultWebSocketConfig = (): WebSocketConfig => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;

  return {
    url: `${protocol}//${host}/ws/policies`,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
  };
};

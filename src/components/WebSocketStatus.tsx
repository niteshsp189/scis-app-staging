import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

interface WebSocketStatusProps {
  className?: string;
  showLabel?: boolean;
  showReconnectButton?: boolean;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  className = "",
  showLabel = true,
  showReconnectButton = true,
}) => {
  const { isConnected, reconnect } = useWebSocketContext();

  const handleReconnect = async () => {
    try {
      await reconnect();
    } catch (error) {
      console.error("Manual reconnection failed:", error);
    }
  };

  const statusConfig = {
    connected: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: Wifi,
      label: "Connected",
      tooltip:
        "Real-time updates are active. You will receive live notifications for policy changes.",
    },
    disconnected: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: WifiOff,
      label: "Disconnected",
      tooltip:
        "Real-time updates are unavailable. Some data may not be current. Click refresh to reconnect.",
    },
  };

  const config = isConnected
    ? statusConfig.connected
    : statusConfig.disconnected;
  const IconComponent = config.icon;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 text-xs ${config.color}`}
            >
              <IconComponent className="h-3 w-3" />
              {showLabel && config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-center">{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>

        {!isConnected && showReconnectButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReconnect}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reconnect to real-time updates</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default WebSocketStatus;

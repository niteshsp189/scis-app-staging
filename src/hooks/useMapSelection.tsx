import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Globe, Map } from "lucide-react";

interface MapOption {
  label: string;
  icon: React.ReactNode;
  getUrl: (address: string) => string;
  color: string;
}

const mapOptions: MapOption[] = [
  {
    label: "Google Maps",
    icon: <Globe className="h-5 w-5" />,
    getUrl: (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    color: "text-red-500",
  },
  {
    label: "Apple Maps",
    icon: <Map className="h-5 w-5" />,
    getUrl: (address) => `https://maps.apple.com/?q=${encodeURIComponent(address)}`,
    color: "text-blue-500",
  },
  {
    label: "Bing Maps",
    icon: <Navigation className="h-5 w-5" />,
    getUrl: (address) => `https://www.bing.com/maps?q=${encodeURIComponent(address)}`,
    color: "text-teal-500",
  },
  {
    label: "Waze",
    icon: <MapPin className="h-5 w-5" />,
    getUrl: (address) => `https://waze.com/ul?q=${encodeURIComponent(address)}`,
    color: "text-cyan-500",
  },
  {
    label: "OpenStreetMap",
    icon: <Globe className="h-5 w-5" />,
    getUrl: (address) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`,
    color: "text-green-600",
  },
];

export const useMapSelection = () => {
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  const handleMapClick = (address: string) => {
    if (!address || address === "N/A") return;
    setCurrentAddress(address);
    setShowMapDialog(true);
  };

  const handleMapSelect = (option: MapOption) => {
    const url = option.getUrl(currentAddress);
    window.open(url, "_blank");
    setShowMapDialog(false);
    setCurrentAddress("");
  };

  const closeDialog = () => {
    setShowMapDialog(false);
    setCurrentAddress("");
  };

  const MapSelectionDialog = () => {
    return (
      <Dialog open={showMapDialog} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Open in Maps
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground px-1 -mt-1">
            {currentAddress}
          </div>
          <div className="space-y-3 py-2">
            {mapOptions.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start min-h-[3rem]"
                onClick={() => handleMapSelect(option)}
              >
                <div className="flex items-center gap-3">
                  <span className={option.color}>{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    handleMapClick,
    MapSelectionDialog,
  };
};

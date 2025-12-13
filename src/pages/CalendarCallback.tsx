import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Calendar } from "lucide-react";
import { calendarIntegrationService } from "@/services/calendarIntegrationService";

export default function CalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const providerFromPath = window.location.pathname.split("/").pop();

        if (
          !providerFromPath ||
          !["google", "microsoft"].includes(providerFromPath)
        ) {
          throw new Error("Invalid provider in callback URL");
        }

        setProvider(providerFromPath);

        if (error) {
          throw new Error(`Authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        // Handle the OAuth callback
        const result = await calendarIntegrationService.handleCallback(
          providerFromPath as "google" | "microsoft",
          code,
          state || undefined,
        );

        setStatus("success");
        setMessage(result.message);

        // Get the return URL from sessionStorage
        const returnUrl =
          sessionStorage.getItem("oauth_return_url") || "/appointments";

        // Clean up session storage
        sessionStorage.removeItem("oauth_return_url");
        sessionStorage.removeItem("oauth_provider");

        // Redirect back to the original page after 2 seconds
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 2000);
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to connect calendar");

        // Get the return URL from sessionStorage
        const returnUrl =
          sessionStorage.getItem("oauth_return_url") || "/appointments";

        // Clean up session storage
        sessionStorage.removeItem("oauth_return_url");
        sessionStorage.removeItem("oauth_provider");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "google":
        return "Google Calendar";
      case "microsoft":
        return "Microsoft Outlook";
      default:
        return "Calendar";
    }
  };

  const handleReturnToSettings = () => {
    navigate("/appointments", { replace: true });
  };

  const handleRetry = () => {
    navigate("/appointments", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Calendar className="h-6 w-6" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <>
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Connecting Calendar</h2>
              <p className="text-gray-600">
                Processing your {getProviderName(provider)} authorization...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-green-600">
                Connection Successful!
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting you back to appointments...
              </p>
              <Button onClick={handleReturnToSettings} className="w-full">
                Return to Appointments
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-red-600">
                Connection Failed
              </h2>
              <p className="text-gray-600">{message}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button
                  onClick={handleReturnToSettings}
                  variant="outline"
                  className="w-full"
                >
                  Return to Appointments
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

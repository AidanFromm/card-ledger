import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import {
  Link2,
  Unlink,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import {
  getEbayAuthUrl,
  getEbayConnectionStatus,
  disconnectEbay,
  exchangeCodeForTokens,
  verifyOAuthState,
  EbayConnectionStatus,
} from "@/lib/ebay";

const EbayConnect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [connectionStatus, setConnectionStatus] = useState<EbayConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Check for OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      toast({
        variant: "destructive",
        title: "eBay Authorization Failed",
        description: errorDescription || error,
      });
      // Clean up URL
      navigate("/ebay", { replace: true });
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  // Load connection status
  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    setLoading(true);
    try {
      const status = await getEbayConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error("Error loading eBay status:", error);
      setConnectionStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    // Verify state to prevent CSRF
    if (!verifyOAuthState(state)) {
      toast({
        variant: "destructive",
        title: "Security Error",
        description: "OAuth state mismatch. Please try connecting again.",
      });
      navigate("/ebay", { replace: true });
      return;
    }

    setConnecting(true);
    try {
      await exchangeCodeForTokens(code);
      toast({
        title: "eBay connected",
        description: "Your eBay account has been successfully linked.",
      });
      await loadConnectionStatus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect eBay account",
      });
    } finally {
      setConnecting(false);
      // Clean up URL
      navigate("/ebay", { replace: true });
    }
  };

  const handleConnect = () => {
    try {
      const authUrl = getEbayAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: error instanceof Error ? error.message : "eBay not configured",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your eBay account?")) {
      return;
    }

    setDisconnecting(true);
    try {
      await disconnectEbay();
      setConnectionStatus({ connected: false });
      toast({
        title: "eBay Disconnected",
        description: "Your eBay account has been unlinked.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const features = [
    {
      icon: Package,
      title: "Import Listings",
      description: "Import your active eBay listings directly into your inventory",
    },
    {
      icon: DollarSign,
      title: "Track Sales",
      description: "Automatically sync sold items to your sales tracker",
    },
    {
      icon: TrendingUp,
      title: "Price Reference",
      description: "See recent eBay sold prices when adding cards",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
        <div className="flex">
          <DesktopSidebar />
      
      <div className="container max-w-2xl mx-auto px-4 pt-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">eBay Integration</h1>
            <p className="text-muted-foreground">
              Connect your eBay account to import listings and track sales
            </p>
          </div>

          {/* Connection Status Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Connection Status</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadConnectionStatus}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Checking connection...</span>
                </div>
              ) : connectionStatus?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium">Connected</p>
                      {connectionStatus.username && (
                        <p className="text-sm text-muted-foreground">
                          eBay user: {connectionStatus.username}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-auto bg-green-500/10 text-green-500">
                      Active
                    </Badge>
                  </div>

                  {connectionStatus.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Token expires: {new Date(connectionStatus.expiresAt).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/ebay/listings")}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      View Listings
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Not Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Link your eBay account to get started
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Connect eBay Account
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What You Can Do</CardTitle>
              <CardDescription>
                Features available with eBay integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              CardLedger only accesses your eBay listings and sales data.
              <br />
              We never make changes to your eBay account.
              <br />
              <a
                href="https://developer.ebay.com/api-docs/static/oauth-scopes.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                Learn about eBay API permissions
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      </div>
      <BottomNav />
    </div>
  );
};

export default EbayConnect;

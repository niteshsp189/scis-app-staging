
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const Subscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'starter';
  const [isLoading, setIsLoading] = useState(false);

  const plans = {
    starter: { name: "Starter", price: 29, features: ["Up to 1,000 leads", "5 team members", "Basic reporting", "Email support"] },
    professional: { name: "Professional", price: 79, features: ["Up to 10,000 leads", "25 team members", "Advanced workflows", "Priority support", "Custom integrations"] },
    enterprise: { name: "Enterprise", price: 199, features: ["Unlimited leads", "Unlimited team members", "Advanced analytics", "24/7 phone support", "Custom development"] }
  };

  const currentPlan = plans[selectedPlan as keyof typeof plans] || plans.starter;

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: "Subscription Activated!",
        description: "Welcome to InsureCRM. Setting up your workspace...",
      });
      navigate('/dashboard');
      setIsLoading(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">InsureCRM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
          <p className="text-gray-600">You're just one step away from transforming your insurance business</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {currentPlan.name} Plan
                <span className="text-2xl font-bold text-blue-600">
                  ${currentPlan.price}/mo
                </span>
              </CardTitle>
              <CardDescription>
                Perfect for your business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  🎉 14-day free trial included
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Cancel anytime during your trial period
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription>
                Secure payment powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Secure Payment Form</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your payment information will be processed securely
                </p>
                <Button 
                  onClick={handleSubscribe}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing Payment..." : `Subscribe for $${currentPlan.price}/month`}
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
                <p className="mt-1">Your subscription will auto-renew monthly.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/signup')}>
            Back to Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;

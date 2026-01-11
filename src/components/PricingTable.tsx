import { useState } from "react";
import { Check, Zap, Shield, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PiPaymentButton } from "@/components/PiPaymentButton";
import { usePiAuth } from "@/contexts/PiAuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
  memo: string;
}

const ANNUAL_DISCOUNT = 0.20; // 20% discount

const tiers: PricingTier[] = [
  {
    name: "Basic",
    description: "Essential verification for small businesses",
    monthlyPrice: 1,
    annualPrice: Math.round(1 * 12 * (1 - ANNUAL_DISCOUNT)),
    icon: <Zap className="h-6 w-6" />,
    memo: "Basic Verification Plan",
    features: [
      "5 verifications per month",
      "Standard processing speed",
      "Email support",
      "Basic analytics",
    ],
  },
  {
    name: "Professional",
    description: "Advanced features for growing businesses",
    monthlyPrice: 5,
    annualPrice: Math.round(5 * 12 * (1 - ANNUAL_DISCOUNT)),
    icon: <Shield className="h-6 w-6" />,
    memo: "Professional Verification Plan",
    popular: true,
    features: [
      "50 verifications per month",
      "Priority processing",
      "API access",
      "Detailed analytics",
      "Batch verification",
      "24/7 support",
    ],
  },
  {
    name: "Enterprise",
    description: "Unlimited power for large organizations",
    monthlyPrice: 20,
    annualPrice: Math.round(20 * 12 * (1 - ANNUAL_DISCOUNT)),
    icon: <Crown className="h-6 w-6" />,
    memo: "Enterprise Verification Plan",
    features: [
      "Unlimited verifications",
      "Instant processing",
      "Full API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "White-label options",
    ],
  },
];

export const PricingTable = () => {
  const { user } = usePiAuth();
  const [isAnnual, setIsAnnual] = useState(false);

  const handlePaymentSuccess = (tierName: string) => {
    toast.success(`Successfully purchased ${tierName} plan!`, {
      description: "Your account has been upgraded.",
    });
  };

  const handlePaymentError = (error: Error) => {
    toast.error("Payment failed", {
      description: error.message,
    });
  };

  const getPrice = (tier: PricingTier) => isAnnual ? tier.annualPrice : tier.monthlyPrice;
  const getBillingPeriod = () => isAnnual ? "per year" : "per month";
  const getMemo = (tier: PricingTier) => `${tier.memo} - ${isAnnual ? "Annual" : "Monthly"}`;

  return (
    <section id="features" className="w-full max-w-6xl mx-auto py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the verification tier that best fits your business needs. Pay securely with Pi.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <Label htmlFor="billing-toggle" className={`text-sm ${!isAnnual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-toggle" className={`text-sm ${isAnnual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Annual
          </Label>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
            Save 20%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`relative flex flex-col ${
              tier.popular
                ? "border-primary shadow-lg shadow-primary/20 scale-105"
                : "border-border"
            }`}
          >
            {tier.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}

            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-3">
                {tier.icon}
              </div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-foreground">{getPrice(tier)}</span>
                <span className="text-2xl font-semibold text-primary ml-1">π</span>
                <span className="text-muted-foreground text-sm block mt-1">{getBillingPeriod()}</span>
                {isAnnual && (
                  <span className="text-xs text-primary mt-1 block">
                    Save {Math.round(tier.monthlyPrice * 12 * ANNUAL_DISCOUNT)}π vs monthly
                  </span>
                )}
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {user ? (
                <PiPaymentButton
                  amount={getPrice(tier)}
                  memo={getMemo(tier)}
                  metadata={{ tier: tier.name, billing: isAnnual ? "annual" : "monthly" }}
                  onSuccess={() => handlePaymentSuccess(tier.name)}
                  onError={handlePaymentError}
                  className={`w-full ${
                    tier.popular
                      ? "bg-primary hover:bg-primary/90"
                      : ""
                  }`}
                >
                  Get {tier.name}
                </PiPaymentButton>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Sign in to purchase
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};

import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  useSubscriptionPlans,
  useCheckoutRegister,
  useConfirmSubscription,
  useStripePublishableKey,
  useSubscription,
} from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Check,
  Loader2,
  Zap,
  ArrowLeft,
  CreditCard,
  LineChart,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const PLAN_DISPLAY: Record<
  string,
  {
    name: string;
    description: string;
    highlights: string[];
  }
> = {
  basic: {
    name: "Basic",
    description: "Essential gold market analysis",
    highlights: [
      "Real-time XAU/USD price tracking",
      "RSI technical indicator",
      "3 AI predictions per day",
    ],
  },
  pro: {
    name: "Pro",
    description: "Advanced tools for serious traders",
    highlights: [
      "Real-time XAU/USD price tracking",
      "RSI, MACD & SMA indicators",
      "Unlimited AI predictions",
      "Full trading signals access",
      "Market analysis reports",
    ],
  },
  premium: {
    name: "Premium",
    description: "Complete suite for professionals",
    highlights: [
      "Everything in Pro, plus:",
      "Priority trading signals",
      "Real-time email alerts",
      "Premium AI market reports",
    ],
  },
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

const ELEMENT_STYLE = {
  base: {
    fontSize: "15px",
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    "::placeholder": { color: "rgba(255,255,255,0.2)" },
    iconColor: "#f59e0b",
  },
  invalid: { color: "#ef4444", iconColor: "#ef4444" },
};

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all";
const labelClass =
  "block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1";
const cardBoxClass =
  "bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5";

function CardFields({
  onCardNumberChange,
  onCardExpiryChange,
  onCardCvcChange,
  onError,
  clearError,
}: {
  onCardNumberChange: (c: boolean) => void;
  onCardExpiryChange: (c: boolean) => void;
  onCardCvcChange: (c: boolean) => void;
  onError: (m: string) => void;
  clearError: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Card Number</label>
        <div className={cardBoxClass}>
          <CardNumberElement
            options={{ style: ELEMENT_STYLE, showIcon: true, disableLink: true }}
            onChange={(e) => {
              onCardNumberChange(e.complete);
              if (e.error) onError(e.error.message);
              else clearError();
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Expiry</label>
          <div className={cardBoxClass}>
            <CardExpiryElement
              options={{ style: ELEMENT_STYLE }}
              onChange={(e) => {
                onCardExpiryChange(e.complete);
                if (e.error) onError(e.error.message);
                else clearError();
              }}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>CVC</label>
          <div className={cardBoxClass}>
            <CardCvcElement
              options={{ style: ELEMENT_STYLE }}
              onChange={(e) => {
                onCardCvcChange(e.complete);
                if (e.error) onError(e.error.message);
                else clearError();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({
  priceId,
  planName,
  amount,
  currency,
  onSuccess,
}: {
  priceId: string;
  planName: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);

  const checkoutRegister = useCheckoutRegister();
  const confirmSubscription = useConfirmSubscription();

  const cardComplete =
    cardNumberComplete && cardExpiryComplete && cardCvcComplete;
  const isFormValid = email && password.length >= 6 && cardComplete;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) return;

    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { subscriptionId, clientSecret } =
        await checkoutRegister.mutateAsync({
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          priceId,
        });

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardNumberElement },
        }
      );

      if (error) {
        setErrorMessage(error.message || "Payment failed. Please try again.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await confirmSubscription.mutateAsync(subscriptionId);
        onSuccess();
      } else {
        setErrorMessage(
          "Payment requires additional verification. Please contact support."
        );
      }
    } catch (err: any) {
      let msg = err.message || "An unexpected error occurred.";
      try {
        const m = msg.match(/\{.*\}/);
        if (m) {
          const p = JSON.parse(m[0]);
          if (p.error) msg = p.error;
        }
      } catch {}

      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Your Account
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              data-testid="input-checkout-first-name"
            />
          </div>

          <div>
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              data-testid="input-checkout-last-name"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            data-testid="input-checkout-email"
          />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password (min. 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass + " pr-12"}
              data-testid="input-checkout-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
              data-testid="button-toggle-password"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Payment Details
        </p>
        <CardFields
          onCardNumberChange={setCardNumberComplete}
          onCardExpiryChange={setCardExpiryComplete}
          onCardCvcChange={setCardCvcComplete}
          onError={(m) => setErrorMessage(m)}
          clearError={() => {
            if (
              !cardNumberComplete ||
              !cardExpiryComplete ||
              !cardCvcComplete
            ) {
              setErrorMessage(null);
            }
          }}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-400">{errorMessage}</span>
        </div>
      )}

      <div className="bg-white/3 border border-white/6 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-white/40">{planName} Plan · Monthly</span>
        <span className="text-base font-bold text-amber-400">
          {formatPrice(amount, currency)}
        </span>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !isFormValid}
        className="w-full h-14 rounded-2xl font-bold text-base text-black flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          boxShadow:
            "0 0 30px rgba(245,158,11,0.25), 0 4px 20px rgba(0,0,0,0.4)",
        }}
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Create Account & Pay {formatPrice(amount, currency)}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/20">
        <Shield className="w-3 h-3" />
        Secured by Stripe · Cancel anytime
      </div>
    </form>
  );
}

function UpgradePaymentForm({
  planName,
  priceId,
  fullAmount,
  currency,
  currentPlanKey,
  onSuccess,
}: {
  planName: string;
  priceId: string;
  fullAmount: number;
  currency: string;
  currentPlanKey: string | null;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeData, setUpgradeData] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const cardComplete =
    cardNumberComplete && cardExpiryComplete && cardCvcComplete;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await apiRequest("POST", "/api/subscription/change-plan", {
          priceId,
        });

        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.error || "Failed to initiate upgrade");
        }

        const data = await res.json();

        if (data.status === "requires_payment" && data.clientSecret) {
          setUpgradeData(data);
        } else {
          throw new Error("Upgrade requires payment confirmation.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to prepare upgrade.");
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [priceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !upgradeData) return;

    const cardEl = elements.getElement(CardNumberElement);
    if (!cardEl) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        upgradeData.clientSecret,
        {
          payment_method: { card: cardEl },
        }
      );

      if (error) {
        setErrorMessage(error.message || "Payment failed.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const r = await apiRequest("POST", "/api/subscription/confirm-upgrade", {
          paymentIntentId: paymentIntent.id,
        });

        if (!r.ok) {
          const e = await r.json();
          throw new Error(e.error || "Failed to activate upgrade");
        }

        queryClient.removeQueries({ queryKey: ["/api/subscription/status"] });
        queryClient.removeQueries({ queryKey: ["/api/predictions/usage"] });
        queryClient.removeQueries({ queryKey: ["/api/auth/user"] });

        setUpgradeSuccess(true);
        setTimeout(() => setLocation("/dashboard"), 4000);
      } else {
        setErrorMessage("Payment requires additional verification.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        <p className="text-sm text-white/30">Preparing your upgrade...</p>
      </div>
    );
  }

  if (upgradeSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Upgrade Successful!</h3>
        <p className="text-sm text-white/40">
          Your plan is now{" "}
          <span className="text-amber-400 font-semibold">{planName}</span>.
          Redirecting...
        </p>
      </div>
    );
  }

  if (errorMessage && !upgradeData) {
    return (
      <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm text-red-400">{errorMessage}</span>
      </div>
    );
  }

  const chargeAmount = upgradeData?.amount || fullAmount;
  const chargeCurrency = upgradeData?.currency || currency;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
        Payment Details
      </p>

      <CardFields
        onCardNumberChange={setCardNumberComplete}
        onCardExpiryChange={setCardExpiryComplete}
        onCardCvcChange={setCardCvcComplete}
        onError={setErrorMessage}
        clearError={() => setErrorMessage(null)}
      />

      {errorMessage && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-400">{errorMessage}</span>
        </div>
      )}

      <div className="bg-white/3 border border-white/6 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-white/40">Prorated Charge Today</span>
        <span className="text-base font-bold text-amber-400">
          {formatPrice(chargeAmount, chargeCurrency)}
        </span>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !cardComplete}
        className="w-full h-14 rounded-2xl font-bold text-base text-black flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden group"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          boxShadow: "0 0 30px rgba(245,158,11,0.25)",
        }}
        data-testid="button-confirm-upgrade-payment"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Confirm Upgrade · {formatPrice(chargeAmount, chargeCurrency)}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/20">
        <Shield className="w-3 h-3" />
        Secured by Stripe · Cancel anytime
      </div>
    </form>
  );
}

function CheckoutContent() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const planId = params.get("plan");
  const priceIdParam = params.get("priceId");
  const isUpgradeMode = params.get("upgrade") === "true";

  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: stripeKeyData, isLoading: stripeLoading } =
    useStripePublishableKey();

  const [stripePromise, setStripePromise] = useState<ReturnType<
    typeof loadStripe
  > | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (stripeKeyData?.publishableKey && !stripePromise) {
      setStripePromise(loadStripe(stripeKeyData.publishableKey));
    }
  }, [stripeKeyData?.publishableKey, stripePromise]);

  const plans = plansData?.plans || [];

  let selectedPlan: any = null;
  let price: any = null;

  if (priceIdParam) {
    for (const p of plans) {
      const foundPrice = p.prices?.find((pr: any) => pr.id === priceIdParam);
      if (foundPrice) {
        selectedPlan = p;
        price = foundPrice;
        break;
      }
    }
  }

  if (!selectedPlan && planId) {
    selectedPlan = plans.find((p: any) => p.metadata?.plan === planId);
    price = selectedPlan?.prices?.[0];
  }

  const planKey =
    (selectedPlan?.metadata?.plan as keyof typeof PLAN_DISPLAY) || "pro";
  const display = PLAN_DISPLAY[planKey] || PLAN_DISPLAY.pro;

  useEffect(() => {
    if (!plansLoading && !planId && !priceIdParam) {
      setLocation("/");
    }
  }, [plansLoading, planId, priceIdParam, setLocation]);

  useEffect(() => {
    if (isUpgradeMode && !user) {
      setLocation("/login");
    }
  }, [isUpgradeMode, user, setLocation]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => setLocation("/dashboard"), 5000);
  };

  const isLoading = plansLoading || stripeLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
        <div className="text-center space-y-5 fade-in-up">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto animate-glow-pulse">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>

          <h2
            className="text-2xl font-display font-bold text-white"
            data-testid="text-payment-success"
          >
            {isUpgradeMode ? "Upgrade Successful!" : "Welcome to Gold Predict!"}
          </h2>

          <p className="text-sm text-white/40">
            {isUpgradeMode
              ? `You've been upgraded to ${display.name}.`
              : "Your subscription is now active."}
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-white/25">
            <Loader2 className="w-3 h-3 animate-spin" />
            Redirecting to your dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPlan || !price) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-white/40">Plan not found</p>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-amber-400 text-sm font-medium mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] font-body flex flex-col overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/8 blur-[120px] animate-blob" />
      </div>

      <header className="relative z-10 px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <LineChart className="w-4 h-4 text-black" />
          </div>
          <span className="text-base font-display font-bold text-white tracking-tight">
            Gold Predict
          </span>
        </div>

        <button
          onClick={() => setLocation(isUpgradeMode ? "/dashboard" : "/")}
          className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors"
          data-testid="button-back-plans"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      <main className="relative z-10 flex-1 px-6 pb-8 pt-2 space-y-5 max-w-lg mx-auto w-full">
        <div className="bg-white/3 border border-white/6 rounded-3xl overflow-hidden fade-in-up">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>

            <div>
              <div className="text-sm font-bold text-white">
                {display.name} Plan
              </div>
              <div className="text-xs text-white/30">
                {display.description}
              </div>
            </div>

            <div className="ml-auto text-right">
              <div className="text-lg font-bold text-amber-400">
                {formatPrice(price.unitAmount, price.currency)}
              </div>
              <div className="text-[10px] text-white/25">/month</div>
            </div>
          </div>

          <div className="px-5 py-4 grid grid-cols-1 gap-2">
            {display.highlights.map((feat, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <span className="text-xs text-white/50">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="bg-white/3 border border-white/6 rounded-3xl px-5 py-5 fade-in-up fade-in-up-delay-2"
          data-testid="card-payment-details"
        >
          <h2 className="text-base font-bold text-white mb-4">
            {isUpgradeMode ? "Confirm Upgrade" : "Create Account & Pay"}
          </h2>

          {stripePromise ? (
            <Elements stripe={stripePromise}>
              {isUpgradeMode ? (
                <UpgradePaymentForm
                  planName={display.name}
                  priceId={price.id}
                  fullAmount={price.unitAmount}
                  currency={price.currency}
                  currentPlanKey={subscription?.plan || null}
                  onSuccess={handlePaymentSuccess}
                />
              ) : (
                <PaymentForm
                  priceId={price.id}
                  planName={display.name}
                  amount={price.unitAmount}
                  currency={price.currency}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Checkout() {
  return <CheckoutContent />;
}
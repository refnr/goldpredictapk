import { useSubscriptionPlans } from "@/hooks/use-subscription";
import {
  Check,
  Loader2,
  LineChart,
  LogIn,
  TrendingUp,
  BarChart2,
  Zap,
  Bell,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

const FEATURES = [
  { icon: TrendingUp, label: "Real-time XAU/USD price tracking" },
  { icon: BarChart2, label: "RSI, MACD & SMA indicators" },
  { icon: Zap, label: "Unlimited AI-powered predictions" },
  { icon: LineChart, label: "Professional trading signals" },
  { icon: Bell, label: "Market analysis reports" },
  { icon: Shield, label: "Cancel anytime, no commitment" },
];

export default function LandingPricing() {
  const [, setLocation] = useLocation();
  const { data: plansData, isLoading } = useSubscriptionPlans();

  const proPlans =
    plansData?.plans?.filter((p: any) => p.metadata?.plan === "pro") || [];

  const proPlan = proPlans[0];
  const price = proPlan?.prices?.[0];

  // ✅ FUNZIONE CENTRALE CORRETTA
  const handleStartSubscription = () => {
    const target = price?.id
      ? `/checkout?priceId=${encodeURIComponent(price.id)}&plan=pro`
      : "/checkout?plan=pro";

    setLocation(target);
  };

  return (
    <div className="min-h-screen bg-[#080808] font-body flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
            <LineChart className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-display font-bold text-white">
            Gold Predict
          </span>
        </div>

        <button
          onClick={() => setLocation("/login")}
          className="text-sm text-white/40 hover:text-amber-400 transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Pricing */}
      <div className="relative z-10 mx-4 flex-1">
        <div className="rounded-3xl border border-amber-500/15 p-6">

          <div className="mb-6">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            ) : price ? (
              <div className="text-3xl font-bold text-white">
                {formatPrice(price.unitAmount, price.currency)} /mo
              </div>
            ) : (
              <div className="text-3xl font-bold text-white">$19.99 /mo</div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400" />
                <span className="text-white/70 text-sm">{f.label}</span>
              </div>
            ))}
          </div>

          {/* ✅ CTA FIX DEFINITIVO */}
          <button
            onClick={handleStartSubscription}
            className="w-full h-14 rounded-2xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition"
            data-testid="button-subscribe-pro"
          >
            Start Subscription
          </button>

          <p className="text-center text-xs text-white/30 mt-3">
            Secure payment · Cancel anytime
          </p>
        </div>
      </div>

      {/* Already member */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setLocation("/login")}
          className="w-full text-sm text-white/40"
        >
          Already subscribed? Sign in
        </button>
      </div>
    </div>
  );
}
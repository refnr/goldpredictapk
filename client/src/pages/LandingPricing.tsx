import { useSubscriptionPlans } from "@/hooks/use-subscription";
import { Check, Loader2, LineChart, LogIn, TrendingUp, BarChart2, Zap, Bell, Shield, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
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

  const proPlans = plansData?.plans?.filter(
    (p: any) => p.metadata?.plan === "pro"
  ) || [];
  const proPlan = proPlans[0];
  const price = proPlan?.prices?.[0];

  const handleStartSubscription = () => {
    const target = price?.id
      ? `/checkout?priceId=${encodeURIComponent(price.id)}&plan=pro`
      : "/checkout?plan=pro";

    setLocation(target);
  };

  return (
    <div className="min-h-screen bg-[#080808] font-body flex flex-col overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[140px] animate-blob" />
        <div className="absolute top-[40%] right-[-100px] w-[350px] h-[350px] rounded-full bg-amber-600/7 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[280px] h-[280px] rounded-full bg-yellow-500/6 blur-[90px] animate-blob animation-delay-4000" />
        {/* Shimmer line */}
        <div className="absolute top-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent animate-shimmer-line" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 animate-glow-pulse">
            <LineChart className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-display font-bold text-white tracking-tight">
            Gold Predict
          </span>
        </div>
        <button
          onClick={() => setLocation("/login")}
          className="text-sm text-white/40 font-medium flex items-center gap-1 hover:text-amber-400 transition-colors"
          data-testid="button-login-header"
        >
          Sign in
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero */}
      <div className="relative z-10 px-6 pt-8 pb-6 text-center fade-in-up">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
            Live Gold Market Intelligence
          </span>
        </div>

        <h1 className="text-[2.6rem] font-display font-bold text-white leading-[1.15] mb-4 tracking-tight">
          Trade Gold Smarter<br />
          with{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              AI Analysis
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-amber-400/0 via-amber-400/60 to-amber-400/0" />
          </span>
        </h1>

        <p className="text-sm text-white/40 leading-relaxed max-w-[260px] mx-auto">
          Real-time XAU/USD predictions, professional signals, and advanced indicators.
        </p>
      </div>

      {/* Stats row */}
      <div className="relative z-10 px-6 mb-6 fade-in-up fade-in-up-delay-2">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "99.2%", label: "Uptime" },
            { value: "24/7", label: "Live data" },
            { value: "∞", label: "Predictions" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/3 border border-white/6 rounded-2xl py-3 px-2 text-center">
              <div className="text-lg font-bold text-amber-400">{stat.value}</div>
              <div className="text-[10px] text-white/30 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Card */}
      <div className="relative z-10 mx-4 flex-1 fade-in-up fade-in-up-delay-3">
        <div className="rounded-3xl overflow-hidden border border-amber-500/15 shadow-2xl shadow-amber-900/30 relative">
          {/* Card gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c1500] via-[#130f00] to-[#0c0c0c]" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

          {/* Plan header */}
          <div className="relative px-6 pt-6 pb-5 border-b border-white/5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[11px] font-bold text-amber-400/70 uppercase tracking-[0.15em] mb-1">Pro Membership</div>
                <div className="text-white/30 text-xs">All features · No limits · Cancel anytime</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-1">
              {isLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span className="text-white/30 text-sm">Loading...</span>
                </div>
              ) : price ? (
                <>
                  <span className="text-[3.2rem] font-bold text-white leading-none tracking-tight">
                    {formatPrice(price.unitAmount, price.currency)}
                  </span>
                  <span className="text-white/30 text-sm mb-1">/mo</span>
                </>
              ) : (
                <>
                  <span className="text-[3.2rem] font-bold text-white leading-none">$19.99</span>
                  <span className="text-white/30 text-sm mb-1">/mo</span>
                </>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="relative px-6 py-5 space-y-3">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/12 border border-amber-500/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-sm text-white/65">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="relative px-6 pb-6 pt-1">
            <button
              onClick={handleStartSubscription}
              className="w-full h-14 rounded-2xl font-bold text-base text-black flex items-center justify-center gap-2 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.3), 0 4px 20px rgba(0,0,0,0.4)',
              }}
              data-testid="button-subscribe-pro"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Subscription
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </span>
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
            <p className="text-center text-[11px] text-white/20 mt-3">
              Billed monthly · Secure payment · Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Already a member */}
      <div className="relative z-10 px-6 pt-5 pb-4">
        <button
          onClick={() => setLocation("/login")}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-white/8 text-sm text-white/35 font-medium hover:border-white/15 hover:text-white/60 transition-all"
          data-testid="button-login-member"
        >
          <LogIn className="w-4 h-4" />
          Already subscribed? Sign in
        </button>
      </div>

      {/* Disclaimer */}
      <div className="relative z-10 px-6 pb-8">
        <p className="text-center text-[10px] text-white/15 leading-relaxed">
          For informational purposes only. Not financial advice.
          Trading involves risk. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
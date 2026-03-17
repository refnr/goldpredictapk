import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2, LineChart, Zap, TrendingUp, BarChart2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    const timer = setTimeout(() => setLocation("/dashboard"), 6000);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: TrendingUp, label: "Real-time XAU/USD tracking" },
    { icon: BarChart2, label: "RSI, MACD & SMA indicators" },
    { icon: Zap, label: "Unlimited AI predictions" },
  ];

  return (
    <div className="min-h-screen bg-[#080808] font-body flex flex-col overflow-hidden relative" data-testid="card-subscription-success">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/8 blur-[130px] animate-blob" />
        <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] rounded-full bg-green-500/5 blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-glow-pulse">
            <LineChart className="w-4 h-4 text-black" />
          </div>
          <span className="text-base font-display font-bold text-white tracking-tight">Gold Predict</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-7 fade-in-up"
          style={{ boxShadow: "0 0 40px rgba(34,197,94,0.15)" }}>
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>

        <div className="fade-in-up fade-in-up-delay-2 space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-green-400 uppercase tracking-widest">Subscription Active</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Gold Predict!
            </span>
          </h1>
          <p className="text-sm text-white/40 max-w-xs mx-auto leading-relaxed">
            Your Pro membership is now active. You have full access to all features.
          </p>
        </div>

        {/* Feature list */}
        <div className="w-full max-w-xs space-y-2.5 mb-10 fade-in-up fade-in-up-delay-3">
          {features.map((feat, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
                <feat.icon className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm text-white/60">{feat.label}</span>
            </div>
          ))}
        </div>

        {/* Redirect info */}
        <div className="flex items-center gap-2 text-xs text-white/20 fade-in-up fade-in-up-delay-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Taking you to your dashboard...
        </div>

        {/* Manual button */}
        <button
          onClick={() => setLocation("/dashboard")}
          className="mt-6 h-12 px-8 rounded-2xl font-bold text-sm text-black"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 0 24px rgba(245,158,11,0.25)" }}
          data-testid="button-go-dashboard"
        >
          Go to Dashboard
        </button>
      </main>

      {/* Disclaimer */}
      <div className="relative z-10 px-6 pb-8 text-center">
        <p className="text-[10px] text-white/15">
          For informational purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}

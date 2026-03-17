import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePredictionUsage } from "@/hooks/use-prediction";
import { useSubscription } from "@/hooks/use-subscription";
import type { Timeframe, PredictionResponse, LivePrice } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  RefreshCw,
  Gauge,
  LineChart,
  Zap,
  AlertTriangle,
  Lock
} from "lucide-react";

export default function Analysis() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [, setLocation] = useLocation();
  const { data: usage } = usePredictionUsage();
  const { hasFeature, hasIndicator } = useSubscription();
  const isLimitReached = usage && usage.limit !== 'unlimited' && usage.used >= usage.limit;
  
  const { data: livePrice, refetch: refetchPrice } = useQuery<LivePrice>({
    queryKey: ['/api/live-price'],
    refetchInterval: 10000,
  });

  const { mutate, isPending, data } = useMutation({
    mutationFn: async (tf: Timeframe) => {
      const res = await apiRequest('POST', '/api/predict', { symbol: 'XAUUSD', timeframe: tf });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Analysis failed');
      }
      return res.json() as Promise<PredictionResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/predictions/usage'] });
    }
  });

  const handleAnalyze = () => {
    if (isLimitReached) return;
    mutate(timeframe);
  };

  const getRSIStatus = (rsi: number | undefined) => {
    if (!rsi) return { label: 'N/A', color: 'bg-muted' };
    if (rsi > 70) return { label: 'Overbought', color: 'bg-rose-500' };
    if (rsi < 30) return { label: 'Oversold', color: 'bg-emerald-500' };
    return { label: 'Neutral', color: 'bg-yellow-500' };
  };

  const getMACDStatus = (histogram: number | undefined) => {
    if (histogram === undefined) return { label: 'N/A', color: 'bg-muted' };
    if (histogram > 0) return { label: 'Bullish', color: 'bg-emerald-500' };
    return { label: 'Bearish', color: 'bg-rose-500' };
  };

  const rsiStatus = getRSIStatus(data?.analysis.rsi);
  const macdStatus = getMACDStatus(data?.analysis.macd?.histogram);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-1">Market Analysis</h2>
            <div className="text-muted-foreground flex items-center gap-2">
              <span>Deep Technical Analysis for XAUUSD</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {usage && (
              <Badge 
                variant={isLimitReached ? "destructive" : "secondary"}
                className="h-10 px-3 flex items-center gap-2"
                data-testid="badge-analysis-prediction-usage"
              >
                <Zap className="w-3 h-3" />
                {usage.limit === 'unlimited' ? (
                  <span>Unlimited</span>
                ) : isLimitReached ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Limit Reached ({usage.used}/{usage.limit})
                  </span>
                ) : (
                  <span>{usage.remaining} analyses left</span>
                )}
              </Badge>
            )}

            <Select 
              value={timeframe} 
              onValueChange={(val) => setTimeframe(val as Timeframe)}
              disabled={isPending || !!isLimitReached}
            >
              <SelectTrigger className="w-[120px] bg-card border-border text-foreground h-10 rounded-xl" data-testid="select-timeframe">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Minute</SelectItem>
                <SelectItem value="5m">5 Minutes</SelectItem>
                <SelectItem value="15m">15 Minutes</SelectItem>
                <SelectItem value="30m">30 Minutes</SelectItem>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="1d">1 Day</SelectItem>
              </SelectContent>
            </Select>

            {isLimitReached ? (
              <Button onClick={() => setLocation('/upgrade')} data-testid="button-upgrade-plan-analysis">
                Upgrade Plan
              </Button>
            ) : (
              <Button onClick={handleAnalyze} disabled={isPending} data-testid="button-analyze">
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                Run Analysis
              </Button>
            )}
          </div>
        </div>

        {/* Live Price Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Live XAUUSD Price</p>
                  <p className="text-3xl font-bold font-mono text-foreground">
                    ${livePrice?.price.toFixed(2) || '----.--'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${(livePrice?.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(livePrice?.change || 0) >= 0 ? '+' : ''}{livePrice?.change.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Bid: ${livePrice?.bid.toFixed(2) || '---'} | Ask: ${livePrice?.ask.toFixed(2) || '---'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* RSI Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                RSI (14)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold font-mono">
                    {data?.analysis.rsi?.toFixed(1) || '--'}
                  </span>
                  <Badge className={rsiStatus.color}>{rsiStatus.label}</Badge>
                </div>
                <Progress value={data?.analysis.rsi || 50} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Oversold (30)</span>
                  <span>Overbought (70)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MACD Card */}
          <Card className={`relative ${!hasIndicator('macd') ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                MACD
                {!hasIndicator('macd') && <Lock className="w-3 h-3 text-primary" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasIndicator('macd') ? (
                <div className="text-center py-4 space-y-2">
                  <Lock className="w-6 h-6 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">Available on Pro & Premium</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className={`text-3xl font-bold font-mono ${(data?.analysis.macd?.histogram || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {data?.analysis.macd?.histogram.toFixed(3) || '--'}
                    </span>
                    <Badge className={macdStatus.color}>{macdStatus.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground text-xs">Signal</span>
                      <p className="font-mono">{data?.analysis.macd?.signal.toFixed(3) || '--'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground text-xs">MACD Line</span>
                      <p className="font-mono">{data?.analysis.macd?.macd.toFixed(3) || '--'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMA Card */}
          <Card className={`relative ${!hasIndicator('sma') ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                SMA (20)
                {!hasIndicator('sma') && <Lock className="w-3 h-3 text-primary" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasIndicator('sma') ? (
                <div className="text-center py-4 space-y-2">
                  <Lock className="w-6 h-6 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">Available on Pro & Premium</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-3xl font-bold font-mono">
                    ${data?.analysis.sma?.toFixed(2) || '----.--'}
                  </span>
                  <div className={`flex items-center gap-2 text-sm ${
                    (data?.currentPrice || 0) > (data?.analysis.sma || 0) ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(data?.currentPrice || 0) > (data?.analysis.sma || 0) ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span>Price above SMA (Bullish)</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        <span>Price below SMA (Bearish)</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prediction Card */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                AI Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold font-mono">
                    ${data?.predictedPrice.toFixed(2) || '----.--'}
                  </span>
                  <Badge variant={data?.signal === 'BUY' ? 'default' : data?.signal === 'SELL' ? 'destructive' : 'secondary'}>
                    {data?.signal || 'HOLD'}
                  </Badge>
                </div>
                <div className={`text-sm ${data?.direction === 'UP' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data?.direction === 'UP' ? '+' : ''}{data?.changePercent.toFixed(3)}% expected
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Technical Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* EMA Card */}
          <Card data-testid="card-ema">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                EMA (20)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <span className="text-2xl font-bold font-mono block">
                  ${data?.analysis.ema?.toFixed(2) || '----.--'}
                </span>
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  (data?.currentPrice || 0) > (data?.analysis.ema || 0)
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {(data?.currentPrice || 0) > (data?.analysis.ema || 0) ? (
                    <><TrendingUp className="w-3 h-3" /><span>Bullish — Price above EMA</span></>
                  ) : (
                    <><TrendingDown className="w-3 h-3" /><span>Bearish — Price below EMA</span></>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Faster than SMA, more responsive to recent price changes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bollinger Bands Card */}
          <Card data-testid="card-bollinger">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Bollinger Bands
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Three band values stacked vertically with labels */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground w-12">Upper</span>
                    <span className="text-sm font-mono font-bold text-rose-400">
                      ${data?.analysis.bollingerBands?.upper.toFixed(2) || '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground w-12">Middle</span>
                    <span className="text-sm font-mono font-bold text-foreground">
                      ${data?.analysis.bollingerBands?.middle.toFixed(2) || '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground w-12">Lower</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      ${data?.analysis.bollingerBands?.lower.toFixed(2) || '--'}
                    </span>
                  </div>
                </div>
                {data?.analysis.bollingerBands && data?.currentPrice && (
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    data.currentPrice > data.analysis.bollingerBands.upper
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : data.currentPrice < data.analysis.bollingerBands.lower
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {data.currentPrice > data.analysis.bollingerBands.upper
                      ? 'Overbought — above upper band'
                      : data.currentPrice < data.analysis.bollingerBands.lower
                        ? 'Oversold — below lower band'
                        : 'Normal — price within bands'}
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  20-period SMA with 2 standard deviations
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stochastic Oscillator Card */}
          <Card data-testid="card-stochastic">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                Stochastic (14)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* %K and %D values side by side, badge on its own row */}
                <div className="flex items-end gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">%K</span>
                    <span className="text-2xl font-bold font-mono">
                      {data?.analysis.stochastic?.k.toFixed(1) || '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">%D</span>
                    <span className="text-2xl font-bold font-mono text-muted-foreground">
                      {data?.analysis.stochastic?.d.toFixed(1) || '--'}
                    </span>
                  </div>
                </div>
                <Badge className={`w-fit text-xs ${
                  (data?.analysis.stochastic?.k || 50) > 80
                    ? 'bg-rose-500 hover:bg-rose-500'
                    : (data?.analysis.stochastic?.k || 50) < 20
                      ? 'bg-emerald-500 hover:bg-emerald-500'
                      : 'bg-amber-500 hover:bg-amber-500'
                } text-white`}>
                  {(data?.analysis.stochastic?.k || 50) > 80 ? 'Overbought' :
                   (data?.analysis.stochastic?.k || 50) < 20 ? 'Oversold' : 'Neutral'}
                </Badge>
                <Progress value={data?.analysis.stochastic?.k || 50} className="h-1.5" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Oversold (&lt;20)</span>
                  <span>Overbought (&gt;80)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Market Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Daily High</p>
                  <p className="text-xl font-bold font-mono text-emerald-400">
                    ${livePrice?.high.toFixed(2) || '----.--'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Daily Low</p>
                  <p className="text-xl font-bold font-mono text-rose-400">
                    ${livePrice?.low.toFixed(2) || '----.--'}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Daily Range</p>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-rose-500 via-yellow-500 to-emerald-500"
                    style={{ width: '100%' }}
                  />
                  <div 
                    className="absolute w-3 h-3 bg-white rounded-full border-2 border-primary shadow-lg"
                    style={{ 
                      left: `${((livePrice?.price || 0) - (livePrice?.low || 0)) / ((livePrice?.high || 1) - (livePrice?.low || 1)) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Confidence Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prediction Confidence</span>
                  <span className="font-bold">{data?.confidence.toFixed(1) || 0}%</span>
                </div>
                <Progress value={data?.confidence || 0} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">RMSE</p>
                  <p className="text-lg font-bold font-mono">{data?.metrics.rmse.toFixed(4) || '--'}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">MAE</p>
                  <p className="text-lg font-bold font-mono">{data?.metrics.mae.toFixed(4) || '--'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

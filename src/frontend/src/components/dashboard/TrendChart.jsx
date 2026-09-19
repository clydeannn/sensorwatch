import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatClock } from "@/types/sensors";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  temperature: { label: "Temperature (°C)", color: "oklch(var(--chart-1))" },
  gas: { label: "Gas (ADC)", color: "oklch(var(--chart-2))" },
  humidity: { label: "Humidity (%)", color: "oklch(var(--chart-3))" },
};

/**
 * Live trend chart plotting temperature, gas, and humidity across the recent
 * monitoring window. Re-renders as new readings arrive.
 */
export function TrendChart({ history }) {
  const points = useMemo(
    () =>
      [...history].reverse().map((reading) => ({
        key: reading.timestamp.toString(),
        clock: formatClock(reading.timestamp),
        temperature: Number(reading.temperature.toFixed(1)),
        gas: reading.gas,
        humidity: Number(reading.humidity.toFixed(1)),
      })),
    [history],
  );

  if (points.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-muted/20"
        data-ocid="dashboard.trend_chart.empty_state"
      >
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Waiting for readings…
        </p>
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="block h-64 w-full min-w-0 aspect-auto justify-start md:h-72"
      data-ocid="dashboard.trend_chart"
    >
      <LineChart
        data={points}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="clock"
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          tickMargin={8}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          width={44}
          tickMargin={6}
          label={{
            value: "°C / %",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 10, fill: "var(--muted-foreground)" },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={48}
          tickMargin={6}
          label={{
            value: "ADC",
            angle: 90,
            position: "insideRight",
            style: { fontSize: 10, fill: "var(--muted-foreground)" },
          }}
        />
        <ChartTooltip
          content={<ChartTooltipContent indicator="line" />}
          cursor={{ stroke: "var(--border)" }}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          yAxisId="left"
          dataKey="temperature"
          type="monotone"
          stroke="var(--color-temperature)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          yAxisId="right"
          dataKey="gas"
          type="monotone"
          stroke="var(--color-gas)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          yAxisId="left"
          dataKey="humidity"
          type="monotone"
          stroke="var(--color-humidity)"
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

/**
 * @title Area Chart
 * @category data
 * @description Line chart with a gradient fill that is revealed by a clip following each line as it draws.
 * @duration 60
 * @preset line-chart
 * @use Volume over time: traffic, storage used, cumulative revenue
 * @use One or two series where the filled shape carries the story
 * @avoid Three or more overlapping series — use `line-chart`
 * @tags chart, area, trend, time series, data
 * @example
 * <Center>
 *   <AreaChart
 *     labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
 *     series={[{ label: "Visitors", points: [3200, 4100, 3900, 5200, 6100, 4800, 7400] }]}
 *   />
 * </Center>
 */
import { LineChart, type LineChartProps } from "./line-chart";

export type AreaChartProps = Omit<LineChartProps, "area">;

export function AreaChart(props: AreaChartProps) {
  return <LineChart {...props} area />;
}

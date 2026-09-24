import { AreaChart } from "../items/area-chart";
import { BarChart } from "../items/bar-chart";
import { BarRace } from "../items/bar-race";
import { Center } from "../items/core";
import { Donut } from "../items/donut";
import { KpiGrid } from "../items/kpi-grid";
import { LineChart } from "../items/line-chart";
import { ProgressRing } from "../items/progress-ring";
import { StatCounter } from "../items/stat-counter";
import { Timeline } from "../items/timeline";
import { Versus } from "../items/versus";
import { customizable } from "./customizable";
import type { Demo } from "./index";

export default [
  {
    id: "bar-chart-revenue",
    duration: 90,
    ...customizable(
      "BarChart",
      BarChart,
      {
        data: [
          { label: "Q1", value: 182 },
          { label: "Q2", value: 214 },
          { label: "Q3", value: 260 },
          { label: "Q4", value: 331 },
        ],
        highlight: 3,
        format: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "line-chart-signups",
    duration: 100,
    ...customizable(
      "LineChart",
      LineChart,
      {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [
          { label: "Organic", points: [140, 190, 175, 240, 305, 410] },
          { label: "Paid", points: [80, 95, 130, 128, 165, 205] },
        ],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "area-chart-storage",
    duration: 90,
    ...customizable(
      "AreaChart",
      AreaChart,
      {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        series: [{ label: "Storage (GB)", points: [420, 460, 455, 510, 590, 640, 705] }],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "donut-traffic",
    duration: 110,
    ...customizable(
      "Donut",
      Donut,
      {
        label: "Sessions",
        data: [
          { label: "Search", value: 5100 },
          { label: "Direct", value: 3200 },
          { label: "Social", value: 1800 },
          { label: "Referral", value: 900 },
        ],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "progress-ring-onboarding",
    duration: 75,
    ...customizable("ProgressRing", ProgressRing, { value: 78, label: "Teams onboarded" }, (element) => (
      <Center>{element}</Center>
    )),
  },
  {
    id: "bar-race-cities",
    duration: 130,
    ...customizable(
      "BarRace",
      BarRace,
      {
        steps: ["2021", "2022", "2023", "2024"],
        series: [
          { label: "Northgate", values: [14, 28, 39, 58] },
          { label: "Solace", values: [22, 31, 36, 41] },
          { label: "Ember", values: [7, 19, 47, 66] },
          { label: "Vantage", values: [30, 33, 35, 38] },
        ],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "stat-counter-mrr",
    duration: 90,
    ...customizable(
      "StatCounter",
      StatCounter,
      {
        label: "Monthly recurring revenue",
        to: 482000,
        format: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
        delta: 12.4,
        caption: "vs. last month",
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "kpi-grid-overview",
    duration: 100,
    ...customizable(
      "KpiGrid",
      KpiGrid,
      {
        motion: { preset: "smooth", step: 3 },
        items: [
          {
            label: "MRR",
            to: 482000,
            format: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
            delta: 12.4,
          },
          { label: "Active teams", to: 312, delta: 6.1 },
          { label: "Churn", to: 2.1, suffix: "%", delta: -0.4 },
          { label: "NPS", to: 61, delta: 4 },
        ],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "versus-plans",
    duration: 110,
    ...customizable(
      "Versus",
      Versus,
      {
        left: "Starter",
        right: "Pro",
        rows: [
          { label: "Price / mo", left: 19, right: 49 },
          { label: "Seats included", left: 5, right: 25 },
          { label: "Priority support", left: false, right: true },
          { label: "Single sign-on", left: false, right: true },
          { label: "Response time", left: "48h", right: "2h" },
        ],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
  {
    id: "timeline-roadmap",
    duration: 110,
    ...customizable(
      "Timeline",
      Timeline,
      {
        milestones: [
          { label: "Founded", date: "2019", body: "Two co-founders, one laptop" },
          { label: "Seed round", date: "2021", body: "$3.2M raised" },
          { label: "Series A", date: "2023", body: "40 people, 12 countries" },
          { label: "1M events/day", date: "2025" },
        ],
      },
      (element) => <Center>{element}</Center>,
    ),
  },
] satisfies Demo[];

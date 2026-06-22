"use client";

import { use } from "react";

import { Card } from "@/components/ui/card";

import { useNodeDetails } from "@/hooks/useNodeDetails";

import { NodeTimeline } from "@/components/nodes/node-timeline";
import { RulesCard } from "@/components/nodes/rules-card";
import { RiskTrend } from "@/components/nodes/risk-trend";
import { ReasonsCard } from "@/components/nodes/reasons-card";

export default function NodeDetailsPage({
  params,
}: {
  params: Promise<{
    node: string;
  }>;
}) {
  const { node } = use(params);

  const { data, isLoading, error } = useNodeDetails(node);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <Card className="border-zinc-800 bg-zinc-900 p-6 text-white">
          Loading node details...
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <Card className="border-zinc-800 bg-zinc-900 p-6 text-red-400">
          Failed to load node details.
        </Card>
      </div>
    );
  }

  const latest = data?.[0];

  const rules = Array.from(
    new Set(data?.flatMap((event: any) => event.matched_rules ?? []) ?? []),
  ) as string[];

  const reasons = Array.from(
    new Set(data?.flatMap((event: any) => event.reasons ?? []) ?? []),
  ) as string[];

  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">{node}</h1>

          <p className="mt-2 text-zinc-400">Security Investigation View</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Risk Score</div>

            <div className="mt-2 text-4xl font-bold text-red-400">
              {latest?.risk_score ?? 0}
            </div>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Weighted Score</div>

            <div className="mt-2 text-4xl font-bold text-orange-400">
              {latest?.weighted_score ?? 0}
            </div>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-500">Bucket</div>

            <div className="mt-2 text-3xl font-bold text-cyan-400">
              {latest?.bucket ?? "N/A"}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 xl:grid-cols-2">
          <RiskTrend data={data ?? []} />

          <RulesCard rules={rules} />
        </div>

        {/* Timeline + Reasons */}
        <div className="grid gap-6 xl:grid-cols-2">
          <NodeTimeline events={data ?? []} />

          <ReasonsCard reasons={reasons} />
        </div>
      </div>
    </div>
  );
}

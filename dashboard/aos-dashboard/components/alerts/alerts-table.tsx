"use client";

import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAlerts } from "@/hooks/useAlerts";

import { AlertDialog } from "./alert-dialog";

import { SeverityBadge } from "@/components/dashboard/severity-badge";

export function AlertsTable() {
  const [severity, setSeverity] = useState<string | undefined>();

  const [nodeId, setNodeId] = useState("");

  const [threatType, setThreatType] = useState("");

  const { data, isLoading } = useAlerts({
    severity,
    node_id: nodeId || undefined,
    threat_type: threatType || undefined,
  });

  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 p-6 text-white">
        Loading alerts...
      </Card>
    );
  }

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6 flex flex-wrap gap-4">
          <Input
            placeholder="Search Node..."
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            className="w-64 border-zinc-700 bg-zinc-950"
          />

          <Input
            placeholder="Threat Type..."
            value={threatType}
            onChange={(e) => setThreatType(e.target.value)}
            className="w-64 border-zinc-700 bg-zinc-950"
          />

          <Select
            value={severity}
            onValueChange={(value) =>
              setSeverity(value === "ALL" ? undefined : value)
            }
          >
            <SelectTrigger className="w-48 border-zinc-700 bg-zinc-950">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>

              <SelectItem value="CRITICAL">Critical</SelectItem>

              <SelectItem value="HIGH">High</SelectItem>

              <SelectItem value="MEDIUM">Medium</SelectItem>

              <SelectItem value="LOW">Low</SelectItem>

              <SelectItem value="INFO">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Threat Type</TableHead>
              <TableHead>Node</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data?.map((alert: any) => (
              <TableRow
                key={alert.alert_id}
                className="
                  cursor-pointer
                  transition-colors
                  hover:bg-zinc-800/50
                "
                onClick={() => {
                  setSelectedAlert(alert);
                  setOpen(true);
                }}
              >
                <TableCell>
                  <SeverityBadge severity={alert.severity} />
                </TableCell>

                <TableCell>{alert.threat_type}</TableCell>

                <TableCell className="text-cyan-400">{alert.node_id}</TableCell>

                <TableCell className="max-w-[400px] truncate">
                  {alert.description}
                </TableCell>

                <TableCell>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={open} onOpenChange={setOpen} alert={selectedAlert} />
    </>
  );
}

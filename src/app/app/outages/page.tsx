"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useGlobal } from "@/lib/context/GlobalContext";
import { createSpaBeaconClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import Confetti from "@/components/Confetti";
import { Database } from "@/lib/types";
import { CreateOutageReportRequest } from "@buf/beacon-uc_api-schemas.bufbuild_es/beacon/v1/public_pb";
import {GeoPoint} from "@buf/beacon-uc_api-schemas.bufbuild_es/beacon/v1/common/types_pb";

type Outage = Database["public"]["Tables"]["outages"]["Row"];

interface LoadError {
  message: string;
  code?: string;
  details?: unknown;
}

type FilterTypes = "all" | "verified" | "resolved" | "unverified";

async function fetchOutages(): Promise<Outage[]> {
  const beaconClient = await createSpaBeaconClient();
  const { data } = await beaconClient.getOutagesList();
  return data ?? [];
}

async function createOutage(req: CreateOutageReportRequest) {
  const beaconClient = await createSpaBeaconClient();
  return await beaconClient.createOutageReport(req);
}

function useOutagesViewModel(userId?: string) {
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);
  const [filter, setFilter] = useState<FilterTypes>("all");

  const loadOutages = async () => {
    try {
      if (!initialLoading) setLoading(true);
      const cached = localStorage.getItem("cachedOutages");
      if (cached) {
        try {
          setOutages(JSON.parse(cached));
        } catch (e) {
          console.error("Failed to parse cached outages:", e);
        }
      }
      const data = await fetchOutages();
      setOutages(data);
      localStorage.setItem("cachedOutages", JSON.stringify(data));
    } catch (err: unknown) {
      const error = err as { code?: string };
      setError({
        message: "Failed to load outages",
        code: error.code ?? "UNKNOWN_ERROR",
        details: err,
      });
      console.error("Error loading outages:", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const createOutageReport = async (req: CreateOutageReportRequest) => {
    await createOutage(req);
    await loadOutages();
  };

  const loadOutagesCallback = useCallback(loadOutages, [initialLoading]);

  useEffect(() => {
    if (userId) loadOutagesCallback().then(_ => _);
  }, [userId, filter, loadOutagesCallback]);

  const filteredOutages =
    filter === "all" ? outages : outages.filter((o) => o.status === filter);

  return {
    outages: filteredOutages,
    loading,
    initialLoading,
    error,
    filter,
    setFilter,
    createOutageReport,
  };
}

const optionsDate: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
const optionsTime: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "numeric", hour12: true };

const statusStyles: Record<string, { card: string; button: string }> = {
  verified: { card: "bg-red-50 border-red-200", button: "bg-red-600 text-white hover:bg-red-700" },
  resolved: { card: "bg-green-50 border-green-200", button: "bg-green-600 text-white hover:bg-green-700" },
  unverified: { card: "bg-yellow-50 border-yellow-200", button: "bg-yellow-500 text-white hover:bg-yellow-600" },
  all: { card: "", button: "bg-primary-600 text-white hover:bg-primary-700" },
};

const filterOptions: { value: FilterTypes; label: string }[] = [
  { value: "all", label: "All Outages" },
  { value: "verified", label: "Verified" },
  { value: "resolved", label: "Resolved" },
  { value: "unverified", label: "Unverified" },
];

// Create Outage Dialog
function CreateOutageDialog({
  onSubmit,
}: {
  onSubmit: (req: CreateOutageReportRequest) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [location, setLocation] = useState<GeoPoint | undefined>(undefined);

  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          } as GeoPoint);
        },
        (err) => {
          console.error("Error getting location:", err);
        }
      );
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const req: CreateOutageReportRequest = { description, location } as CreateOutageReportRequest;
      await onSubmit(req);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setOpen(false);
      setDescription("");
    } catch (err) {
      setError("Failed to create outage");
      console.error("Error creating outage:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary-600 text-white hover:bg-primary-700">
            <Plus className="h-4 w-4 mr-2" />
            Report an Outage
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Outage</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outage description"
              rows={3}
            />

            <div className="text-sm text-muted-foreground border rounded-md p-2 bg-gray-50">
              {location
                ? (
                  <>
                    <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
                  </>
                )
                : <p>Retrieving location...</p>}
            </div>

            <Button
              type="submit"
              disabled={loading || !description.trim() || !location}
              className="bg-primary-600 text-white hover:bg-primary-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Confetti active={showConfetti} />
    </>
  );
}

// Main Page (View)
export default function OutagePage() {
  const { user } = useGlobal();
  const { outages, loading, initialLoading, error, filter, setFilter, createOutageReport } =
    useOutagesViewModel(user?.id);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>Outages</CardTitle>
            <CardDescription>A list of electrical outages in Baguio City</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="mb-6 flex flex-wrap gap-2">
            {filterOptions.map(({ value, label }) => (
              <Button
                key={value}
                variant={filter === value ? "default" : "secondary"}
                onClick={() => setFilter(value)}
                size="sm"
                className={filter === value ? statusStyles[value]?.button : ""}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="space-y-3 relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            )}

            {outages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No outages found for this filter</p>
              </div>
            ) : (
              outages.map((outage) => (
                <div
                  key={outage.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    statusStyles[outage.status as keyof typeof statusStyles]?.card ||
                    "bg-card border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{outage.title}</h3>
                      {outage.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{outage.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Created:{" "}
                          {outage.created_at
                            ? new Date(outage.created_at).toLocaleString(undefined, {
                                ...optionsDate,
                                ...optionsTime,
                              })
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
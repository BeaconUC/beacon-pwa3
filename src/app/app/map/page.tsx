"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useGlobal } from "@/lib/context/GlobalContext";
import { createSpaBeaconClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Menu, Zap, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { Database } from "@/lib/types";
import dynamic from "next/dynamic";

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type Outage = Database["public"]["Tables"]["outages"]["Row"];

export interface LoadError {
  message: string;
  code?: string;
  details?: unknown;
}

async function fetchOutages(): Promise<Outage[]> {
  const beaconClient = await createSpaBeaconClient();
  const { data } = await beaconClient.getOutagesList();
  return data ?? [];
}

function useOutagesViewModel(userId?: string) {
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);

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

  const loadOutagesCallback = useCallback(loadOutages, [initialLoading]);

  useEffect(() => {
    if (userId) loadOutagesCallback().then(_ => _);
  }, [userId, loadOutagesCallback]);

  return {
    outages,
    loading,
    initialLoading,
    error,
    loadOutages,
  };
}

const outagePriorityStyles: Record<string, { color: string; text: string }> = {
  verified: { color: "#dc2626", text: "Verified Outage" },
  unverified: { color: "#ca8a04", text: "Unverified Outage" },
  resolved: { color: "#16a34a", text: "Resolved Outage" },
};

const crewStatusStyles: Record<string, { color: string; text: string }> = {
  available: { color: "#16a34a", text: "Available Crew" },
  dispatched: { color: "#2563eb", text: "Dispatched Crew" },
  busy: { color: "#9333ea", text: "Busy Crew" },
};

// Default center for Baguio City
const BAGUIO_CENTER = { lat: 16.4023, lng: 120.5960 };

// Map component
function OutageMap({ outages }: { outages: Outage[] }) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Custom icon components for different statuses
  const getIconComponent = (status: string) => {
    const iconProps = { className: "h-5 w-5" };
    
    switch (status) {
      case "verified":
        return <Zap {...iconProps} className="text-red-600" />;
      case "unverified":
        return <AlertTriangle {...iconProps} className="text-yellow-600" />;
      case "resolved":
        return <CheckCircle {...iconProps} className="text-green-600" />;
      default:
        return <Zap {...iconProps} className="text-gray-600" />;
    }
  };

  return (
    <div className="h-full w-full">
      <MapContainer
        center={BAGUIO_CENTER}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {outages.map((outage) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!(outage as any).location) return null;
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const location = (outage as any).location as { latitude: number; longitude: number };
          const status = outage.status || "unverified";
          const statusStyle = outagePriorityStyles[status] || outagePriorityStyles.unverified;
          
          return (
            <Marker
              key={outage.id}
              position={[location.latitude, location.longitude]}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-3">
                    {getIconComponent(status)}
                    <h3 className="font-semibold text-lg">Outage</h3>
                  </div>
                  {outage.description && (
                    <p className="text-sm text-gray-600 mb-2">{outage.description}</p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {getIconComponent(status)}
                    <span className="text-sm font-medium">{statusStyle.text}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Created: {outage.created_at ? new Date(outage.created_at).toLocaleString() : "Unknown"}</p>
                    {outage.updated_at && (
                      <p>Updated: {new Date(outage.updated_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// Main Page (View)
export default function MapPage() {
  const { user } = useGlobal();
  const { outages, loading, initialLoading, error, loadOutages } =
    useOutagesViewModel(user?.id);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col relative z-0">
      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Floating Stats Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Live Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Outages:</span>
              <span className="font-semibold">{outages.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Verified:</span>
              <span className="font-semibold text-red-600">
                {outages.filter(o => o.status === "verified").length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Floating Legend Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Map Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(outagePriorityStyles).map(([key, style]) => {
              const getLegendIcon = (status: string) => {
                const iconProps = { className: "h-4 w-4" };
                
                switch (status) {
                  case "verified":
                    return <Zap {...iconProps} className="text-red-600" />;
                  case "unverified":
                    return <AlertTriangle {...iconProps} className="text-yellow-600" />;
                  case "resolved":
                    return <CheckCircle {...iconProps} className="text-green-600" />;
                  default:
                    return <Zap {...iconProps} className="text-gray-600" />;
                }
              };
              
              return (
                <div key={key} className="flex items-center gap-2">
                  {getLegendIcon(key)}
                  <span className="text-sm">{style.text}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="absolute top-4 left-4 z-20 max-w-md">
          <Alert variant="destructive" className="bg-white/90 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Full Screen Map */}
      <div className="flex-1">
        <OutageMap outages={outages} />
      </div>

    </div>
  );
}
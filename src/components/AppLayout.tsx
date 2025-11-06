"use client";
import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {ChevronDown, Files, Home, Key, LogOut, Menu, X, ZapOff, MapPinnedIcon, Plus, AlertCircle, Loader2} from 'lucide-react';
import {useGlobal} from "@/lib/context/GlobalContext";
import {createSpaBeaconClient} from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateOutageReportRequest } from "@buf/beacon-uc_api-schemas.bufbuild_es/beacon/v1/public_pb";
import {GeoPoint} from "@buf/beacon-uc_api-schemas.bufbuild_es/beacon/v1/common/types_pb";

export default function AppLayout({children}: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [outageDialogOpen, setOutageDialogOpen] = useState(false);
  const [outageLoading, setOutageLoading] = useState(false);
  const [outageError, setOutageError] = useState("");
  const [outageDescription, setOutageDescription] = useState("");
  const [outageLocation, setOutageLocation] = useState<GeoPoint | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  const {user} = useGlobal();

  const handleLogout = async () => {
    try {
      const client = await createSpaBeaconClient();
      await client.logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  const handleChangePassword = async () => {
    router.push('/app/user-settings')
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split(/[._-]/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;

  const navigation = [
    {name: 'Homepage', href: '/app', icon: Home},
    {name: 'Storage', href: '/app/storage', icon: Files},
    {name: 'Outages', href: '/app/outages', icon: ZapOff},
    {name: 'Map', href: '/app/map', icon: MapPinnedIcon},
    // {name: 'Example Table', href: '/app/table', icon: LucideListTodo},
    // {name: 'User Settings', href: '/app/user-settings', icon: User},
  ];

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (outageDialogOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOutageLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          } as GeoPoint);
        },
        (err) => {
          console.error("Error getting location:", err);
        }
      );
    }
  }, [outageDialogOpen]);

  const handleCreateOutage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setOutageLoading(true);
      const beaconClient = await createSpaBeaconClient();
      const req: CreateOutageReportRequest = { description: outageDescription, location: outageLocation } as CreateOutageReportRequest;
      await beaconClient.createOutageReport(req);
      setOutageDialogOpen(false);
      setOutageDescription("");
      setOutageLocation(undefined);
      // Refresh the page to show the new outage
      window.location.reload();
    } catch (err) {
      setOutageError("Failed to create outage");
      console.error("Error creating outage:", err);
    } finally {
      setOutageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-30 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className="text-xl font-semibold text-primary-600">{productName}</span>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6"/>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

      </div>

      <div className="lg:pl-64">
        {/* Conditionally show minimal top bar on mobile for map page, full top bar for other pages */}
        {pathname.includes('/app/map') ? (
          // Minimal mobile-only top bar for map page
          <div className="lg:hidden sticky top-0 z-10 flex items-center h-12 bg-white/90 backdrop-blur-sm shadow-sm px-4">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-5 w-5"/>
            </button>
          </div>
        ) : (
          // Full top bar for other pages
          <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white shadow-sm px-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6"/>
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <Dialog open={outageDialogOpen} onOpenChange={setOutageDialogOpen}>
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
                  {outageError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{outageError}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={handleCreateOutage} className="space-y-4">
                    <Textarea
                      value={outageDescription}
                      onChange={(e) => setOutageDescription(e.target.value)}
                      placeholder="Outage description"
                      rows={3}
                    />

                    <div className="text-sm text-muted-foreground border rounded-md p-2 bg-gray-50">
                      {outageLocation
                        ? (
                          <>
                            <p><strong>Latitude:</strong> {outageLocation.latitude.toFixed(6)}</p>
                            <p><strong>Longitude:</strong> {outageLocation.longitude.toFixed(6)}</p>
                          </>
                        )
                        : <p>Retrieving location...</p>}
                    </div>

                    <Button
                      type="submit"
                      disabled={outageLoading || !outageDescription.trim() || !outageLocation}
                      className="bg-primary-600 text-white hover:bg-primary-700"
                    >
                      {outageLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-medium">
                        {user ? getInitials(user.email) || "U" : "U"}
                    </span>
                  </div>
                  {/*<span>{user?.email || 'Loading...'}</span>*/}
                  <span>{user?.email || "User"}</span>
                  <ChevronDown className="h-4 w-4"/>
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border">
                    <div className="p-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email || "User"}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleChangePassword()
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Key className="mr-3 h-4 w-4 text-gray-400"/>
                        Change Password
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-red-400"/>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <main className={pathname.includes('/app/map') ? '' : 'p-4'}>
          {children}
        </main>
      </div>
    </div>
  );
}
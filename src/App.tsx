import React, { useState, useMemo } from "react";
import {
  Bus,
  ShieldCheck,
  Cpu,
  Activity,
  AlertTriangle,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  Lock,
  Key,
  Navigation,
  Send,
  Radio,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// --- DATA DEFINITIONS ---
const MH_BLOCKS = [
  "A",
  "B",
  "B-ANX",
  "C",
  "D",
  "D-ANX",
  "E",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "T",
].map((block) => `MH-${block}`);

const LH_BLOCKS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "E-ANX",
  "G",
  "H",
  "J",
  "S",
].map((block) => `LH-${block}`);

const LOCATIONS = [
  "PRP",
  "SJT (Silver Jubilee Tower)",
  "TT (Technology Tower)",
  ...MH_BLOCKS,
  ...LH_BLOCKS,
  "Main Gate",
  "Central Library",
  "GDN",
  "SMV",
  "MGR",
  "Health Centre",
  "FOODYS",
];

const INITIAL_SHUTTLES = [
  {
    id: "SH-101",
    route: "PRP → SJT → Main Gate",
    currentLocation: "PRP (Periyar EVR)",
    occupancy: 92,
    capacity: 40,
    driver: "Raman K.",
    status: "High Load",
    eta: 3,
    wait: 14,
  },
  {
    id: "SH-102",
    route: "MH-A → TT → AB1",
    currentLocation: "MH-A",
    occupancy: 65,
    capacity: 40,
    driver: "Suresh M.",
    status: "Normal",
    eta: 5,
    wait: 6,
  },
  {
    id: "SH-103",
    route: "LH-J → Food Court → SJT",
    currentLocation: "LH-J",
    occupancy: 42,
    capacity: 40,
    driver: "Anand P.",
    status: "Normal",
    eta: 8,
    wait: 3,
  },
  {
    id: "SH-104",
    route: "Main Gate → MB → Sports Complex",
    currentLocation: "Main Gate",
    occupancy: 88,
    capacity: 40,
    driver: "Dinesh V.",
    status: "High Load",
    eta: 4,
    wait: 11,
  },
  {
    id: "SH-105",
    route: "MH-Q → SJT Express",
    currentLocation: "MH-Q",
    occupancy: 30,
    capacity: 40,
    driver: "Karthik R.",
    status: "Optimal",
    eta: 12,
    wait: 2,
  },
];

const INITIAL_REQUEST_LOGS = [
  { from: "MH-M", to: "SJT (Silver Jubilee Tower)", count: 18 },
  { from: "PRP (Periyar EVR)", to: "SJT (Silver Jubilee Tower)", count: 34 },
  { from: "LH-J", to: "TT (Technology Tower)", count: 12 },
  { from: "Main Gate", to: "Food Court (FC)", count: 9 },
];

const HOURLY_DEMAND = [
  { time: "08:00", passengers: 120, occupancy: 45 },
  { time: "09:00", passengers: 340, occupancy: 85 },
  { time: "10:00", passengers: 420, occupancy: 92 },
  { time: "11:00", passengers: 210, occupancy: 60 },
  { time: "12:00", passengers: 380, occupancy: 88 },
  { time: "13:00", passengers: 450, occupancy: 95 },
  { time: "14:00", passengers: 290, occupancy: 70 },
  { time: "15:00", passengers: 310, occupancy: 75 },
  { time: "16:00", passengers: 480, occupancy: 98 },
  { time: "17:00", passengers: 84, occupancy: 84 },
];

const generateCSRFToken = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);
const sanitizeInput = (str) =>
  str.replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [demoPreset, setDemoPreset] = useState("overcrowded");
  const [shuttles, setShuttles] = useState(INITIAL_SHUTTLES);
  const [routeRequests, setRouteRequests] = useState(INITIAL_REQUEST_LOGS);
  const [deployed, setDeployed] = useState(false);
  const [requestCount, setRequestCount] = useState(73);
  const [securityToken] = useState(generateCSRFToken());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [authError, setAuthError] = useState("");

  // Student Form State
  const [fromLoc, setFromLoc] = useState("MH-M");
  const [toLoc, setToLoc] = useState("SJT (Silver Jubilee Tower)");
  const [journeyTime, setJourneyTime] = useState("10:15");
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Driver Console State
  const [selectedDriverShuttle, setSelectedDriverShuttle] = useState("SH-101");
  const [driverNewLocation, setDriverNewLocation] = useState(
    "SJT (Silver Jubilee Tower)"
  );
  const [driverSuccessMsg, setDriverSuccessMsg] = useState("");

  // Handle Preset Changes
  const applyPreset = (preset) => {
    setDemoPreset(preset);
    setDeployed(false);
    if (preset === "normal") {
      setShuttles(
        INITIAL_SHUTTLES.map((s) => ({
          ...s,
          occupancy: Math.min(s.occupancy, 55),
          status: "Normal",
        }))
      );
    } else if (preset === "peak") {
      setShuttles(
        INITIAL_SHUTTLES.map((s) => ({
          ...s,
          occupancy: Math.min(s.occupancy + 15, 82),
          status: "Moderate",
        }))
      );
    } else {
      setShuttles(INITIAL_SHUTTLES);
    }
  };

  // Deploy Action
  const handleDeployShuttle = () => {
    setDeployed(true);
    setShuttles((prev) =>
      prev.map((s) =>
        s.id === "SH-101"
          ? { ...s, occupancy: 64, wait: 6, status: "Balanced" }
          : s
      )
    );
  };

  // Student Search & Request Submit
  const handleStudentRequest = (e) => {
    e.preventDefault();
    const safeFrom = sanitizeInput(fromLoc);
    const safeTo = sanitizeInput(toLoc);

    if (safeFrom === safeTo) {
      alert("Source and Destination cannot be the same location.");
      return;
    }

    // Increment overall count
    setRequestCount((prev) => prev + 1);

    // Update aggregated origin-destination route demand counter
    setRouteRequests((prevRequests) => {
      const existingIndex = prevRequests.findIndex(
        (r) => r.from === safeFrom && r.to === safeTo
      );
      if (existingIndex > -1) {
        const updated = [...prevRequests];
        updated[existingIndex].count += 1;
        return updated;
      } else {
        return [...prevRequests, { from: safeFrom, to: safeTo, count: 1 }];
      }
    });

    setRequestSuccess(true);
    setTimeout(() => setRequestSuccess(false), 4000);
  };

  // Driver Update Location
  const handleDriverLocationUpdate = (e) => {
    e.preventDefault();
    setShuttles((prev) =>
      prev.map((s) =>
        s.id === selectedDriverShuttle
          ? { ...s, currentLocation: driverNewLocation }
          : s
      )
    );
    setDriverSuccessMsg(
      `Updated ${selectedDriverShuttle} location to ${driverNewLocation}`
    );
    setTimeout(() => setDriverSuccessMsg(""), 4000);
  };

  // Admin Verification
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPin === "2026" || adminPin === "1234") {
      setIsAdminAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError('Invalid Security Access PIN. Try "2026".');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab("home")}
          >
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  VIT Shuttle SmartSwap
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.5 LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                “AI predicts. Drivers update. Humans decide.”
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/60">
            {[
              { id: "home", label: "Home" },
              { id: "find", label: "Find Shuttle" },
              { id: "driver", label: "Driver Console" },
              { id: "prediction", label: "AI Prediction" },
              { id: "admin", label: "Admin Panel" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Scenario Switcher */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
              {[
                { key: "normal", label: "Normal" },
                { key: "peak", label: "Peak" },
                { key: "overcrowded", label: "Overcrowded" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    demoPreset === p.key
                      ? "bg-slate-800 text-indigo-400 font-semibold border border-indigo-500/30"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* TAB 1: HOME PAGE */}
        {activeTab === "home" && (
          <div className="space-y-12 animate-fadeIn">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 md:p-12 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl relative z-10 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Integrated Student Demand & Driver Tracking</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Predict Shuttle Demand. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-sky-400">
                    Live Tracking & Smart Dispatch.
                  </span>
                </h1>
                <p className="text-slate-300 text-base leading-relaxed">
                  Students log trip requests from specific dorms to academic
                  blocks. Drivers broadcast real-time location updates. The
                  system dynamically maps live demand corridors.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => setActiveTab("find")}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
                  >
                    <span>Request Shuttle Ride</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("driver")}
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700 flex items-center space-x-2"
                  >
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span>Driver Console</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIND MY SHUTTLE & REQUEST TRACKER */}
        {activeTab === "find" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Request Selection Form */}
              <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                    <span>Request a Shuttle Ride</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select origin and destination to log your demand into the
                    fleet manager.
                  </p>
                </div>

                <form onSubmit={handleStudentRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      From Location (Pickup)
                    </label>
                    <select
                      value={fromLoc}
                      onChange={(e) => setFromLoc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={`from-${loc}`} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      To Destination
                    </label>
                    <select
                      value={toLoc}
                      onChange={(e) => setToLoc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={`to-${loc}`} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Departure Time
                    </label>
                    <input
                      type="time"
                      value={journeyTime}
                      onChange={(e) => setJourneyTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2"
                  >
                    <span>Log Shuttle Request</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>

                {requestSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Ride request logged! Demand counter updated below.
                    </span>
                  </div>
                )}
              </div>

              {/* Shuttle Status & Active Locations */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Active Fleet Status & Driver Live Locations</span>
                </h3>
                <div className="space-y-3">
                  {shuttles.map((shuttle) => (
                    <div
                      key={shuttle.id}
                      className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-indigo-400 font-bold">
                            {shuttle.id}
                          </span>
                          <span className="text-xs text-slate-400">
                            • Driver: {shuttle.driver}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              shuttle.occupancy > 80
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {shuttle.occupancy}% Occupancy
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Route: {shuttle.route}
                        </h4>

                        {/* Live Location Marker */}
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Current Live Location:{" "}
                            <strong>{shuttle.currentLocation}</strong>
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>ETA: {shuttle.eta} mins</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>Est. Wait: {shuttle.wait} mins</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DEMAND METRICS DISPLAY: How many requested ride from WHERE to WHERE */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>Real-Time Requested Passenger Demands</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live tally showing exact student ride requests grouped by
                    route corridor.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  Total Active Requests: {requestCount}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {routeRequests.map((req, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Route Corridor
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-xs font-mono font-bold rounded">
                        {req.count} Ride Requests
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white space-y-1">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <span className="text-slate-500">From:</span>
                        <span className="text-indigo-300">{req.from}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-300">
                        <span className="text-slate-500">To:</span>
                        <span className="text-emerald-300">{req.to}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DRIVER CONSOLE (NEW FEATURE) */}
        {activeTab === "driver" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Driver Location Broadcast Console
                  </h2>
                  <p className="text-xs text-slate-400">
                    Update shuttle live position to keep students and dispatch
                    aware.
                  </p>
                </div>
              </div>

              <form onSubmit={handleDriverLocationUpdate} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Your Shuttle ID
                  </label>
                  <select
                    value={selectedDriverShuttle}
                    onChange={(e) => setSelectedDriverShuttle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {shuttles.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — Driver: {s.driver} ({s.route})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    New Current Stop / Location
                  </label>
                  <select
                    value={driverNewLocation}
                    onChange={(e) => setDriverNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={`driver-${loc}`} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Broadcast Live Location Update</span>
                </button>
              </form>

              {driverSuccessMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{driverSuccessMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AI DEMAND PREDICTION */}
        {activeTab === "prediction" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  title: "Current System Load",
                  val: "88%",
                  sub: "High Corridor Activity",
                },
                {
                  title: "Peak Forecast Time",
                  val: "13:00 - 14:00",
                  sub: "Lunch/Shift Transition",
                },
                {
                  title: "Highest Demand Corridor",
                  val: "PRP → SJT",
                  sub: "34 Requests Recorded",
                },
                {
                  title: "Total Logged Demands",
                  val: requestCount,
                  sub: "Active Session Requests",
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1"
                >
                  <span className="text-xs text-slate-400 font-medium">
                    {stat.title}
                  </span>
                  <div className="text-xl font-bold text-white">{stat.val}</div>
                  <p className="text-[11px] text-indigo-400">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Demand Chart */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Campus Passenger Demand Curve
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simulated passenger volume trends over operating hours
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-slate-400">
                  TOKEN: {securityToken.substring(0, 8)}
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={HOURLY_DEMAND}>
                    <defs>
                      <linearGradient
                        id="colorDemand"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="passengers"
                      stroke="#818cf8"
                      fillOpacity={1}
                      fill="url(#colorDemand)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN DASHBOARD */}
        {activeTab === "admin" && (
          <div className="space-y-6 animate-fadeIn">
            {!isAdminAuthenticated ? (
              /* Security PIN Lock View */
              <div className="max-w-md mx-auto bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
                  <Key className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">
                    Admin Authentication
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enter Security Access PIN to unlock dispatch controls.
                  </p>
                </div>
                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter Security PIN (Try 2026)"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none tracking-widest"
                  />
                  {authError && (
                    <p className="text-xs text-rose-400 font-medium">
                      {authError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30"
                  >
                    Authenticate Access
                  </button>
                </form>
              </div>
            ) : (
              /* Authenticated Admin View */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>Shuttle Dispatch Admin Console</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Authorized Human Operator Session
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAdminAuthenticated(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
                  >
                    Lock Session
                  </button>
                </div>

                {/* AI Recommendation Decision Card */}
                <div
                  className={`p-6 rounded-2xl border transition-all ${
                    deployed
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-rose-950/20 border-rose-500/30"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                          AI Recommendation Alert
                        </span>
                        <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full">
                          HIGH PRIORITY
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Route: PRP → SJT Corridor
                      </h3>
                      <p className="text-xs text-slate-300">
                        Predicted Occupancy:{" "}
                        <strong
                          className={
                            deployed ? "text-emerald-400" : "text-rose-400"
                          }
                        >
                          {shuttles[0].occupancy}%
                        </strong>{" "}
                        | Expected Waiting Time:{" "}
                        <strong
                          className={
                            deployed ? "text-emerald-400" : "text-rose-400"
                          }
                        >
                          {shuttles[0].wait} min
                        </strong>
                      </p>
                      {deployed && (
                        <p className="text-xs text-emerald-400 font-semibold flex items-center space-x-1 pt-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Human Decision Applied: Shuttle SH-106 dispatched.
                            Bottleneck relieved.
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {!deployed ? (
                        <>
                          <button
                            onClick={handleDeployShuttle}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                          >
                            [ DEPLOY SHUTTLE ]
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => applyPreset(demoPreset)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset State</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

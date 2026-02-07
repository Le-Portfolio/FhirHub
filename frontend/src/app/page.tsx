"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  LogIn,
  UserPlus,
  ArrowRight,
  LayoutDashboard,
  Users,
  FileDown,
  Zap,
  Settings,
  ShieldCheck,
  Lock,
  Database,
  BarChart3,
} from "@/components/ui/icons";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  // --- Loading screen ---
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800">
        <div className="flex flex-col items-center gap-4">
          <HeartPulse className="h-12 w-12 text-white animate-pulse" />
          <span className="loading loading-spinner loading-lg text-white" />
        </div>
      </div>
    );
  }

  // --- Feature badges for brand panel ---
  const featureBadges = [
    "FHIR R4",
    "HL7v2",
    "SMART on FHIR",
    "Bulk Data",
    "RBAC",
    "HIPAA-Ready",
  ];

  // --- Mini nav items for dashboard mockup ---
  const miniNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Users, label: "Patients", active: false },
    { icon: FileDown, label: "Bulk Export", active: false },
    { icon: Zap, label: "SMART Launch", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  // --- Mini metric cards for dashboard mockup ---
  const miniMetrics = [
    { label: "Patients", value: "2,847" },
    { label: "Observations", value: "14.2K" },
    { label: "Conditions", value: "5,391" },
    { label: "Medications", value: "8,104" },
  ];

  // --- Platform highlights for auth panel ---
  const highlights = [
    { icon: Database, title: "FHIR R4 Native", desc: "Full resource support" },
    { icon: ShieldCheck, title: "RBAC Security", desc: "Role-based access" },
    { icon: Zap, title: "SMART on FHIR", desc: "App launch framework" },
    { icon: BarChart3, title: "Clinical Analytics", desc: "Real-time insights" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* ==================== LEFT BRAND PANEL (desktop only) ==================== */}
      <div className="hidden lg:flex lg:w-[58%] h-full relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-[0.08]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>
        </div>
        {/* Radial gradient highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.1),transparent_70%)]" />

        {/* Brand content */}
        <div className="relative z-10 flex flex-col justify-between w-full px-12 xl:px-16 py-12">
          {/* Top: Logo + heading */}
          <div>
            <div className="flex items-center gap-3 mb-10 animate-fade-in">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm">
                <HeartPulse className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">FhirHub</span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight animate-fade-in-up">
              Healthcare Data,
              <br />
              <span className="text-teal-200">Unified &amp; Accessible</span>
            </h2>
            <p className="mt-4 text-teal-100/80 text-lg max-w-md animate-fade-in-up animation-delay-100">
              Enterprise-grade FHIR platform for interoperability, analytics, and clinical data management.
            </p>
          </div>

          {/* Middle: Dashboard mockup */}
          <div className="my-8 animate-fade-in-up animation-delay-200 animate-subtle-float">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl overflow-hidden max-w-lg">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-white/10 rounded-md px-3 py-1 text-xs text-teal-200/60 font-mono">
                    app.fhirhub.io/dashboard
                  </div>
                </div>
              </div>

              {/* Mockup body */}
              <div className="flex">
                {/* Mini sidebar */}
                <div className="w-36 border-r border-white/10 py-3 px-2 space-y-0.5 hidden sm:block">
                  {miniNavItems.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs ${
                        item.active
                          ? "bg-white/15 text-white font-medium"
                          : "text-teal-200/50"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main content area */}
                <div className="flex-1 p-3 space-y-3">
                  {/* Metric cards row */}
                  <div className="grid grid-cols-4 gap-2">
                    {miniMetrics.map((m) => (
                      <div
                        key={m.label}
                        className="bg-white/8 rounded-lg p-2 text-center"
                      >
                        <div className="text-[10px] text-teal-200/50 mb-0.5">{m.label}</div>
                        <div className="text-sm font-bold text-white">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mini bar chart area */}
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <div className="text-[10px] text-teal-200/50 mb-2">Resource Activity</div>
                    <div className="flex items-end gap-1.5 h-10">
                      {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75, 85, 45].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-teal-300/30 rounded-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent items list */}
                  <div className="space-y-1.5">
                    {["Patient record updated", "Observation created", "Bulk export completed"].map(
                      (text, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-white/5 rounded-md px-2.5 py-1.5"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-300/60" />
                          <span className="text-[10px] text-teal-200/60">{text}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Feature badges + trust indicators */}
          <div className="animate-fade-in-up animation-delay-300">
            <div className="flex flex-wrap gap-2 mb-4">
              {featureBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-teal-100 border border-white/10 backdrop-blur-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-5 text-teal-200/60 text-xs">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE BRAND HEADER (< lg) ==================== */}
      <div className="lg:hidden w-full shrink-0 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm">
            <HeartPulse className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">FhirHub</span>
        </div>
        <p className="text-teal-100/80 text-xs mb-3">
          Healthcare Data, Unified &amp; Accessible
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {["FHIR R4", "SMART on FHIR", "RBAC", "HIPAA-Ready"].map((badge) => (
            <span
              key={badge}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-teal-100 border border-white/10"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ==================== RIGHT AUTH PANEL ==================== */}
      <div className="w-full lg:w-[42%] flex flex-col flex-1 min-h-0 bg-base-100 lg:h-full">
        {/* Top-right link */}
        <div className="flex justify-end px-6 pt-4 lg:px-10 lg:pt-6 shrink-0">
          <p className="text-sm text-base-content/50">
            New here?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>

        {/* Auth form centered */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-10 min-h-0">
          <div className="w-full max-w-sm">
            {/* Logo + heading */}
            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <HeartPulse className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold text-base-content tracking-tight">FhirHub</span>
              </div>
              <h1 className="text-2xl font-bold text-base-content">Welcome back</h1>
              <p className="mt-1 text-sm text-base-content/50">
                Sign in to your healthcare data platform
              </p>
            </div>

            {/* Auth buttons */}
            <div className="flex flex-col w-full gap-2.5">
              <Link href="/dashboard" className="btn btn-primary w-full gap-2">
                <LogIn className="w-4 h-4" />
                Sign In with SSO
              </Link>
              <Link
                href="/register"
                className="btn btn-ghost w-full gap-2 border border-base-300"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </Link>
              <div className="divider text-xs text-base-content/40 my-0">or</div>
              <Link href="/guest" className="btn btn-outline btn-secondary w-full gap-2">
                <ArrowRight className="w-4 h-4" />
                Continue as Guest
              </Link>
            </div>

            {/* Platform highlights — hidden on short mobile screens */}
            <div className="mt-8 hidden sm:grid grid-cols-2 gap-3">
              {highlights.map((h) => (
                <div key={h.title} className="flex items-start gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 shrink-0 mt-0.5">
                    <h.icon className="w-4 h-4 text-primary/70" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-base-content">{h.title}</div>
                    <div className="text-[11px] text-base-content/40">{h.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 lg:px-10 lg:pb-6 text-center shrink-0">
          <p className="text-xs text-base-content/30">&copy; 2025 FhirHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

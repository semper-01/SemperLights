import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import {
  fetchAllAppointments,
  fetchAllContactMessages,
  fetchAllProjects,
  fetchAllServices,
  fetchAllSubscribers,
  fetchAllBlogPosts,
} from "@/api/dashboard";
import type { AppointmentResponse, ContactMessageResponse, Project } from "@/types";

// ─── Types ──────────────────────────────────────────────────────

type PageState = "loading" | "ready" | "error";

interface DashboardCounts {
  pendingAppointments: number;
  unreadMessages: number;
  publishedProjects: number;
  totalProjects: number;
  activeServices: number;
  totalSubscribers: number;
  publishedPosts: number;
}

interface ActivityItem {
  id: string;
  type: "appointment" | "message" | "project" | "service" | "blog";
  description: string;
  timestamp: Date;
  link?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Component ──────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [pageError, setPageError] = useState<string | null>(null);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      setPageState("loading");
      const [
        appointmentsRes,
        messagesRes,
        projectsRes,
        servicesRes,
        subscribersRes,
        postsRes,
      ] = await Promise.all([
        fetchAllAppointments(),
        fetchAllContactMessages(),
        fetchAllProjects(),
        fetchAllServices(),
        fetchAllSubscribers(),
        fetchAllBlogPosts(),
      ]);

      const pendingAppts = appointmentsRes.results.filter(
        (a: AppointmentResponse) => a.status === "pending"
      );
      const unreadMsgs = messagesRes.results.filter(
        (m: ContactMessageResponse) => !m.is_read
      );
      const publishedProjects = projectsRes.results.filter(
        (p: Project) => p.status === "published"
      );
      const activeServices = servicesRes.results.filter((s) => s.is_active);
      const publishedPosts = postsRes.results.filter((p) => p.status === "published");

      setCounts({
        pendingAppointments: pendingAppts.length,
        unreadMessages: unreadMsgs.length,
        publishedProjects: publishedProjects.length,
        totalProjects: projectsRes.count,
        activeServices: activeServices.length,
        totalSubscribers: subscribersRes.count,
        publishedPosts: publishedPosts.length,
      });

      // Build activity feed from recent items across all domains
      const activityItems: ActivityItem[] = [];

      appointmentsRes.results.slice(0, 3).forEach((a: AppointmentResponse) => {
        activityItems.push({
          id: `appt-${a.id}`,
          type: "appointment",
          description: `New appointment from ${a.full_name}`,
          timestamp: new Date(a.created_at),
          link: `${ROUTES.DASHBOARD}/appointments`,
        });
      });

      messagesRes.results.slice(0, 3).forEach((m: ContactMessageResponse) => {
        activityItems.push({
          id: `msg-${m.id}`,
          type: "message",
          description: `Contact message from ${m.name} — "${m.subject}"`,
          timestamp: new Date(m.created_at),
          link: `${ROUTES.DASHBOARD}/messages`,
        });
      });

      projectsRes.results.slice(0, 3).forEach((p: Project) => {
        activityItems.push({
          id: `proj-${p.id}`,
          type: "project",
          description: `Project "${p.title}" is ${p.status}`,
          timestamp: new Date(p.updated_at),
          link: `${ROUTES.DASHBOARD}/portfolio`,
        });
      });

      // Sort by most recent first, take top 10
      activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivity(activityItems.slice(0, 10));

      setPageState("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setPageError(msg);
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Loading State ──────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={pageError ?? "Unable to connect to the server."}
        onRetry={loadData}
      />
    );
  }

  // ── Ready State ────────────────────────────────────────────────
  const firstName = user?.first_name || "there";

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName}.
        </h1>
        <p className="mt-1 text-sm text-gray-500">{formatDate()}</p>
      </div>

      {/* ── KPI Cards Row ──────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pending Appointments */}
        <Link to={`${ROUTES.DASHBOARD}/appointments`} className="block">
          <Card padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Appointments</p>
                <p className="mt-1 text-3xl font-bold text-amber-600">
                  {counts?.pendingAppointments ?? 0}
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>
        </Link>

        {/* Unread Messages */}
        <Link to={`${ROUTES.DASHBOARD}/messages`} className="block">
          <Card padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unread Messages</p>
                <p className="mt-1 text-3xl font-bold text-amber-600">
                  {counts?.unreadMessages ?? 0}
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>
        </Link>

        {/* Published Projects */}
        <Link to={`${ROUTES.DASHBOARD}/portfolio`} className="block">
          <Card padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Published Projects</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {counts?.publishedProjects ?? 0}
                </p>
              </div>
              <div className="rounded-full bg-gray-100 p-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* ── Bottom Row: Activity Feed + Quick Actions + Stats ──── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity (2/3 width) */}
        <div className="lg:col-span-2">
          <Card padding="md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No recent activity to display.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.link ?? "#"}
                      className="flex items-center gap-3 py-3 px-1 rounded-lg transition-colors hover:bg-gray-50"
                    >
                      {/* Type icon */}
                      <div className="flex-shrink-0">
                        {item.type === "appointment" && (
                          <div className="rounded-full bg-amber-100 p-2">
                            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {item.type === "message" && (
                          <div className="rounded-full bg-blue-100 p-2">
                            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {item.type === "project" && (
                          <div className="rounded-full bg-green-100 p-2">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Description + timestamp */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{item.description}</p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(item.timestamp)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Actions + Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card padding="md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to={`${ROUTES.DASHBOARD}/portfolio`}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium text-gray-700">New Project</span>
              </Link>
              <Link
                to={`${ROUTES.DASHBOARD}/services`}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium text-gray-700">New Service</span>
              </Link>
              <Link
                to={`${ROUTES.DASHBOARD}/appointments`}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">View All</span>
              </Link>
              <Link
                to={`${ROUTES.DASHBOARD}/messages`}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">Messages</span>
              </Link>
            </div>
          </Card>

          {/* Stats Summary */}
          <Card padding="md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats Summary</h2>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Projects</span>
                <span className="font-medium text-gray-900">{counts?.totalProjects ?? 0}</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Active Services</span>
                <span className="font-medium text-gray-900">{counts?.activeServices ?? 0}</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Subscribers</span>
                <span className="font-medium text-gray-900">{counts?.totalSubscribers ?? 0}</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Published Posts</span>
                <span className="font-medium text-gray-900">{counts?.publishedPosts ?? 0}</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
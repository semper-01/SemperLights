import { useEffect, useState } from "react";
import type { SiteSetting } from "@/types";
import { fetchSiteSettings } from "@/api/domain";
import { updateSiteSetting } from "@/api/dashboard";

import { EmptyState } from "@/components/ui/EmptyState";

type ApiState = { status: "loading" | "ready" | "error"; error?: string };

type FormState = {
  site_name: string;
  tagline: string;
  logoFile: File | null;
  logoPreview: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  mission: string;
  vision: string;
  linkedin: string;
  github: string;
  instagram: string;
  x: string;
  youtube: string;
  footer_text: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
};

function toForm(site: SiteSetting): FormState {
  return {
    site_name: site.site_name ?? "",
    tagline: site.tagline ?? "",
    logoFile: null,
    logoPreview: site.logo ?? "",
    email: site.email ?? "",
    phone: site.phone ?? "",
    location: site.location ?? "",
    bio: (site as unknown as Record<string, string>).bio ?? "",
    mission: (site as unknown as Record<string, string>).mission ?? "",
    vision: (site as unknown as Record<string, string>).vision ?? "",
    linkedin: site.linkedin ?? "",
    github: site.github ?? "",
    instagram: site.instagram ?? "",
    x: site.x ?? "",
    youtube: site.youtube ?? "",
    footer_text: site.footer_text ?? "",
    seo_title: (site as unknown as Record<string, string>).seo_title ?? "",
    seo_description: (site as unknown as Record<string, string>).seo_description ?? "",
    seo_keywords: (site as unknown as Record<string, string>).seo_keywords ?? "",
  };
}

export default function SiteSettingsManagement() {
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });
  const [setting, setSetting] = useState<SiteSetting | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    try {
      setApiState({ status: "loading" });
      const s = await fetchSiteSettings();
      setSetting(s);
      setForm(toForm(s));
      setApiState({ status: "ready" });
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to load settings" });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async () => {
    if (!setting || !form) return;
    try {
      setSaving(true);
      setSuccess(null);

      const fd = new FormData();
      fd.append("site_name", form.site_name);
      fd.append("tagline", form.tagline);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("location", form.location);
      fd.append("bio", form.bio);
      fd.append("mission", form.mission);
      fd.append("vision", form.vision);
      fd.append("linkedin", form.linkedin);
      fd.append("github", form.github);
      fd.append("instagram", form.instagram);
      fd.append("x", form.x);
      fd.append("youtube", form.youtube);
      fd.append("footer_text", form.footer_text);

      // SEO fields may or may not exist on the backend; send them anyway if present.
      fd.append("seo_title", form.seo_title);
      fd.append("seo_description", form.seo_description);
      fd.append("seo_keywords", form.seo_keywords);

      if (form.logoFile) {
        fd.append("logo", form.logoFile);
      }

      await updateSiteSetting(setting.id, fd);
      await load();
      setSuccess("Settings saved successfully.");
    } catch (e) {
      setApiState({ status: "error", error: e instanceof Error ? e.message : "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (apiState.status === "loading" || !form) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
          <div className="h-8 w-2/3 rounded bg-gray-100" />
          <div className="mt-3 h-6 w-full rounded bg-gray-100" />
          <div className="mt-3 h-6 w-4/5 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (apiState.status === "error") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-medium text-red-700">{apiState.error ?? "Error"}</div>
          <button onClick={() => void load()} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-sm text-gray-600">Single unified form for global CMS configuration.</p>
        </div>
      </div>

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</div>
      )}

      {!setting ? (
        <EmptyState title="No settings" message="Create a SiteSetting record in the database." />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Site name</label>
              <input
                value={form.site_name}
                onChange={(e) => setForm((f) => (f ? { ...f, site_name: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tagline</label>
              <input
                value={form.tagline}
                onChange={(e) => setForm((f) => (f ? { ...f, tagline: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setForm((f) => (f ? { ...f, logoFile: file, logoPreview: file ? URL.createObjectURL(file) : f.logoPreview } : f));
                }}
                className="mt-1 w-full text-sm"
              />
              {form.logoPreview ? (
                <div className="mt-3 flex items-center gap-3">
                  <img src={form.logoPreview} alt="Logo preview" className="h-12 w-12 rounded border border-gray-200 object-cover" />
                  <div className="text-xs text-gray-500">Preview</div>
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => (f ? { ...f, location: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">LinkedIn</label>
              <input
                value={form.linkedin}
                onChange={(e) => setForm((f) => (f ? { ...f, linkedin: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">GitHub</label>
              <input
                value={form.github}
                onChange={(e) => setForm((f) => (f ? { ...f, github: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Instagram</label>
              <input
                value={form.instagram}
                onChange={(e) => setForm((f) => (f ? { ...f, instagram: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">X</label>
              <input
                value={form.x}
                onChange={(e) => setForm((f) => (f ? { ...f, x: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">YouTube</label>
              <input
                value={form.youtube}
                onChange={(e) => setForm((f) => (f ? { ...f, youtube: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => (f ? { ...f, bio: e.target.value } : f))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Mission</label>
              <textarea
                value={form.mission}
                onChange={(e) => setForm((f) => (f ? { ...f, mission: e.target.value } : f))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Vision</label>
              <textarea
                value={form.vision}
                onChange={(e) => setForm((f) => (f ? { ...f, vision: e.target.value } : f))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Footer text</label>
              <textarea
                value={form.footer_text}
                onChange={(e) => setForm((f) => (f ? { ...f, footer_text: e.target.value } : f))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">SEO title</label>
              <input
                value={form.seo_title}
                onChange={(e) => setForm((f) => (f ? { ...f, seo_title: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">SEO keywords</label>
              <input
                value={form.seo_keywords}
                onChange={(e) => setForm((f) => (f ? { ...f, seo_keywords: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">SEO description</label>
              <textarea
                value={form.seo_description}
                onChange={(e) => setForm((f) => (f ? { ...f, seo_description: e.target.value } : f))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => void load()}
              disabled={saving}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              type="button"
            >
              Reset
            </button>
            <button
              onClick={() => void onSubmit()}
              disabled={saving}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              type="button"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


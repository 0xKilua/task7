"use client";

import { useEffect, useState } from "react";
import type {
  ClothingCatalogItem,
  HairColorCatalogItem,
  HairstyleCatalogItem,
} from "@relook/types";
import { hexToLab } from "@relook/types";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";

type Tab = "hairstyles" | "colors" | "clothing";

export default function AdminCatalogPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("hairstyles");

  if (!loading && (!user || user.role !== "admin")) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p>Cette page est reservee aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Administration du catalogue</h1>
      <div className="mb-6 flex gap-2">
        {(["hairstyles", "colors", "clothing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {t === "hairstyles" ? "Coiffures" : t === "colors" ? "Couleurs" : "Vetements"}
          </button>
        ))}
      </div>
      {tab === "hairstyles" && <HairstylesAdmin />}
      {tab === "colors" && <ColorsAdmin />}
      {tab === "clothing" && <ClothingAdmin />}
    </div>
  );
}

function HairstylesAdmin() {
  const [items, setItems] = useState<HairstyleCatalogItem[]>([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    length: "mi_longs",
    texture: "lisses",
    family: "carre",
    referenceImageUrl: "/catalog/hairstyles/placeholder.jpg",
  });
  const [error, setError] = useState<string | null>(null);

  const load = () => apiFetch<HairstyleCatalogItem[]>("/catalog/hairstyles").then(setItems);
  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/admin/catalog/hairstyles", {
        method: "POST",
        body: {
          ...form,
          tags: [],
          transformParams: { strength: 0.75, preserveHairline: true },
          suitableForFraming: ["portrait", "buste"],
        },
      });
      setForm({ ...form, id: "", name: "", description: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Echec de la creation.");
    }
  }

  async function remove(id: string) {
    await apiFetch(`/admin/catalog/hairstyles/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h2 className="mb-3 font-semibold">Ajouter une coiffure</h2>
        <form onSubmit={create} className="space-y-3">
          <input className="input" placeholder="Identifiant (ex: bob-degrade)" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <input className="input" placeholder="Nom" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="input" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })}>
              {["tres_courts", "courts", "mi_courts", "mi_longs", "longs", "tres_longs"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select className="input" value={form.texture} onChange={(e) => setForm({ ...form, texture: e.target.value })}>
              {["lisses", "ondules", "boucles", "tres_boucles"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full">Creer</button>
        </form>
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Catalogue actuel ({items.length})</h2>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
              <span>{item.name}</span>
              <button className="text-xs text-red-600" onClick={() => remove(item.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ColorsAdmin() {
  const [items, setItems] = useState<HairColorCatalogItem[]>([]);
  const [form, setForm] = useState({ id: "", name: "", baseColor: "blond", technique: "uniforme", swatchHex: "#c9a468" });
  const [error, setError] = useState<string | null>(null);

  const load = () => apiFetch<HairColorCatalogItem[]>("/catalog/colors").then(setItems);
  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/admin/catalog/colors", {
        method: "POST",
        body: {
          ...form,
          targetLab: hexToLab(form.swatchHex),
          tags: [],
        },
      });
      setForm({ ...form, id: "", name: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Echec de la creation.");
    }
  }

  async function remove(id: string) {
    await apiFetch(`/admin/catalog/colors/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h2 className="mb-3 font-semibold">Ajouter une couleur</h2>
        <form onSubmit={create} className="space-y-3">
          <input className="input" placeholder="Identifiant" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <input className="input" placeholder="Nom" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={form.baseColor} onChange={(e) => setForm({ ...form, baseColor: e.target.value })}>
              {["blond", "blond_clair", "blond_fonce", "blond_polaire", "chatain_clair", "chatain", "chatain_fonce", "brun", "noir", "roux", "cuivre", "auburn", "gris", "blanc"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className="input" value={form.technique} onChange={(e) => setForm({ ...form, technique: e.target.value })}>
              {["uniforme", "meches", "balayage", "ombre", "degrade_couleur", "racines_differentes", "bicolore"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={form.swatchHex} onChange={(e) => setForm({ ...form, swatchHex: e.target.value })} />
            <span className="text-xs text-neutral-500">{form.swatchHex}</span>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full">Creer</button>
        </form>
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Catalogue actuel ({items.length})</h2>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.swatchHex }} />
                {item.name}
              </span>
              <button className="text-xs text-red-600" onClick={() => remove(item.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ClothingAdmin() {
  const [items, setItems] = useState<ClothingCatalogItem[]>([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    category: "haut",
    type: "tshirt",
    fit: "regular",
    color: "",
    material: "",
    style: "",
    season: "toutes_saisons",
    occasion: "quotidien",
    garmentImageUrl: "/catalog/clothing/placeholder.jpg",
  });
  const [error, setError] = useState<string | null>(null);

  const load = () => apiFetch<ClothingCatalogItem[]>("/catalog/clothing").then(setItems);
  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/admin/catalog/clothing", { method: "POST", body: { ...form, tags: [] } });
      setForm({ ...form, id: "", name: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Echec de la creation.");
    }
  }

  async function remove(id: string) {
    await apiFetch(`/admin/catalog/clothing/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h2 className="mb-3 font-semibold">Ajouter un vetement</h2>
        <form onSubmit={create} className="space-y-3">
          <input className="input" placeholder="Identifiant" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <input className="input" placeholder="Nom" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="haut">Haut</option>
            <option value="bas">Bas</option>
            <option value="robe">Robe</option>
          </select>
          <input className="input" placeholder="Type (ex: tshirt, jean, robe_midi)" required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Couleur" required value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <input className="input" placeholder="Matiere" required value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          </div>
          <input className="input" placeholder="Style" required value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full">Creer</button>
        </form>
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Catalogue actuel ({items.length})</h2>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
              <span>{item.name} <span className="text-neutral-400">({item.category})</span></span>
              <button className="text-xs text-red-600" onClick={() => remove(item.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

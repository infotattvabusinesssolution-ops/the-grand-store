import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Globe,
  MapPin,
  Wine,
  Utensils,
  Bed,
  Star,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Copy,
  BookOpen,
  Phone,
  Mail,
  Camera,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const APP = import.meta.env.VITE_APP_URL || "";

const token = () => JSON.parse(localStorage.getItem("userInfo"))?.token;
const headers = () => ({ Authorization: `Bearer ${token()}` });

/* ─── Nav sections config ─── */
const NAV = [
  { id: "core", label: "Core Details", icon: Globe },
  { id: "story", label: "Our Story", icon: BookOpen },
  { id: "vineyard", label: "Vineyard", icon: MapPin },
  { id: "tastings", label: "Wine Tastings", icon: Wine },
  { id: "restaurant", label: "Restaurant", icon: Utensils },
  { id: "accommodation", label: "Accommodation", icon: Bed },
  { id: "experiences", label: "Experiences", icon: Star },
  { id: "contact", label: "Contact & Social", icon: Phone },
  { id: "products", label: "Estate Products", icon: Wine },
];

/* ─── Field components ─── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] text-white/40 uppercase tracking-[0.15em] mb-2 font-medium">
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text" }) => (
  <Field label={label}>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-white/[0.07] transition-all"
    />
  </Field>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <Field label={label}>
    <textarea
      rows={rows}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-400/50 focus:bg-white/[0.07] transition-all resize-none"
    />
  </Field>
);

const Toggle = ({ label, description, value, onChange }) => (
  <div className="flex items-start justify-between gap-8 py-4 border-b border-white/[0.06]">
    <div>
      <p className="text-white/80 text-sm font-medium">{label}</p>
      {description && (
        <p className="text-white/30 text-xs mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-12 h-6 transition-colors ${value ? "bg-amber-500" : "bg-white/10"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white transition-all ${value ? "left-7" : "left-1"}`}
      />
    </button>
  </div>
);

/* ─── Experience / Tasting package editor ─── */
const PackageEditor = ({ items = [], onChange, addLabel = "Add Package" }) => {
  const add = () =>
    onChange([
      ...items,
      { name: "", description: "", price: "", duration: "", capacity: "" },
    ]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, val) =>
    onChange(
      items.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)),
    );

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-white/10 bg-white/[0.03] p-5 relative group"
        >
          <button
            onClick={() => remove(i)}
            className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 pr-8">
            <Input
              label="Name"
              value={item.name}
              onChange={(v) => update(i, "name", v)}
              placeholder="e.g. Classic Tasting"
            />
            <Input
              label="Price (R)"
              value={item.price}
              onChange={(v) => update(i, "price", v)}
              type="number"
              placeholder="250"
            />
            <Input
              label="Duration"
              value={item.duration}
              onChange={(v) => update(i, "duration", v)}
              placeholder="60 minutes"
            />
            <Input
              label="Max Guests"
              value={item.capacity}
              onChange={(v) => update(i, "capacity", v)}
              type="number"
              placeholder="10"
            />
            <div className="col-span-2">
              <Input
                label="Image URL"
                value={item.imageUrl}
                onChange={(v) => update(i, "imageUrl", v)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label="Description"
                value={item.description}
                onChange={(v) => update(i, "description", v)}
                rows={2}
                placeholder="What guests will experience..."
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-2 text-amber-400/70 hover:text-amber-400 text-xs uppercase tracking-widest transition-colors py-2 border border-dashed border-amber-400/20 hover:border-amber-400/40 w-full justify-center"
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
};

/* ─── Section wrapper ─── */
const Section = ({ id, title, children, isActive }) => {
  if (!isActive) return null;
  return (
    <section id={id} className="mb-8">
      
    <div className="mb-6 pb-3 border-b border-white/[0.07]">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
    <div className="space-y-5">{children}</div>
  
    </section>
  );
};

/* ─── Inline save status ─── */
const SaveStatus = ({ status }) => {
  if (!status) return null;
  return (
    <span
      className={`text-xs font-medium flex items-center gap-1.5 transition-all ${
        status === "saving"
          ? "text-white/40"
          : status === "saved"
            ? "text-green-400"
            : "text-red-400"
      }`}
    >
      {status === "saving" && (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
      {status === "saving"
        ? "Saving…"
        : status === "saved"
          ? "✓ Saved"
          : "✗ Failed"}
    </span>
  );
};

export default function EstateBuilder() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error'
  const [publishStatus, setPublishStatus] = useState(null);
  const [activeSection, setActiveSection] = useState("core");
  const contentRef = useRef(null);

  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch profile
    axios
      .get(`${API}/api/estates/vendor/my-profile`, { headers: headers() })
      .then((res) => setProfile(res.data || {}))
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));

    // Fetch products
    axios
      .get(`${API}/api/products/vendor/me`, { headers: headers() })
      .then((res) => setProducts(res.data || []))
      .catch(console.error);
  }, []);

  const set = (path, value) => {
    setProfile((prev) => {
      const keys = path.split(".");
      const updated = { ...prev };
      let cur = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...(cur[keys[i]] || {}) };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const save = async () => {
    setSaveStatus("saving");
    try {
      const res = await axios.post(
        `${API}/api/estates/vendor/my-profile`,
        profile,
        { headers: headers() },
      );
      setProfile(res.data.estate);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const togglePublish = async () => {
    setPublishStatus("loading");
    try {
      const res = await axios.patch(
        `${API}/api/estates/vendor/my-profile/publish`,
        {},
        { headers: headers() },
      );
      setProfile((prev) => ({ ...prev, isPublished: res.data.isPublished }));
      setPublishStatus(null);
    } catch {
      setPublishStatus(null);
    }
  };

  const scrollTo = (id) => { setActiveSection(id); document.getElementById("estate-content")?.scrollTo({ top: 0, behavior: "smooth" }); }

  if (loading)
    return (
      <div className="h-full flex items-center justify-center py-32">
        <div className="w-8 h-8 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );

  const p = profile || {};

  return (
    <div
      className="flex h-full min-h-screen"
      style={{ background: "transparent" }}
    >
      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <aside className="w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-white/[0.07] flex flex-col">
        {/* Estate name + status */}
        <div className="px-6 py-6 border-b border-white/[0.07]">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
            Estate Profile
          </p>
          <h1 className="text-white font-semibold text-sm leading-snug truncate">
            {p.estateName || "Untitled Estate"}
          </h1>
          {/* Status pill */}
          <div
            className={`inline-flex items-center gap-1.5 mt-2 text-[10px] uppercase tracking-widest font-medium ${
              p.isPublished ? "text-green-400" : "text-white/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${p.isPublished ? "bg-green-400" : "bg-white/20"}`}
            />
            {p.isPublished ? "Published" : "Draft"}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-all ${
                activeSection === id
                  ? "text-amber-400 bg-amber-400/10 border-l-2 border-amber-400 pl-[10px]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border-l-2 border-transparent"
              }`}
            >
              <Icon
                size={14}
                className={
                  activeSection === id ? "text-amber-400" : "text-white/30"
                }
              />
              {label}
            </button>
          ))}
        </nav>

        {/* Live URL */}
        {p.slug && (
          <div
            className={`mx-4 mb-4 p-4 border text-xs ${
              p.isPublished
                ? "border-green-500/20 bg-green-500/5"
                : "border-white/[0.07] bg-white/[0.02]"
            }`}
          >
            <p className="text-white/30 uppercase tracking-widest text-[9px] mb-2">
              {p.isPublished ? "🟢 Live URL" : "Estate URL"}
            </p>
            <p className="text-amber-400/70 font-mono text-[10px] break-all leading-relaxed mb-3">
              {APP}/estate/{p.slug}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${APP}/estate/${p.slug}`);
                }}
                className="flex items-center gap-1 text-white/30 hover:text-white/60 text-[9px] uppercase tracking-widest transition-colors"
              >
                <Copy size={9} /> Copy
              </button>
              {p.isPublished && (
                <a
                  href={`/estate/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-amber-400/50 hover:text-amber-400 text-[9px] uppercase tracking-widest transition-colors ml-2"
                >
                  <ExternalLink size={9} /> View
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 pb-6 space-y-2">
          <button
            onClick={togglePublish}
            disabled={publishStatus === "loading"}
            className={`w-full py-2.5 text-xs font-semibold uppercase tracking-widest transition-all ${
              p.isPublished
                ? "border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                : "border border-green-500/40 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {p.isPublished ? "Unpublish" : "Publish Estate"}
          </button>
          <button
            onClick={save}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <Save size={13} />
            Save Changes
          </button>
          <div className="flex justify-center pt-1">
            <SaveStatus status={saveStatus} />
          </div>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div id="estate-content" className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-10 py-10">
          {/* ── Core Details ── */}
          <Section isActive={activeSection === "core"} id="core" title="Core Details">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <Input
                  label="Estate Name *"
                  value={p.estateName}
                  onChange={(v) => set("estateName", v)}
                  placeholder="Stellenbosch Hills Wine Estate"
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Tagline"
                  value={p.tagline}
                  onChange={(v) => set("tagline", v)}
                  placeholder="Where the mountains meet the vine"
                />
              </div>
              <Input
                label="Region"
                value={p.region}
                onChange={(v) => set("region", v)}
                placeholder="Stellenbosch"
              />
              <Input
                label="Country"
                value={p.country}
                onChange={(v) => set("country", v)}
                placeholder="South Africa"
              />
              <div className="col-span-2">
                <Input
                  label="Hero Image URL"
                  value={p.heroImageUrl}
                  onChange={(v) => set("heroImageUrl", v)}
                  placeholder="https://images.unsplash.com/..."
                />
                {p.heroImageUrl && (
                  <div className="mt-3 relative overflow-hidden h-48 bg-white/5">
                    <img
                      src={p.heroImageUrl}
                      alt="Hero preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 border border-white/10 pointer-events-none" />
                    <span className="absolute top-2 left-2 text-[9px] uppercase tracking-widest text-white/40 bg-black/40 px-2 py-1">
                      Preview
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* ── Our Story ── */}
          <Section isActive={activeSection === "story"} id="story" title="Our Story">
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Founded Year"
                value={p.story?.foundedYear}
                onChange={(v) => set("story.foundedYear", v)}
                type="number"
                placeholder="1998"
              />
              <Input
                label="Founders"
                value={p.story?.founders}
                onChange={(v) => set("story.founders", v)}
                placeholder="Johann & Anna Meyer"
              />
            </div>
            <Textarea
              label="History"
              value={p.story?.history}
              onChange={(v) => set("story.history", v)}
              rows={5}
              placeholder="Tell the story of your estate — how it started, what makes it unique..."
            />
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Winemaker Name"
                value={p.story?.winemaker}
                onChange={(v) => set("story.winemaker", v)}
                placeholder="Pieter van der Berg"
              />
              <div /> {/* spacer */}
            </div>
            <Textarea
              label="Winemaker Bio"
              value={p.story?.winemakerBio}
              onChange={(v) => set("story.winemakerBio", v)}
              rows={3}
              placeholder="The winemaker's background and approach..."
            />
            <Textarea
              label="Winemaking Philosophy"
              value={p.story?.philosophy}
              onChange={(v) => set("story.philosophy", v)}
              rows={3}
              placeholder="Our core beliefs about wine and the land..."
            />

            <div className="mt-4">
              <label className="block text-[11px] text-white/40 uppercase tracking-[0.15em] mb-2 font-medium">
                Story Image URLs (Max 4)
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={i}
                    label={`Image ${i + 1} URL`}
                    value={p.story?.images?.[i] || ""}
                    onChange={(v) => {
                      const newImages = [...(p.story?.images || [])];
                      newImages[i] = v;
                      set("story.images", newImages);
                    }}
                    placeholder="https://images.unsplash.com/..."
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* ── Vineyard ── */}
          <Section isActive={activeSection === "vineyard"} id="vineyard" title="Vineyard">
            <div className="mb-6">
              <Input
                label="Vineyard Image URL"
                value={p.vineyard?.imageUrl}
                onChange={(v) => set("vineyard.imageUrl", v)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Altitude"
                value={p.vineyard?.altitude}
                onChange={(v) => set("vineyard.altitude", v)}
                placeholder="320m above sea level"
              />
              <Input
                label="Soil Type"
                value={p.vineyard?.soil}
                onChange={(v) => set("vineyard.soil", v)}
                placeholder="Decomposed granite and clay"
              />
              <Input
                label="Climate"
                value={p.vineyard?.climate}
                onChange={(v) => set("vineyard.climate", v)}
                placeholder="Mediterranean"
              />
              <Input
                label="Viticulture"
                value={p.vineyard?.viticulture}
                onChange={(v) => set("vineyard.viticulture", v)}
                placeholder="Organic / Biodynamic"
              />
            </div>
            <Textarea
              label="Sustainability Notes"
              value={p.vineyard?.sustainability}
              onChange={(v) => set("vineyard.sustainability", v)}
              rows={3}
              placeholder="Our sustainable farming practices — water use, solar, composting..."
            />
          </Section>

          {/* ── Wine Tastings & Experiences ── */}
          <Section isActive={activeSection === "tastings"} id="tastings" title="Wine Tastings & Hospitality">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <Input
                label="Section Title"
                value={p.hospitality?.title}
                onChange={(v) => set("hospitality.title", v)}
                placeholder="Curated experiences designed to guide you..."
              />
              <Input
                label="Section Subtitle"
                value={p.hospitality?.subtitle}
                onChange={(v) => set("hospitality.subtitle", v)}
                placeholder="Visit & join us at the estate"
              />
            </div>

            <Toggle
              label="We offer wine tastings"
              description="Allow customers to see and book tasting packages"
              value={p.hospitality?.hasTastings}
              onChange={(v) => set("hospitality.hasTastings", v)}
            />
            {p.hospitality?.hasTastings && (
              <div className="pt-2">
                <Input
                  label="Tastings Image URL"
                  value={p.hospitality?.tastingsImageUrl}
                  onChange={(v) => set("hospitality.tastingsImageUrl", v)}
                  placeholder="https://images.unsplash.com/..."
                />
                <div className="mt-4">
                  <PackageEditor
                    items={p.hospitality?.tastings || []}
                    onChange={(v) => set("hospitality.tastings", v)}
                    addLabel="Add Tasting Package"
                  />
                </div>
              </div>
            )}
          </Section>

          {/* ── Restaurant ── */}
          <Section isActive={activeSection === "restaurant"} id="restaurant" title="Restaurant">
            <Toggle
              label="We have a restaurant"
              description="Show restaurant details on your estate page"
              value={p.hospitality?.hasRestaurant}
              onChange={(v) => set("hospitality.hasRestaurant", v)}
            />
            {p.hospitality?.hasRestaurant && (
              <>
                <Input
                  label="Restaurant Image URL"
                  value={p.hospitality?.restaurant?.imageUrl}
                  onChange={(v) => set("hospitality.restaurant.imageUrl", v)}
                  placeholder="https://images.unsplash.com/..."
                />
                <Input
                  label="Restaurant Name"
                  value={p.hospitality?.restaurant?.name}
                  onChange={(v) => set("hospitality.restaurant.name", v)}
                  placeholder="The Cellar Table"
                />
                <Textarea
                  label="Description"
                  value={p.hospitality?.restaurant?.description}
                  onChange={(v) => set("hospitality.restaurant.description", v)}
                  rows={3}
                  placeholder="Farm-to-table cuisine with panoramic vineyard views..."
                />
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Opening Hours"
                    value={p.hospitality?.restaurant?.openingHours}
                    onChange={(v) =>
                      set("hospitality.restaurant.openingHours", v)
                    }
                    placeholder="Wed–Sun 12:00–15:00"
                  />
                  <Input
                    label="Phone"
                    value={p.hospitality?.restaurant?.phoneNumber}
                    onChange={(v) =>
                      set("hospitality.restaurant.phoneNumber", v)
                    }
                    placeholder="+27 21 000 0000"
                  />
                </div>
              </>
            )}
          </Section>

          {/* ── Accommodation ── */}
          <Section isActive={activeSection === "accommodation"} id="accommodation" title="Accommodation">
            <Toggle
              label="We offer accommodation"
              description="Vineyard cottages, guesthouses, or rooms"
              value={p.hospitality?.hasAccommodation}
              onChange={(v) => set("hospitality.hasAccommodation", v)}
            />
            {p.hospitality?.hasAccommodation && (
              <>
                <Input
                  label="Accommodation Image URL"
                  value={p.hospitality?.accommodation?.imageUrl}
                  onChange={(v) => set("hospitality.accommodation.imageUrl", v)}
                  placeholder="https://images.unsplash.com/..."
                />
                <Textarea
                  label="Description"
                  value={p.hospitality?.accommodation?.description}
                  onChange={(v) =>
                    set("hospitality.accommodation.description", v)
                  }
                  rows={3}
                  placeholder="Stay in our vineyard cottages surrounded by vines..."
                />
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Price From (R / night)"
                    value={p.hospitality?.accommodation?.priceFrom}
                    onChange={(v) =>
                      set("hospitality.accommodation.priceFrom", v)
                    }
                    type="number"
                    placeholder="1800"
                  />
                  <Input
                    label="Booking Email"
                    value={p.hospitality?.accommodation?.bookingEmail}
                    onChange={(v) =>
                      set("hospitality.accommodation.bookingEmail", v)
                    }
                    placeholder="stay@myfarm.co.za"
                  />
                </div>
              </>
            )}
          </Section>

          {/* ── Other Experiences ── */}
          <Section isActive={activeSection === "experiences"} id="experiences" title="Other Experiences">
            <p className="text-white/30 text-sm mb-4">
              Vineyard tours, harvest experiences, cellar tours, and more.
            </p>
            <PackageEditor
              items={p.hospitality?.experiences || []}
              onChange={(v) => set("hospitality.experiences", v)}
              addLabel="Add Experience"
            />
          </Section>

          {/* ── Contact & Social ── */}
          <Section isActive={activeSection === "contact"} id="contact" title="Contact & Social">
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Email"
                value={p.contact?.email}
                onChange={(v) => set("contact.email", v)}
                placeholder="info@myestate.co.za"
              />
              <Input
                label="Phone"
                value={p.contact?.phone}
                onChange={(v) => set("contact.phone", v)}
                placeholder="+27 21 000 0000"
              />
              <Input
                label="Website"
                value={p.contact?.website}
                onChange={(v) => set("contact.website", v)}
                placeholder="https://myestate.co.za"
              />
              <Input
                label="Instagram"
                value={p.contact?.instagram}
                onChange={(v) => set("contact.instagram", v)}
                placeholder="@myestate"
              />
            </div>
            <Textarea
              label="Physical Address"
              value={p.contact?.address}
              onChange={(v) => set("contact.address", v)}
              rows={2}
              placeholder="1 Wine Route Road, Stellenbosch, 7600"
            />
            <Input
              label="Google Maps Link"
              value={p.contact?.mapLink}
              onChange={(v) => set("contact.mapLink", v)}
              placeholder="https://maps.google.com/..."
            />
          </Section>

          {/* Bottom save bar */}
          <div className="sticky bottom-0 -mx-10 px-10 py-4 bg-[#1a1410] flex items-center justify-between">
            <SaveStatus status={saveStatus} />
            <button
              onClick={save}
              className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase tracking-widest transition-colors"
            >
              <Save size={15} /> Save Estate Profile
            </button>
          </div>
          <Section id="products" title="Estate Products" isActive={activeSection === "products"}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60 text-sm">
                Wine products you add to the store automatically sync to your Estate Profile.
              </p>
              <button 
                onClick={() => navigate('/vendor/product-add')}
                className="px-4 py-2 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30 text-xs uppercase tracking-widest font-medium transition-colors rounded flex items-center gap-2"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>
            
            {products.length === 0 ? (
              <div className="border border-white/10 bg-white/[0.03] p-10 text-center rounded">
                <Wine size={48} className="mx-auto text-amber-500/30 mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No Products Yet</h3>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  You haven't added any products to the store yet. Add some wines to see them listed on your Estate Profile!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.filter(p => (p.category === 'Wine' || (p.type && p.type.toLowerCase() === 'wine'))).map(product => (
                  <div key={product.id} className="border border-white/10 bg-white/[0.03] p-4 rounded text-center group relative">
                    <div className="aspect-[3/4] bg-black/40 mb-3 overflow-hidden rounded">
                      {product.image ? (
                        <img src={`${API}${product.image}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10"><Wine size={32} /></div>
                      )}
                    </div>
                    <p className="text-white font-medium text-sm truncate">{product.name}</p>
                    <p className="text-amber-500/80 text-xs">R {product.price}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}


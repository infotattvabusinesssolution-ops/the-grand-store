import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ShoppingBag,
  Package,
  MapPin,
  Search,
  Truck,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { formatCartPrice } from "../../data";
import Price from '../../components/ui/Price';
import api from '../../api';

export default function VendorOrders() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [vendorProfile, setVendorProfile] = useState(null);
  const [postnetStores, setPostnetStores] = useState(null);
  const [postnetLoading, setPostnetLoading] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await api.get(`/orders/vendor/sales`);
        const data = res.data;
        setShipments(data);

        // Also fetch vendor profile to get address for PostNet Locator
        const profRes = await api.get(`/vendor/shipping-profile`);
        const profData = profRes.data;
        setVendorProfile(profData);
      } catch (error) {
        console.error("Failed to fetch sales or profile", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchSales();
    }
  }, [user]);

  // Fetch PostNet stores when vendor profile is loaded and has an address
  useEffect(() => {
    const fetchPostnetStores = async () => {
      if (!vendorProfile?.pickupAddress) return;
      const addr = vendorProfile.pickupAddress;
      const addressString = `${addr.city || ""}, ${addr.country || "South Africa"}`;

      try {
        setPostnetLoading(true);
        let queryParams = `address=${encodeURIComponent(addressString)}`;
        if (addr.lat && addr.lng) {
            queryParams += `&lat=${addr.lat}&lng=${addr.lng}`;
        }
        const res = await api.get(`/postnet/locator?${queryParams}`);
        const data = res.data;
        if (data.stores) {
          setPostnetStores(data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch PostNet stores:", error);
      } finally {
        setPostnetLoading(false);
      }
    };

    fetchPostnetStores();
  }, [vendorProfile, user.token]);

  const goldTextClass =
    "text-[#c9a35b] ";
  const filteredShipments = shipments.filter(
    (shp) =>
      (shp.shipmentId || shp._id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (shp.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-2 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-gold)]/10 text-[#e1bd70] rounded-xl border border-[var(--color-gold)]/20 ">
              <ShoppingBag size={28} />
            </div>
            Fulfillment{" "}
            <span className={`${goldTextClass} ml-2`}>Shipments</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm max-w-2xl font-light">
            Manage your outgoing shipments. Orders containing items from
            multiple vendors are split into individual shipments automatically.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search by Shipment ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-full py-3 px-5 pl-10 text-sm text-[var(--color-ivory)] placeholder:text-[var(--color-ivory-muted)]/50 focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
          />
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ivory-muted)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-[#e1bd70] p-10 text-center">
          Loading your shipments...
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
          <Truck
            size={48}
            className="mx-auto mb-4 text-[var(--color-ivory-muted)] opacity-20"
          />
          <p className="text-[var(--color-ivory-muted)] text-lg">
            No shipments found.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* PostNet Drop-off Stores Widget */}
          {postnetLoading ? (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center text-sm text-[var(--color-ivory-muted)]">
              Locating nearest PostNet stores for drop-off...
            </div>
          ) : postnetStores && postnetStores.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-[var(--color-gold)]/20 rounded-2xl p-6 shadow-lg shadow-[var(--color-gold)]/5 flex items-center justify-center min-h-[100px]">
              <p className="text-[var(--color-ivory-muted)] text-sm">No nearby PostNet stores found within 50km.</p>
            </div>
          ) : (
            postnetStores &&
            postnetStores.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[var(--color-gold)]/20 rounded-2xl p-6 shadow-lg shadow-[var(--color-gold)]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-lg">
                    <Navigation size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-[var(--color-ivory)]">
                      Nearest PostNet Drop-off Locations
                    </h3>
                    <p className="text-xs text-[var(--color-ivory-muted)]">
                      Based on your pickup address:{" "}
                      {vendorProfile?.pickupAddress?.city}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  {postnetStores.map((store, idx) => (
                    <div
                      key={idx}
                      className="bg-white/[0.02] border border-white/10 hover:border-[var(--color-gold)]/30 rounded-xl p-4 transition-colors group"
                    >
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.store + ' ' + store.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-between items-start gap-2"
                      >
                        <h4 className="text-sm font-bold text-[var(--color-ivory)] mb-1 group-hover:text-[#e1bd70] transition-colors">
                          {store.store}
                        </h4>
                        <ExternalLink size={14} className="text-[var(--color-ivory-muted)] opacity-50 group-hover:text-[var(--color-gold)] transition-colors mt-0.5 flex-shrink-0" />
                      </a>
                      <p className="text-xs text-[var(--color-ivory-muted)] mb-3 leading-relaxed">
                        {store.address}
                      </p>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-xs font-mono text-[var(--color-gold)]">
                          {store.telephone}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest bg-[var(--color-gold)]/10 text-[var(--color-gold)] px-2 py-1 rounded">
                          {store.distance ? store.distance.toFixed(1) : "?"} KM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          <div className="space-y-6">
            {filteredShipments.map((shp) => (
              <div
                key={shp._id}
                className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all"
              >
                {/* Shipment Header */}
                <div className="bg-black/40 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 gap-4">
                  <div className="flex flex-col md:flex-row gap-2 md:gap-8">
                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                        Shipment ID
                      </div>
                      <div className="text-sm text-[#e1bd70] font-bold">
                        {shp.shipmentId || shp._id}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                        Date
                      </div>
                      <div className="text-sm text-[var(--color-ivory)] font-serif">
                        {new Date(shp.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                        Status
                      </div>
                      <div className="text-sm text-[var(--color-ivory)] font-medium px-2 py-1 bg-gold/10 text-gold rounded border border-gold/20 inline-block">
                        {shp.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                      Products Total
                    </div>
                    <div className="text-xl font-serif text-[#e1bd70]">
                      <Price amount={shp.vendorTotal} />
                    </div>
                  </div>
                </div>

                {/* Order Details Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Customer Info */}
                  <div className="col-span-1 border-r border-white/5 pr-4">
                    <h4 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-4 flex items-center gap-2">
                      <MapPin size={14} className="text-[#e1bd70]" />{" "}
                      Shipping Details
                    </h4>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[var(--color-ivory)]">
                        {shp.customerName}
                      </p>
                      <p className="text-xs text-[var(--color-ivory-muted)]">
                        Courier: {shp.courierName}
                      </p>
                      {shp.customerPhone && (
                        <p className="text-xs text-[var(--color-ivory-muted)]">
                          Phone: {shp.customerPhone}
                        </p>
                      )}
                      {shp.customerEmail && (
                        <p className="text-xs text-[var(--color-ivory-muted)]">
                          Email: {shp.customerEmail}
                        </p>
                      )}
                    </div>

                    {shp.deliveryPreference === 'postnet' && shp.selectedPostnetStore ? (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1">
                        <div className="text-amber-400 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          <MapPin size={12} /> PostNet Collection Point
                        </div>
                        <div className="text-white font-medium">{shp.selectedPostnetStore.name}</div>
                        <div className="text-white/70">{shp.selectedPostnetStore.address}</div>
                        {shp.selectedPostnetStore.telephone && (
                          <div className="text-white/50">Tel: {shp.selectedPostnetStore.telephone}</div>
                        )}
                      </div>
                    ) : null}

                    {shp.deliveryAddress ? (
                      <div className="mt-4 text-sm text-[var(--color-ivory-muted)] leading-relaxed">
                        {shp.deliveryAddress.address}
                        <br />
                        {shp.deliveryAddress.city},{" "}
                        {shp.deliveryAddress.postalCode}
                        <br />
                        {shp.deliveryAddress.country}
                      </div>
                    ) : (
                      <div className="mt-4 text-xs italic text-[var(--color-ivory-muted)] opacity-50">
                        No shipping address provided
                      </div>
                    )}

                    {shp.trackingNumber && (
                      <div className="mt-4 p-3 bg-white/5 rounded border border-white/10">
                        <p className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mb-1">
                          Tracking Number
                        </p>
                        <p className="text-sm text-gold font-mono">
                          {shp.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-4 flex items-center gap-2">
                      <Package size={14} className="text-[#e1bd70]" />{" "}
                      Products to Pack
                    </h4>
                    <div className="space-y-4">
                      {shp.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 last:pb-0"
                        >
                          <div className="flex gap-4 items-center">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-contain bg-black rounded border border-white/10 p-1"
                              />
                            )}
                            <div>
                              <p className="text-sm font-serif text-[var(--color-ivory)]">
                                {item.name}
                              </p>
                              {item.option && (
                                <p className="text-xs text-[var(--color-ivory-muted)] mt-1">
                                  {item.option}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[var(--color-ivory)]">
                              {item.quantity} × <Price amount={item.price} />
                            </div>
                            <div className="text-xs font-bold text-[#e1bd70] mt-1">
                              <Price amount={item.price * item.quantity} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

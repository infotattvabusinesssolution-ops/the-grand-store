import React, { useState, useEffect } from "react";
import api from '../../api';
import {
  FileText,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Price from "../../components/ui/Price";

export default function AdminBankTransfers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "history"
  const [processingId, setProcessingId] = useState(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    orderId: null,
    recordType: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = userInfo.token;
      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await api.get(`${API_URL}/api/admin/bank-transfers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      setError("Failed to load bank transfers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = (record) => {
    setModalConfig({ isOpen: true, type: "approve", orderId: record._id, recordType: record.recordType || 'shop' });
  };

  const handleReject = (record) => {
    setRejectReason("");
    setModalConfig({ isOpen: true, type: "reject", orderId: record._id, recordType: record.recordType || 'shop' });
  };

  const closeModal = () => {
    setModalConfig({ isOpen: false, type: null, orderId: null, recordType: null });
    setRejectReason("");
  };

  const confirmApprove = async () => {
    const { orderId, recordType } = modalConfig;
    if (!orderId) return;

    try {
      setProcessingId(orderId);
      closeModal();
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = userInfo.token;
      const API_URL = import.meta.env.VITE_API_URL || "";
      const approvalPath = recordType === 'event'
        ? `/api/events/bookings/${orderId}/bank-transfer/approve`
        : `/api/orders/${orderId}/bank-transfer/approve`;
      await api.post(
        `${API_URL}${approvalPath}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // We don't just remove it, we update the status so it moves to history tab!
      setOrders(orders.map(o => o._id === orderId
        ? {
            ...o,
            paymentStatus: recordType === 'event' ? 'Paid' : 'Completed',
            reviewStatus: recordType === 'event' ? 'Approved' : 'Completed',
            bankTransferStatus: recordType === 'event' ? 'Approved' : o.bankTransferStatus,
          }
        : o));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve payment");
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = async () => {
    const { orderId, recordType } = modalConfig;
    if (!orderId || !rejectReason.trim()) return;

    try {
      setProcessingId(orderId);
      closeModal();
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = userInfo.token;
      const API_URL = import.meta.env.VITE_API_URL || "";
      const rejectionPath = recordType === 'event'
        ? `/api/events/bookings/${orderId}/bank-transfer/reject`
        : `/api/orders/${orderId}/bank-transfer/reject`;
      await api.post(
        `${API_URL}${rejectionPath}`,
        { reason: rejectReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // We don't just remove it, we update the status so it moves to history tab!
      setOrders(orders.map(o => o._id === orderId
        ? {
            ...o,
            paymentStatus: 'Failed',
            reviewStatus: recordType === 'event' ? 'Rejected' : 'Failed',
            bankTransferStatus: recordType === 'event' ? 'Rejected' : o.bankTransferStatus,
          }
        : o));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const reference = o.orderId || o.gsReference || o._id;
    const matchesSearch = reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (o.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (o.event?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const reviewStatus = o.reviewStatus || o.paymentStatus;
    
    const matchesTab = activeTab === 'requests' 
      ? reviewStatus === 'Awaiting_Approval'
      : reviewStatus !== 'Awaiting_Approval';
      
    return matchesSearch && matchesTab;
  });

  if (loading)
    return (
      <div className="text-white p-8 text-center animate-pulse">
        Loading bank transfers...
      </div>
    );
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-serif text-white flex items-center gap-3">
            Bank Transfer Verification
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review manual payments for shop orders and event tickets. Approval
            completes the correct order or issues the customer&apos;s QR ticket.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-[#c9a35b] text-black shadow-[0_0_10px_rgba(201,163,91,0.3)]' : 'text-gray-400 hover:text-white'}`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-[#c9a35b] text-black shadow-[0_0_10px_rgba(201,163,91,0.3)]' : 'text-gray-400 hover:text-white'}`}
          >
            History
          </button>
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search by Order ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 px-4 pl-10 text-sm text-[var(--color-ivory)] placeholder:text-[var(--color-ivory-muted)]/50 focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
          />
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ivory-muted)]"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.01]">
          <CheckCircle
            size={48}
            className="mx-auto mb-4 text-green-500 opacity-20"
          />
          <p className="text-gray-400 font-medium">
            {activeTab === 'requests' ? "All caught up! No pending bank transfers to review." : "No bank transfer history found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-[#111] border border-white/10 rounded-xl overflow-hidden"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Order Meta */}
                <div className="md:col-span-3 space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      Reference
                    </p>
                    <p className="text-sm text-[#c9a35b] font-mono">
                      {order.orderId}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Payment For</p>
                    <p className="text-sm text-white">{order.recordLabel || 'Shop order'}</p>
                    {order.event?.title && <p className="mt-1 text-xs text-gray-400">{order.event.title}</p>}
                    {order.orderItems?.[0]?.name && <p className="mt-1 text-xs text-[#c9a35b]">{order.orderItems[0].name}</p>}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      Customer
                    </p>
                    <p className="text-sm text-white">
                      {order.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.user?.email || ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      Date Placed
                    </p>
                    <p className="text-sm text-gray-300">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Financials */}
                <div className="md:col-span-3 space-y-4 border-l border-white/5 pl-6">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      Total Amount Due
                    </p>
                    <p className="text-2xl font-serif text-white">
                      <Price amount={order.totalPrice} />
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <span className="inline-block px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] uppercase tracking-wider rounded">
                      {(order.reviewStatus || order.paymentStatus).replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Proof of Payment */}
                <div className="md:col-span-3 border-l border-white/5 pl-6 flex flex-col justify-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                    Proof of Payment Link
                  </p>
                  {order.proofUrl ? (
                    <div className="p-4 bg-black/40 border border-white/10 rounded-lg">
                      <a
                        href={order.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors break-all flex items-start gap-2"
                      >
                        <ExternalLink size={14} className="shrink-0 mt-0.5" />
                        {order.proofUrl}
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-black/20 border border-white/5 rounded-lg text-center text-gray-500 text-xs italic">
                      No link provided yet
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="md:col-span-3 border-l border-white/5 pl-6 flex flex-col justify-center gap-3">
                  {activeTab === 'requests' ? (
                    <>
                      <button
                        onClick={() => handleApprove(order)}
                        disabled={processingId === order._id || !order.proofUrl}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle size={18} />
                        {processingId === order._id
                          ? "Processing..."
                          : "Approve Payment"}
                      </button>
                      <button
                        onClick={() => handleReject(order)}
                        disabled={processingId === order._id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle size={18} />
                        Reject Payment
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
                        ['Completed', 'Approved'].includes(order.reviewStatus || order.paymentStatus) ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        ['Failed', 'Rejected'].includes(order.reviewStatus || order.paymentStatus) ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {['Completed', 'Approved'].includes(order.reviewStatus || order.paymentStatus) ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {(order.reviewStatus || order.paymentStatus).replaceAll('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-serif text-white">
                {modalConfig.type === "approve"
                  ? "Approve Payment"
                  : "Reject Payment"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {modalConfig.type === "approve"
                  ? "Approve this payment? Shop orders will enter fulfilment and event bookings will immediately receive a valid QR ticket."
                  : "Please provide a reason for rejecting this bank transfer."}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {modalConfig.type === "reject" && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none h-24"
                    placeholder="E.g., Amount received does not match order total..."
                    autoFocus
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    modalConfig.type === "approve"
                      ? confirmApprove
                      : confirmReject
                  }
                  disabled={
                    modalConfig.type === "reject" && !rejectReason.trim()
                  }
                  className={`flex-1 py-3 px-4 rounded-xl text-black font-medium text-sm transition-all ${
                    modalConfig.type === "approve"
                      ? "bg-gradient-to-r from-[#c9a35b] to-[#b58b38] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                      : "bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {modalConfig.type === "approve"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

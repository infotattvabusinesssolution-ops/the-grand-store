import React, { useState } from 'react';
import { useCrmComms } from '../hooks/useCrmComms';
import StatusBadge from '../components/common/StatusBadge';
import { 
  MessageSquare, Mail, Phone, Clock, Plus, 
  Send, User, CheckCircle2, AlertCircle, X, Calendar,
  FileText, ExternalLink, ShieldCheck, Tag, Reply, Copy
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const EMAIL_TEMPLATES = [
  {
    id: 'export_quote',
    name: 'B2B Export Quotation Follow-up',
    channel: 'email',
    subject: 'Grand Store Global — Quotation for [Cases] Cases [Product Vintage]',
    body: `Dear [Customer Name],

Thank you for reaching out to Grand Store Global regarding your international consignment enquiry.

We have prepared an export quotation covering [Quantity] cases of [Product Name] under Incoterms [CIF / FOB / DDP] to [Destination Port/Airport].

All bottles are certified authentic, packaged in temperature-controlled export master cartons with Certificate of Origin and phytosanitary clearance.

Please review the attached Proforma terms. We look forward to confirming your allocation.

Warm regards,
Grand Store International Trade Desk
https://grandstore.co.za`
  },
  {
    id: 'vendor_kyc',
    name: 'Vendor KYC & Licence Verification',
    channel: 'email',
    subject: 'Action Required: Verification Documents for Grand Store Vendor Partner',
    body: `Dear [Vendor Name / Winery Representative],

Welcome to Grand Store Global. To finalize your vendor onboarding and activate your wine and spirit listings on our marketplace, our compliance team requires the following verification documents:

1. Valid Wholesale / Retail Liquor Licence
2. CIPC Business Registration Certificate
3. Export Capability Certification (if participating in Global Trade)
4. Proof of Banking Details (Bank Confirmation Letter < 3 months)

Please upload these files via the Vendor Portal or reply directly to this email.

Sincerely,
Vendor Relations & Compliance
Grand Store Global`
  },
  {
    id: 'tasting_confirm',
    name: 'Tasting Event VIP Reservation',
    channel: 'email',
    subject: 'Reservation Confirmed: [Event Title] at Grand Store Cellar',
    body: `Dear [Guest Name],

Your reservation for [Event Title] has been confirmed.

• Date & Time: [Date Time]
• Venue: Grand Store VIP Tasting Lounge, Cape Town
• Pass Code: TCK-[Ticket Number]
• Sommelier Host: [Host Name]

Please present your digital ticket QR code or ticket reference upon arrival at the Door Desk.

We look forward to hosting you for an extraordinary tasting experience.

Warm regards,
Grand Store Concierge Team`
  },
  {
    id: 'delivery_exception',
    name: 'Logistics / Delivery Update',
    channel: 'email',
    subject: 'Grand Store Logistics Update — Order #[Order ID]',
    body: `Dear [Customer Name],

We are actively monitoring the delivery of your Grand Store order #[Order ID].

Our operations team noticed a carrier transit update: [Transit Note / Delay Reason]. We are in direct contact with the courier dispatch team to ensure prompt delivery to [Destination Address].

Tracking Reference: [Tracking Number]

Thank you for your patience while we ensure your fine spirits arrive in pristine condition.

Grand Store Logistics Team`
  },
  {
    id: 'vendor_settlement',
    name: 'Vendor 30-Day Settlement Remittance',
    channel: 'email',
    subject: 'Remittance Advice: Grand Store 30-Day Vendor Settlement Batch #[Batch ID]',
    body: `Dear [Winery / Vendor Partner],

Please find attached your 30-day post-delivery settlement summary for orders fulfilled between [Start Date] and [End Date].

• Gross Product Sales: R [Gross Amount]
• Agreed Platform Commission (15%): -R [Commission]
• Net Remittance Payable: R [Net Amount]
• Payment Reference: REM-[Reference]

Funds have been queued for EFT settlement directly into your registered bank account.

Kind regards,
Grand Store Finance & Accounts Desk`
  }
];

export default function CrmCommsHubPage() {
  const { comms, loading, channelFilter, setChannelFilter, logComm } = useCrmComms();
  const toast = useToast();
  
  const [selectedComm, setSelectedComm] = useState(null);
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  
  // Call Log State
  const [callData, setCallData] = useState({
    recipient: '',
    outcome: 'reached_and_discussed',
    durationSeconds: 180,
    notes: '',
    createFollowUp: false,
    followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  // Compose / Template State
  const [composeData, setComposeData] = useState({
    templateId: '',
    channel: 'email',
    direction: 'outbound',
    recipientName: '',
    recipientEmailOrPhone: '',
    subject: '',
    messageBody: '',
    createFollowUp: false,
    followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  const [submitting, setSubmitting] = useState(false);

  // Apply template selection
  const handleSelectTemplate = (templateId) => {
    const tmpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) {
      setComposeData(prev => ({ ...prev, templateId: '', subject: '', messageBody: '' }));
      return;
    }
    setComposeData(prev => ({
      ...prev,
      templateId,
      channel: tmpl.channel,
      subject: tmpl.subject,
      messageBody: tmpl.body
    }));
    toast.info(`Loaded "${tmpl.name}" template`);
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    if (!composeData.messageBody || !composeData.subject) {
      toast.error('Subject and message body are required');
      return;
    }

    setSubmitting(true);
    try {
      await logComm({
        channel: composeData.channel,
        direction: composeData.direction,
        subject: composeData.subject,
        messageBody: composeData.messageBody,
        recipient: {
          name: composeData.recipientName || 'Customer / Partner',
          email: composeData.channel === 'email' ? composeData.recipientEmailOrPhone : undefined,
          phone: composeData.channel === 'whatsapp' ? composeData.recipientEmailOrPhone : undefined
        },
        createFollowUp: composeData.createFollowUp,
        followUpDueDate: composeData.createFollowUp ? composeData.followUpDate : undefined
      });

      toast.success(`${composeData.channel === 'email' ? 'Email' : 'Message'} recorded and logged successfully`);
      setIsComposeModalOpen(false);
      setComposeData({
        templateId: '',
        channel: 'email',
        direction: 'outbound',
        recipientName: '',
        recipientEmailOrPhone: '',
        subject: '',
        messageBody: '',
        createFollowUp: false,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
    } catch (err) {
      toast.error('Failed to log communication');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogCallSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await logComm({
        channel: 'phone_call',
        direction: 'outbound',
        subject: `Phone Call: ${callData.recipient}`,
        messageBody: callData.notes,
        recipient: { name: callData.recipient },
        phoneCallDetails: {
          durationSeconds: Number(callData.durationSeconds),
          outcome: callData.outcome
        },
        createFollowUp: callData.createFollowUp,
        followUpDueDate: callData.createFollowUp ? callData.followUpDate : undefined
      });
      toast.success('Phone call logged to communication timeline');
      setIsLogCallModalOpen(false);
      setCallData({
        recipient: '',
        outcome: 'reached_and_discussed',
        durationSeconds: 180,
        notes: '',
        createFollowUp: false,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
    } catch (err) {
      toast.error('Failed to save phone call log');
    } finally {
      setSubmitting(false);
    }
  };

  const channelButtons = [
    { key: 'all', label: 'All Channels', icon: MessageSquare },
    { key: 'email', label: 'Customer Emails', icon: Mail },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { key: 'phone_call', label: 'Phone Logs', icon: Phone }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Communications Centre
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md border border-blue-200">
              Module 7 (GS CRM 1)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Shared team inbox, official business messaging, phone call outcomes, and reusable professional email templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComposeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Send size={14} /> Compose with Template
          </button>
          <button
            onClick={() => setIsLogCallModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Phone size={14} /> Log Phone Call
          </button>
        </div>
      </div>

      {/* 3-Column Communications Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Channels & Filters (col-span-3) */}
        <div className="md:col-span-1 lg:col-span-3 p-4 border-r border-slate-100 space-y-4 bg-slate-50/50">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Channels
            </p>
            <div className="space-y-1">
              {channelButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => {
                    setChannelFilter(btn.key);
                    setSelectedComm(null);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                    ${channelFilter === btn.key 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
                  `}
                >
                  <btn.icon size={16} />
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Templates Drawer / Shortcut List */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1">
              <FileText size={12} /> Standard Templates
            </p>
            <div className="space-y-1">
              {EMAIL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    handleSelectTemplate(tmpl.id);
                    setIsComposeModalOpen(true);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-transparent hover:border-blue-100 block truncate"
                  title={tmpl.name}
                >
                  <p className="font-semibold truncate">{tmpl.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{tmpl.subject}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Conversation Stream (col-span-5) */}
        <div className={`md:col-span-3 lg:col-span-5 flex flex-col border-r border-slate-100 ${selectedComm ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Communications Feed ({comms.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Click record to view dossier</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[580px] crm-scrollbar flex-1">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading communications...
              </div>
            ) : comms.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No communication records found for this filter.
              </div>
            ) : (
              comms.map((comm) => (
                <div
                  key={comm._id}
                  onClick={() => setSelectedComm(comm)}
                  className={`
                    p-4 hover:bg-blue-50/40 transition-colors cursor-pointer text-xs flex items-start justify-between gap-3
                    ${selectedComm?._id === comm._id ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : ''}
                  `}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0 ${
                        comm.channel === 'email' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : comm.channel === 'phone_call'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {comm.channel.replace(/_/g, ' ')}
                      </span>
                      <p className="font-bold text-slate-900 truncate">{comm.subject || 'Customer Enquiry'}</p>
                    </div>

                    <p className="text-slate-600 line-clamp-2 text-xs">
                      {comm.messageBody}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      <span className="font-medium text-slate-500 truncate">{comm.sender?.name || comm.recipient?.name || 'Customer'}</span>
                      <span>•</span>
                      <span>{new Date(comm.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {comm.phoneCallDetails?.outcome && (
                    <span className="shrink-0 text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 capitalize">
                      {comm.phoneCallDetails.outcome.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Communication Detail & Action Pane (col-span-4) */}
        <div className={`col-span-12 lg:col-span-4 flex flex-col bg-white ${selectedComm ? 'flex' : 'hidden lg:flex'}`}>
          {selectedComm ? (
            <div className="p-5 flex flex-col h-full justify-between space-y-4 overflow-y-auto crm-scrollbar max-h-[640px]">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase mb-1.5 ${
                      selectedComm.channel === 'email' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : selectedComm.channel === 'phone_call'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {selectedComm.channel.replace(/_/g, ' ')} ({selectedComm.direction || 'inbound'})
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm">{selectedComm.subject}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Logged {new Date(selectedComm.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedComm(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 lg:hidden"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Sender & Recipient Box */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Contact / Party:</span>
                    <span className="font-bold text-slate-900">
                      {selectedComm.recipient?.name || selectedComm.sender?.name || 'Customer'}
                    </span>
                  </div>
                  {(selectedComm.recipient?.email || selectedComm.sender?.email) && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Email:</span>
                      <span className="text-slate-700 font-mono text-[11px]">
                        {selectedComm.recipient?.email || selectedComm.sender?.email}
                      </span>
                    </div>
                  )}
                  {selectedComm.phoneCallDetails && (
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-semibold">Call Outcome:</span>
                      <span className="font-bold text-blue-700 capitalize">
                        {selectedComm.phoneCallDetails.outcome?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Body Box */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Message Content & Dialogue
                  </label>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedComm.messageBody}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setComposeData({
                      templateId: '',
                      channel: selectedComm.channel === 'phone_call' ? 'email' : selectedComm.channel,
                      direction: 'outbound',
                      recipientName: selectedComm.recipient?.name || selectedComm.sender?.name || '',
                      recipientEmailOrPhone: selectedComm.recipient?.email || selectedComm.sender?.email || '',
                      subject: `Re: ${selectedComm.subject}`,
                      messageBody: '',
                      createFollowUp: true,
                      followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
                    });
                    setIsComposeModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Reply size={14} /> Send Reply with Template
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center my-auto text-slate-400">
              <MessageSquare className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-xs font-bold text-slate-600">Select a Communication</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Click any message, call log, or email on the left to inspect details, dispatch a templated reply, or schedule a follow-up.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message with Template Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto crm-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Compose & Dispatch Communication</h3>
                <p className="text-xs text-slate-400">Select an approved standard template or write a custom message</p>
              </div>
              <button onClick={() => setIsComposeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4 text-xs">
              {/* Template Picker */}
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <label className="block font-bold text-blue-900 mb-1">Select Reusable Standard Template (Section 7)</label>
                <select
                  value={composeData.templateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="">-- Choose Standard Template or Start Blank --</option>
                  {EMAIL_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Communication Channel *</label>
                  <select
                    value={composeData.channel}
                    onChange={(e) => setComposeData({ ...composeData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="email">Official Business Email</option>
                    <option value="whatsapp">Approved WhatsApp Message</option>
                    <option value="phone_call">Phone Callback Record</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Collector / Winery Host"
                    value={composeData.recipientName}
                    onChange={(e) => setComposeData({ ...composeData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {composeData.channel === 'whatsapp' ? 'Phone Number (+27...)' : 'Email Address'}
                </label>
                <input
                  type="text"
                  placeholder={composeData.channel === 'whatsapp' ? '+27 82 123 4567' : 'buyer@domain.com'}
                  value={composeData.recipientEmailOrPhone}
                  onChange={(e) => setComposeData({ ...composeData, recipientEmailOrPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Header *</label>
                <input
                  type="text"
                  required
                  placeholder="Subject line..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Write message content here..."
                  value={composeData.messageBody}
                  onChange={(e) => setComposeData({ ...composeData, messageBody: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Schedule Follow-up */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={composeData.createFollowUp}
                    onChange={(e) => setComposeData({ ...composeData, createFollowUp: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Create Follow-up Task in Queue if no response</span>
                </label>

                {composeData.createFollowUp && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Follow-up Due Date</label>
                    <input
                      type="datetime-local"
                      value={composeData.followUpDate}
                      onChange={(e) => setComposeData({ ...composeData, followUpDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  <Send size={13} /> {submitting ? 'Sending...' : 'Send & Record to CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Phone Call Modal */}
      {isLogCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Log Outbound / Inbound Call</h3>
              <button onClick={() => setIsLogCallModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogCallSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe / Rust en Vrede Estate"
                  value={callData.recipient}
                  onChange={(e) => setCallData({ ...callData, recipient: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Call Outcome *</label>
                <select
                  value={callData.outcome}
                  onChange={(e) => setCallData({ ...callData, outcome: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="reached_and_discussed">Reached & Discussed Requirements</option>
                  <option value="left_voicemail">Left Voicemail</option>
                  <option value="no_answer">No Answer</option>
                  <option value="callback_scheduled">Callback Scheduled</option>
                  <option value="wrong_number">Wrong Number</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Call Notes / Discussion Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Discussed quotation for 50 cases of Cabernet Sauvignon..."
                  value={callData.notes}
                  onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={callData.createFollowUp}
                    onChange={(e) => setCallData({ ...callData, createFollowUp: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Create Follow-up Task in Queue</span>
                </label>
              </div>

              {callData.createFollowUp && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Follow-up Due Date</label>
                  <input
                    type="datetime-local"
                    value={callData.followUpDate}
                    onChange={(e) => setCallData({ ...callData, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogCallModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Call Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

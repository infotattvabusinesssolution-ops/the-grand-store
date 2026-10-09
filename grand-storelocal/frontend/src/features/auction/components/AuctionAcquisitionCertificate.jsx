import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Price from '../../../components/ui/Price';
import './AuctionAcquisitionCertificate.css';

export default function AuctionAcquisitionCertificate({ lot, user, bidderProfile }) {
  const lotNumber = lot.lotNumber || lot._id.slice(-6).toUpperCase();
  const reference = lot.gsReference || `GSC-${lot._id.slice(-6).toUpperCase()}`;

  return (
    <article className="gs-acquisition" aria-label="Certificate of acquisition">
      <div className="gs-acquisition__watermark" aria-hidden="true">
        <img src="/logo.png" alt="" />
        <span>THE GRAND STORE</span>
      </div>

      <header className="gs-acquisition__header">
        <img className="gs-acquisition__logo" src="/logo.png" alt="The Grand Store — Crafting Moments, Raising Spirits" />
        <div className="gs-acquisition__eyebrow">The auction collection</div>
      </header>

      <div className="gs-acquisition__heading">
        <h2>Certificate</h2>
        <p>of acquisition</p>
      </div>

      <div className="gs-acquisition__recipient">
        <p className="gs-acquisition__label">Proudly presented to</p>
        <p className="gs-acquisition__name">{user?.name || user?.legalFullName || 'Distinguished Patron'}</p>
        <p className="gs-acquisition__account">
          Registered Vault Patron Account #{bidderProfile?.bidderNumber || (user?._id || 'PATRON').slice(-6).toUpperCase()}
        </p>
      </div>

      <div className="gs-acquisition__proclamation">
        <p>In recognition of your successful bid and acquisition in The Grand Store Auction.</p>
        <p>Your passion for exceptional spirits and rare collections is truly appreciated.</p>
      </div>

      <div className="gs-acquisition__record">
        <div className="gs-acquisition__lot">
          <p className="gs-acquisition__label">Catalogue lot #{lotNumber}</p>
          <p className="gs-acquisition__lot-title">{lot.title}</p>
        </div>
        <div className="gs-acquisition__bid">
          <p className="gs-acquisition__label">Winning hammer bid</p>
          <p className="gs-acquisition__price"><Price amount={lot.winningBid} /></p>
        </div>
        <div className="gs-acquisition__authentication">
          <span>Authentication: The Grand Store Private Vault Provenance</span>
          <span className="gs-acquisition__trust"><ShieldCheck size={14} aria-hidden="true" /> CPA Section 45 Trust Secured</span>
        </div>
      </div>

      <div className="gs-acquisition__registry">
        <div>
          <p className="gs-acquisition__label">Date of issue</p>
          <p className="gs-acquisition__registry-value">
            {(lot.endDate ? new Date(lot.endDate) : new Date()).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="gs-acquisition__label">Certificate reference</p>
          <p className="gs-acquisition__registry-value">{reference}</p>
        </div>
      </div>

      <footer className="gs-acquisition__footer">
        <div className="gs-acquisition__seal" aria-hidden="true"><ShieldCheck size={24} strokeWidth={1.25} /></div>
        <p className="gs-acquisition__label">Certified provenance</p>
        <p className="gs-acquisition__cheers">Cheers to Great Choices!</p>
        <p className="gs-acquisition__archive">The Grand Store <span>·</span> Vault Archive</p>
      </footer>
    </article>
  );
}

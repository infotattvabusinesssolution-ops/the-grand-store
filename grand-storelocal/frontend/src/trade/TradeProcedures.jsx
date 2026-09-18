import React from 'react'
import './TradeProcedures.css'

export default function TradeProcedures() {
  const documents = [
    {
      document: "Export Permit",
      purpose: "An export permit is required from the South African Wine and Spirit Board (WSB) to export wine from South Africa. The permit must be obtained before exporting wine and must be displayed on the shipment.",
      authority: "South African Wine and Spirit Board (WSB)"
    },
    {
      document: "Health Certificate",
      purpose: "A health certificate is required to ensure that the wine is free from harmful contaminants and meets health and safety standards. The health certificate is issued by the DAFF.",
      authority: "Department of Agriculture, Forestry, and Fisheries (DAFF)"
    },
    {
      document: "Invoice",
      purpose: "A commercial invoice is required to accompany each shipment and must include detailed information about the wine, including the variety, vintage, and alcohol content. The invoice must also include the names and addresses of the seller, buyer, and consignee.",
      authority: "Exporting Company"
    },
    {
      document: "Bill of Lading",
      purpose: "A bill of lading is a shipping document that serves as a receipt for the wine and a contract for the transportation of the wine. It must include detailed information about the shipment, including the number of bottles, the weight and volume, and the shipping route.",
      authority: "Shipping Company"
    },
    {
      document: "Phytosanitary Certificate",
      purpose: "A phytosanitary certificate is required to certify that the wine has been produced and processed in accordance with the international phytosanitary standards.",
      authority: "DAFF"
    },
    {
      document: "Certificate of Origin",
      purpose: "A certificate of origin is required to confirm that the wine was produced in South Africa and meets the origin requirements for the importing country.",
      authority: "Chamber of Commerce"
    },
    {
      document: "Label Approval",
      purpose: "In some countries, approval of the label design and packaging is required before exporting wine. This approval must be obtained from the relevant government agency in the importing country.",
      authority: "Relevant Government Agency"
    },
    {
      document: "Customs Declaration",
      purpose: "A customs declaration must be submitted to the customs authorities in both the exporting and importing countries. The declaration must include detailed information about the wine, including value, weight, and volume.",
      authority: "Customs Authorities"
    }
  ]

  return (
    <main className="trade-subpage trade-procedures">
      <div className="shell">
        <div className="procedures-header">
          <span className="trade-sub-eyebrow">Trade Procedures</span>
          <h1 className="trade-sub-title">Your Guide to <span className="trade-script-accent">Hassle-Free Wine Export Logistics</span></h1>
          <p className="procedures-intro">
            I would like to take this opportunity to explain to you our company's process for wine exports. We understand that the logistics involved in exporting wine can be complex and require specialized expertise to ensure a smooth and efficient process. To ensure that our exports are handled with the utmost care and professionalism, we have partnered with a specialized logistic company that provides a comprehensive A to Z service for wine exports.
          </p>
          <p className="procedures-intro">
            This means that from the moment the wine leaves our facility until it reaches its final destination, the logistics company takes care of everything. The logistics company is well-equipped to handle all aspects of the export process, including packaging, documentation, customs clearance, transportation, and delivery. Their team of experts is experienced in dealing with the unique requirements and regulations of wine exports, ensuring that all necessary procedures are followed and all documentation is in order.
          </p>
          <p className="procedures-intro">
            By using this specialized logistic company, we can offer our customers a seamless export process, with the peace of mind that their wine is being handled by professionals who are dedicated to ensuring the safe and timely delivery of the products. We hope that this explanation has provided you with a clear understanding of our export process and the measures we take to ensure that your wine arrives at its destination in perfect condition.
          </p>
        </div>

        <div className="procedures-table-wrapper">
          <h3 className="procedures-table-title">Required Export Documentation</h3>
          <p className="procedures-table-desc">When exporting wine from South Africa, the following documents and procedures are typically required:</p>
          
          <div className="procedures-table">
            <div className="procedures-table-header">
              <div className="pt-col-doc">Document</div>
              <div className="pt-col-purp">Purpose</div>
              <div className="pt-col-auth">Issuing Authority</div>
            </div>
            {documents.map((row, idx) => (
              <div className="procedures-table-row" key={idx}>
                <div className="pt-col-doc" data-label="Document">{row.document}</div>
                <div className="pt-col-purp" data-label="Purpose">{row.purpose}</div>
                <div className="pt-col-auth" data-label="Issuing Authority">{row.authority}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

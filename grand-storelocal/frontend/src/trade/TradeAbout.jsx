import React from 'react'
import './TradeAbout.css'

export default function TradeAbout() {
  return (
    <main className="trade-subpage trade-about">
      <div className="shell trade-about-container">
        <div className="trade-about-image">
          <div className="image-frame-gold">
            <img src="/assets/trade/About_us.png" alt="About Grand Store Trade" />
          </div>
        </div>
        <div className="trade-about-content">
          <span className="trade-sub-eyebrow">About Us</span>
          <h1 className="trade-sub-title">Your Trusted Partner in <span className="trade-script-accent">Premium Wine and Liquor Trading</span></h1>
          
          <div className="trade-about-text">
            <p>Welcome to our about us page, where we showcase our passion for the wine and liquor trade industry. Our story begins with a team of experienced and knowledgeable professionals who saw a need for a reliable and efficient platform to trade in high-quality wines and liquors. We came together with a shared vision to create a one-stop-shop for all your wine and liquor needs.</p>
            
            <p>Our journey started with extensive research into the industry, including the latest trends, consumer demands, and market dynamics. Our team has identified the finest wineries and distilleries, to handpick the best products for our customers. Our focus on quality and variety has resulted in a comprehensive selection of products, including popular and rare spirits, wine, and other alcoholic beverages.</p>
            
            <div className="trade-highlight-box">
              <p>At our wine and liquor trading website, we are dedicated to providing our customers with the best possible experience. We understand the importance of convenience and accessibility, and that's why we've made our online platform easy to navigate and use. Our team is always available to provide expert advice and support, ensuring that you have access to the resources you need to grow and succeed in your business.</p>
              
              <p>We believe in the power of collaboration and partnerships, and that's why we have developed relationships with some of the finest producers and suppliers in the industry. Our partnerships ensure that we have access to a diverse range of high-quality products and services, which we pass on to our customers.</p>
            </div>
            
            <p className="trade-closing-statement">
              Our journey in the wine and liquor trade industry has been a passion project from the beginning to the end. We are committed to providing our customers with the best products, services, and support to help them succeed in their business.
              <br /><br />
              <strong>Choose us as your partner in the wine and liquor trade.</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

import { useState } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { submitWineEnquiry } from '../api'
import './EnquireForm.css'

export default function EnquireForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)

    try {
      const data = await submitWineEnquiry({
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        website: formData.website,
        product: {
          name: 'Millionaires Collection — 2021 Limited Edition',
          expression: 'The 2021 Limited Edition',
        },
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Unable to submit your enquiry. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      website: '',
    })
    setError('')
  }

  return (
    <section className="enquire-section" id="enquire">
      <div className="shell enquire-layout">
        <div className="enquire-copy" data-reveal>
          <p className="eyebrow">A private conversation</p>
          <h2 className="section-title">Enquire <em>now.</em></h2>
          <p>For availability, private occasions, partnerships, or more about the 2021 limited edition, leave your details with our collection team.</p>
        </div>

        <div className="enquire-form-card" data-reveal>
          {result ? (
            <div className="enquire-success">
              <CheckCircle2 size={38} className="enquire-success-icon" />
              <h3>Thank you for your enquiry.</h3>
              {result.reference && (
                <div className="enquire-ref-badge">
                  <span>Reference</span>
                  <strong>{result.reference}</strong>
                </div>
              )}
              <p>Our collection team will review your request and be in touch shortly.</p>
              {result.acknowledgementSent && (
                <p className="enquire-ack-note">An acknowledgement has been sent to {formData.email}.</p>
              )}
              <button type="button" onClick={handleReset} className="enquire-reset-btn">
                Submit another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              {/* Bot trap honeypot */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {error && (
                <div className="enquire-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <label>
                <span>Your name</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                  disabled={loading}
                />
              </label>

              <label>
                <span>Email address</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  required
                  disabled={loading}
                />
              </label>

              <label>
                <span>Phone number</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                  disabled={loading}
                />
              </label>

              <label>
                <span>Occasion / Notes (Optional)</span>
                <input
                  type="text"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Private dinner, gala, or request"
                  disabled={loading}
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span>Submitting enquiry…</span>
                    <Loader2 size={17} className="animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Submit enquiry</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
      <img className="enquire-bottle" src="/assets/footer-bottle.png" alt="" aria-hidden="true" loading="lazy" decoding="async" />
    </section>
  )
}

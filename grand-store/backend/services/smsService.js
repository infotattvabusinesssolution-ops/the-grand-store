const axios = require('axios');
const { parsePhoneNumberFromString } = require('libphonenumber-js/min');

/**
 * Normalizes phone number into strict E.164 format (+27821234567, +919876543210, etc.)
 */
function normalizeToE164(phone) {
  if (!phone) return null;
  const raw = String(phone).trim().replace(/[^\d+]/g, '');

  // Try parsing with libphonenumber-js
  const parsed = parsePhoneNumberFromString(raw.startsWith('+') ? raw : `+${raw}`);
  if (parsed && parsed.isValid()) {
    return parsed.number; // E.164 format with leading +
  }

  // Fallback heuristics: South Africa 10-digit 082... -> +2782...
  if (raw.startsWith('0') && raw.length === 10) {
    return `+27${raw.slice(1)}`;
  }
  if (!raw.startsWith('+')) {
    return `+${raw}`;
  }
  return raw;
}

/**
 * Sends a real SMS using the best configured SMS provider in backend/.env
 * Supported providers:
 * 1. Twilio (Global - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 * 2. BulkSMS (South Africa / Global - BULKSMS_TOKEN_ID, BULKSMS_TOKEN_SECRET)
 * 3. Fast2SMS (India - FAST2SMS_API_KEY)
 * 4. Africa's Talking (Africa - AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY)
 * 5. Generic HTTP Webhook (SMS_GATEWAY_URL, SMS_API_KEY)
 *
 * @param {Object} options
 * @param {string} options.to - Destination phone number in international format
 * @param {string} options.otp - 6-digit verification code
 * @param {string} [options.brandName] - Optional store brand name
 * @returns {Promise<{ success: boolean, provider?: string, messageId?: string, error?: string }>}
 */
async function sendVerificationSms({ to, otp, brandName = 'The Grand Store' }) {
  const e164Phone = normalizeToE164(to);
  if (!e164Phone) {
    throw new Error(`Invalid destination phone number: ${to}`);
  }

  const messageText = `${brandName}: Your verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

  // =========================================================================
  // PROVIDER 1: TWILIO (Global Gold Standard)
  // =========================================================================
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN.trim();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim() || process.env.TWILIO_FROM?.trim();
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

    if (!fromNumber && !messagingServiceSid) {
      console.warn('[SMS SERVICE] Twilio credentials present but missing TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID in .env');
    } else {
      try {
        console.log(`[SMS SERVICE] Dispatching real SMS via Twilio to ${e164Phone}...`);
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

        const params = new URLSearchParams();
        params.append('To', e164Phone);
        params.append('Body', messageText);

        if (messagingServiceSid) {
          params.append('MessagingServiceSid', messagingServiceSid);
        } else {
          params.append('From', fromNumber);
        }

        const twilioRes = await axios.post(url, params.toString(), {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        });

        console.log(`[SMS SERVICE] ✅ Twilio SMS successfully dispatched! SID: ${twilioRes.data?.sid}, Status: ${twilioRes.data?.status}`);
        return {
          success: true,
          provider: 'twilio',
          messageId: twilioRes.data?.sid,
          status: twilioRes.data?.status,
        };
      } catch (err) {
        const errorDetail = err.response?.data?.message || err.message;
        console.error(`[SMS SERVICE] ❌ Twilio SMS delivery error (${err.response?.status}):`, errorDetail);
        // Fall through to next provider if available
      }
    }
  }

  // =========================================================================
  // PROVIDER 2: BULKSMS (South Africa Leading Gateway)
  // =========================================================================
  if (process.env.BULKSMS_TOKEN_ID && process.env.BULKSMS_TOKEN_SECRET) {
    try {
      console.log(`[SMS SERVICE] Dispatching real SMS via BulkSMS to ${e164Phone}...`);
      const bulkRes = await axios.post(
        'https://api.bulksms.com/v1/messages',
        {
          to: e164Phone.replace(/^\+/, ''),
          body: messageText,
        },
        {
          auth: {
            username: process.env.BULKSMS_TOKEN_ID.trim(),
            password: process.env.BULKSMS_TOKEN_SECRET.trim(),
          },
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const msgData = Array.isArray(bulkRes.data) ? bulkRes.data[0] : bulkRes.data;
      console.log(`[SMS SERVICE] ✅ BulkSMS successfully dispatched! ID: ${msgData?.id}, Status: ${msgData?.status?.type}`);
      return {
        success: true,
        provider: 'bulksms',
        messageId: msgData?.id,
        status: msgData?.status?.type,
      };
    } catch (err) {
      console.error('[SMS SERVICE] ❌ BulkSMS delivery error:', err.response?.data || err.message);
    }
  }

  // =========================================================================
  // PROVIDER 3: FAST2SMS (India +91 Numbers)
  // =========================================================================
  if (process.env.FAST2SMS_API_KEY && e164Phone.startsWith('+91')) {
    try {
      const indianNumber = e164Phone.replace(/^\+91/, '');
      console.log(`[SMS SERVICE] Dispatching real SMS via Fast2SMS to +91 ${indianNumber}...`);

      const fastRes = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'otp',
          variables_values: otp,
          numbers: indianNumber,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY.trim(),
          },
          timeout: 10000,
        }
      );

      if (fastRes.data?.return) {
        console.log(`[SMS SERVICE] ✅ Fast2SMS successfully dispatched! Request ID: ${fastRes.data?.request_id}`);
        return {
          success: true,
          provider: 'fast2sms',
          messageId: fastRes.data?.request_id,
        };
      }
      console.warn('[SMS SERVICE] Fast2SMS returned non-success:', fastRes.data);
    } catch (err) {
      console.error('[SMS SERVICE] ❌ Fast2SMS delivery error:', err.response?.data || err.message);
    }
  }

  // =========================================================================
  // PROVIDER 4: AFRICA'S TALKING (African Continent)
  // =========================================================================
  if (process.env.AFRICASTALKING_USERNAME && process.env.AFRICASTALKING_API_KEY) {
    try {
      console.log(`[SMS SERVICE] Dispatching real SMS via Africa's Talking to ${e164Phone}...`);
      const params = new URLSearchParams();
      params.append('username', process.env.AFRICASTALKING_USERNAME.trim());
      params.append('to', e164Phone);
      params.append('message', messageText);
      if (process.env.AFRICASTALKING_SENDER_ID) {
        params.append('from', process.env.AFRICASTALKING_SENDER_ID.trim());
      }

      const atRes = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        params.toString(),
        {
          headers: {
            apiKey: process.env.AFRICASTALKING_API_KEY.trim(),
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );

      const recipientInfo = atRes.data?.SMSMessageData?.Recipients?.[0];
      console.log(`[SMS SERVICE] ✅ Africa's Talking dispatched! Status: ${recipientInfo?.status}`);
      return {
        success: true,
        provider: 'africastalking',
        messageId: recipientInfo?.messageId,
        status: recipientInfo?.status,
      };
    } catch (err) {
      console.error('[SMS SERVICE] ❌ Africa\'s Talking delivery error:', err.response?.data || err.message);
    }
  }

  // =========================================================================
  // PROVIDER 5: GENERIC HTTP SMS GATEWAY
  // =========================================================================
  if (process.env.SMS_GATEWAY_URL) {
    try {
      console.log(`[SMS SERVICE] Dispatching real SMS via generic HTTP gateway to ${e164Phone}...`);
      const customRes = await axios.post(
        process.env.SMS_GATEWAY_URL.trim(),
        {
          to: e164Phone,
          message: messageText,
          otp,
        },
        {
          headers: {
            Authorization: process.env.SMS_API_KEY ? `Bearer ${process.env.SMS_API_KEY.trim()}` : undefined,
          },
          timeout: 10000,
        }
      );

      return {
        success: true,
        provider: 'custom_gateway',
        messageId: customRes.data?.id || customRes.data?.messageId,
      };
    } catch (err) {
      console.error('[SMS SERVICE] ❌ Custom SMS gateway error:', err.response?.data || err.message);
    }
  }

  // =========================================================================
  // FALLBACK: NO ACTIVE SMS GATEWAY CONFIGURED IN .env
  // =========================================================================
  console.warn(
    `[SMS SERVICE] ⚠️ No SMS provider credentials configured in backend/.env for ${e164Phone}.\n` +
    `To enable physical cellular carrier SMS delivery, add one of the following to backend/.env:\n` +
    `  • Twilio: TWILIO_ACCOUNT_SID=... & TWILIO_AUTH_TOKEN=... & TWILIO_PHONE_NUMBER=...\n` +
    `  • BulkSMS: BULKSMS_TOKEN_ID=... & BULKSMS_TOKEN_SECRET=...\n` +
    `  • Africa's Talking: AFRICASTALKING_USERNAME=... & AFRICASTALKING_API_KEY=...\n` +
    `  • Fast2SMS (India): FAST2SMS_API_KEY=...\n` +
    `  • Custom Gateway: SMS_GATEWAY_URL=...`
  );

  return {
    success: false,
    provider: 'none',
    warning: 'No SMS provider configured in backend/.env',
  };
}

module.exports = {
  sendVerificationSms,
  normalizeToE164,
};

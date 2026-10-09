import React, { useEffect, useRef } from 'react';

const PaymentForm = ({ paymentData, payfastUrl }) => {
  const formRef = useRef(null);

  useEffect(() => {
    if (paymentData && payfastUrl && formRef.current) {
      // Automatically submit the form to PayFast once data is populated
      formRef.current.submit();
    }
  }, [paymentData, payfastUrl]);

  if (!paymentData || !payfastUrl) {
    return null;
  }

  return (
    <div style={{ display: 'none' }}>
      <form ref={formRef} action={payfastUrl} method="POST">
        {Object.entries(paymentData).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button type="submit">Pay Now</button>
      </form>
      <div className="text-center mt-4">
        <p>Redirecting to secure PayFast checkout...</p>
      </div>
    </div>
  );
};

export default PaymentForm;

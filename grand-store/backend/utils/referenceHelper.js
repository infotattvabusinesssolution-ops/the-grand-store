/**
 * Reference Helper Utilities for The Grand Store
 * Ensures clean, short, standardized payment references compatible with all South African banks
 */

/**
 * Returns a short, user-friendly deposit reference (strictly <= 10 characters)
 * e.g. "GS-001039" or "GS-5CCC032"
 * Compatible with FNB, Capitec (max 16 chars), Nedbank (max 18 chars), Standard Bank, and ABSA.
 *
 * @param {Object} order - Order document or object
 * @returns {string} Clean deposit reference
 */
function getOrderDepositReference(order) {
  if (!order) return 'GS-ORDER';

  // 1. Direct field if stored
  if (order.depositReference && typeof order.depositReference === 'string' && order.depositReference.trim()) {
    return order.depositReference.trim().toUpperCase();
  }

  // 2. Extract sequence from orderId (e.g., GS-26-SHP-ORD-000042 -> GS-000042)
  if (order.orderId && typeof order.orderId === 'string') {
    const match = order.orderId.match(/(\d{5,8})$/);
    if (match) {
      return `GS-${match[1]}`;
    }
  }

  // 3. Extract sequence from invoiceNumber (e.g., GS-26-SHP-INV-000042 -> GS-000042)
  if (order.invoiceNumber && typeof order.invoiceNumber === 'string') {
    const match = order.invoiceNumber.match(/(\d{5,8})$/);
    if (match) {
      return `GS-${match[1]}`;
    }
  }

  // 4. Fallback to last 6 hex characters of MongoDB _id (e.g., 6abc19b5ae525697f5ccc032 -> GS-5CCC032)
  const idStr = String(order._id || order.id || '');
  if (idStr.length >= 6) {
    return `GS-${idStr.slice(-6).toUpperCase()}`;
  }

  return idStr ? `GS-${idStr.toUpperCase()}` : 'GS-ORDER';
}

module.exports = {
  getOrderDepositReference
};

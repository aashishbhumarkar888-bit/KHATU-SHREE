import { Order } from '../types';

/**
 * Generates a clean, professionally formatted plain-text tax invoice report
 * for Khatu Shyam Products orders.
 */
export const generateInvoiceTextReport = (order: Order): string => {
  const invoiceNumber = `INV-2026-${order.id.slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const divider = '='.repeat(82);
  const singleDivider = '-'.repeat(82);

  const statusLabels: Record<string, string> = {
    placed: 'ORDER PLACED / CONFIRMED AT GAUSHALA',
    processing: 'PROCESSING / CHILLED TO 4°C AT SEHORE HUB',
    out_for_delivery: 'OUT FOR DELIVERY / ON THE ROAD IN BHOPAL CHILLED FLEET',
    shipped: 'SHIPPED / IN TRANSIT WITH COURIER PARTNER',
    delivered: 'DELIVERED / HANDED DIRECTLY TO RESIDENT',
    cancelled: 'CANCELLED / ORDER VOIDED'
  };
  const statusLabel = statusLabels[order.status] || order.status.toUpperCase();

  const lines: string[] = [
    divider,
    '                             KHATU SHRI',
    '         Dropshipping, Direct Wholesale & Farm Essentials Marketplace',
    '       Central Processing & Logistics Hub, Sehore-Bhopal Highway',
    '                     Bhopal, Madhya Pradesh - 462016',
    '         FSSAI Lic No: 21424010000892  |  GSTIN: 23AABCK9412M1Z8',
    '            Customer Care: support@khatushri.in | +91 755 2420000',
    divider,
    '                           OFFICIAL TAX INVOICE & RECEIPT',
    divider,
    '',
    `Invoice Number:       ${invoiceNumber}`,
    `Order Reference ID:   ${order.id}`,
    `Order Date:           ${orderDate}`,
    `Current Order Status: ${statusLabel}`,
    `Payment Method:       ${order.paymentMethod} (Verified Online/Doorstep)`,
    `Delivery Time Slot:   ${order.deliverySlot}`,
    order.trackingNumber ? `Consignment Number:   ${order.trackingNumber}` : '',
    '',
    'CUSTOMER & DELIVERY ADDRESS (BHOPAL, MADHYA PRADESH):',
    singleDivider,
    `Customer Name:        ${order.customerName}`,
    `Mobile Phone:         ${order.customerPhone}`,
    `Email Address:        ${order.customerEmail}`,
    `Delivery Address:     ${order.shippingAddress.houseFlat}, ${order.shippingAddress.streetColony}`,
    `City / Pincode:       ${order.shippingAddress.bhopalArea} - ${order.shippingAddress.pincode}`,
    `Delivery Instructions: ${order.deliveryInstructions || 'Standard doorstep delivery in designated milk basket.'}`,
    '',
    'PURCHASED ITEMS & PRODUCT SPECIFICATIONS:',
    singleDivider,
    'No.  Item Description                       Variant            Qty   Unit Price    Total',
    singleDivider,
  ].filter(Boolean);

  order.items.forEach((item, index) => {
    const itemNum = String(index + 1).padEnd(5);
    const name = item.productName.length > 36 ? item.productName.slice(0, 33) + '...' : item.productName.padEnd(36);
    const variant = item.variantName.length > 18 ? item.variantName.slice(0, 16) + '..' : item.variantName.padEnd(18);
    const qty = String(item.quantity).padEnd(6);
    const price = `₹${item.price.toFixed(2)}`.padEnd(13);
    const total = `₹${(item.price * item.quantity).toFixed(2)}`;
    lines.push(`${itemNum}${name} ${variant} ${qty}${price}${total}`);
  });

  lines.push(
    singleDivider,
    '',
    'PRICE BREAKDOWN & TAX SUMMARY:',
    singleDivider,
    `Items Subtotal:                                                        ₹${order.subtotal.toFixed(2).padStart(8)}`,
    `Delivery & Cold-Chain Logistics:                                        ${order.deliveryCharge === 0 ? 'FREE (₹0.00)' : `₹${order.deliveryCharge.toFixed(2)}`}`,
    order.discount > 0 ? `Special Promotional Discount:                                         -₹${order.discount.toFixed(2).padStart(8)}` : '',
    singleDivider,
    `TOTAL INVOICE AMOUNT (INR):                                            ₹${order.total.toFixed(2).padStart(8)}`,
    divider,
    '',
    'BHOPAL COLD-CHAIN & QUALITY GUARANTEE:',
    '1. 100% Pure A2 Gir Cow Milk & Vedic Bilona Churned Ghee certified pure.',
    '2. 0% Synthetic Hormones, 0% Chemical Preservatives, 0% Added Adulterants.',
    '3. Strict Cold-Chain maintained at 4°C from Gaushala chilling tanks to doorstep.',
    '4. Packaging inspected and batch seal verified before refrigerated van dispatch.',
    '',
    'CUSTOMER SUPPORT & REORDERS:',
    'Website: https://khatushri.in',
    'Customer Care WhatsApp: +91 98260 77123 | Email: care@khatushri.in',
    'Logistics Hub: Khatu Shri Dispatch Center, Sehore-Bhopal Bypass Road, MP',
    '',
    '====================== End of Tax Invoice & Purchase Report ======================'
  );

  return lines.filter(line => line !== '').join('\n');
};

/**
 * Triggers the browser download of the plain text report file
 */
export const downloadInvoiceReport = (order: Order) => {
  try {
    const textContent = generateInvoiceTextReport(order);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download invoice report:', err);
    return false;
  }
};

/**
 * Formats a ticket number with leading zeros based on the total number of tickets.
 * e.g. formatTicketNumber(1, 10000) => "00001"
 */
export function formatTicketNumber(number: number, total: number): string {
  const digits = String(total - 1).length;
  return String(number).padStart(digits, "0");
}

/** Bulk discount tiers — percentages fixed regardless of ticket price. */
export const DISCOUNT_TIERS = [
  { count: 1,  discountPct: 0    },
  { count: 2,  discountPct: 15   },
  { count: 5,  discountPct: 20   },
  { count: 10, discountPct: 20   },
  { count: 20, discountPct: 37.5 },
] as const;

/** Returns the best applicable discount % for a given ticket count. */
export function getDiscountPct(count: number): number {
  const applicable = [...DISCOUNT_TIERS].filter((t) => count >= t.count);
  return applicable.length > 0 ? applicable[applicable.length - 1].discountPct : 0;
}

/** Calculates the discounted total for `count` tickets at `precioBoleto` each. */
export function calcBulkTotal(count: number, precioBoleto: number): number {
  return count * precioBoleto * (1 - getDiscountPct(count) / 100);
}

/**
 * Generates a WhatsApp link with a predefined message.
 */
export function buildWhatsAppLink(
  whatsapp: string,
  raffleName: string,
  tickets: string[],
  participantName: string,
  precioBoleto: number
): string {
  const ticketList = tickets.join(", ");
  const total = calcBulkTotal(tickets.length, precioBoleto).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
  const discountPct = getDiscountPct(tickets.length);
  const discountNote = discountPct > 0 ? ` (con ${discountPct}% de descuento por volumen)` : "";
  const message = encodeURIComponent(
    `Hola! Soy ${participantName} y quiero apartar los números: ${ticketList} para el sorteo "${raffleName}". Total a pagar: ${total}${discountNote}.`
  );
  const phone = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${message}`;
}

/**
 * Formats a ticket number with leading zeros based on the total number of tickets.
 * e.g. formatTicketNumber(1, 10000) => "00001"
 */
export function formatTicketNumber(number: number, total: number): string {
  const digits = String(total - 1).length;
  return String(number).padStart(digits, "0");
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
  const total = (tickets.length * precioBoleto).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
  const message = encodeURIComponent(
    `Hola! Soy ${participantName} y quiero apartar los números: ${ticketList} para el sorteo "${raffleName}". Total a pagar: ${total}.`
  );
  const phone = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${message}`;
}

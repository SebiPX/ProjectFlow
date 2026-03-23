import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../lib/utils'; // Assuming utilities exist, or I'll implement locally
import type { FinancialDocument, FinancialItem } from '../types/supabase';

// Helper for currency if not exists
const formatEUR = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

// Add jsPDF augmentation for autotable
declare module 'jspdf' {
    interface jsPDF {
        authTable: (options: any) => jsPDF;
    }
}

export const generateInvoicePDF = (
    doc: FinancialDocument,
    items: FinancialItem[],
    client: any // Typed as any to avoid strict dependency loop or complex types for now
) => {
    const pdf = new jsPDF();

    // -- HEADER --
    pdf.setFontSize(20);
    pdf.text('PX-Flow', 14, 22);

    pdf.setFontSize(10);
    pdf.text('Pixelschickeria', 14, 30);
    pdf.text('Musterstraße 123', 14, 35);
    pdf.text('12345 Berlin', 14, 40);

    // -- RECEIVER --
    if (client) {
        pdf.setFontSize(11);
        pdf.text(client.company_name || 'Client Name', 14, 60);
        pdf.text(client.address_line1 || '', 14, 65);
        pdf.text(`${client.zip_code || ''} ${client.city || ''}`, 14, 70);
    }

    // -- INFO BLOCK --
    const title = doc.type === 'invoice' ? 'Rechnung' : 'Kostenvoranschlag';

    pdf.setFontSize(16);
    pdf.text(`${title} ${doc.document_number || 'DRAFT'}`, 120, 22);

    pdf.setFontSize(10);
    pdf.text(`Datum: ${doc.date_issued || new Date().toLocaleDateString()}`, 120, 30);
    if (doc.due_date) {
        pdf.text(`Fällig am: ${doc.due_date}`, 120, 35);
    }

    // -- TABLE --
    const tableColumn = ["Pos", "Beschreibung", "Menge", "Einzelpreis", "Gesamt"];
    const tableRows = items.map((item, index) => [
        index + 1,
        item.position_title,
        item.quantity,
        formatEUR(item.unit_price),
        formatEUR(item.total_price || 0)
    ]);

    // @ts-ignore - autotable typing is tricky without full types
    autoTable(pdf, {
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
    });

    // -- TOTALS --
    // @ts-ignore
    const finalY = pdf.lastAutoTable.finalY + 10;

    pdf.text(`Netto: ${formatEUR(doc.total_net || 0)}`, 140, finalY);
    pdf.text(`MwSt (${doc.vat_percent}%): ${formatEUR((doc.total_gross || 0) - (doc.total_net || 0))}`, 140, finalY + 5);
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Gesamtbetrag: ${formatEUR(doc.total_gross || 0)}`, 140, finalY + 12);

    // -- FOOTER --
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(8);
    pdf.text('Vielen Dank für Ihren Auftrag!', 14, finalY + 30);
    pdf.text('Bitte überweisen Sie den Betrag innerhalb von 14 Tagen.', 14, finalY + 35);
    pdf.text('IBAN: DE12 3456 7890 1234 5678 90', 14, finalY + 40);

    // Save
    pdf.save(`${doc.type}_${doc.document_number || 'draft'}.pdf`);
};

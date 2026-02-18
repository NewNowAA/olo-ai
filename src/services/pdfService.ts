import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../types/invoice.types';
import { formatCurrency, formatDate } from '../utils/formatters';

export const pdfService = {
  generateInvoicePDF(invoice: Invoice, companyInfo?: { name: string; nif: string; address: string }) {
    const doc = new jsPDF();
    
    // --- Header ---
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text(companyInfo?.name || 'Sua Empresa', 14, 22);
    
    doc.setFontSize(10);
    doc.text(companyInfo?.address || 'Endereço da Empresa', 14, 28);
    doc.text(`NIF: ${companyInfo?.nif || '999999999'}`, 14, 33);

    // --- Invoice Details ---
    doc.setFontSize(12);
    doc.text('FATURA / RECIBO', 140, 22);
    
    doc.setFontSize(10);
    doc.text(`Nº: ${invoice.invoiceNumber || invoice.displayId || invoice.id}`, 140, 28);
    doc.text(`Data: ${formatDate(invoice.date)}`, 140, 33);
    
    // Client Info
    doc.text('Cliente:', 14, 50);
    doc.setFontSize(11);
    doc.text(invoice.client, 14, 56);
    doc.setFontSize(10);
    if (invoice.nif) doc.text(`NIF: ${invoice.nif}`, 14, 61);

    // --- Table ---
    const tableColumn = ["Descrição", "Qtd", "Preço Unit.", "IVA %", "Total"];
    const tableRows: any[] = [];

    invoice.items?.forEach(item => {
      const itemData = [
        item.name || item.description,
        item.quantity,
        formatCurrency(item.price, 'pt-AO', 'AOA'),
        `${item.vat || 0}%`,
        formatCurrency(item.price * item.quantity, 'pt-AO', 'AOA')
      ];
      tableRows.push(itemData);
    });

    // @ts-ignore
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [46, 139, 166] }, // #2e8ba6
      styles: { fontSize: 9 },
    });

    // --- Totals ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.text(`Total Líquido: ${formatCurrency(invoice.amount, 'pt-AO', 'AOA')}`, 140, finalY);
    // (Simplification: Assuming amount is Gross. Real calculation would split VAT)
    
    doc.setFontSize(12);
    doc.setTextColor(46, 139, 166);
    doc.text(`Total a Pagar: ${formatCurrency(invoice.amount, 'pt-AO', 'AOA')}`, 140, finalY + 10);

    // --- Footer (Compliance) ---
    doc.setTextColor(150);
    doc.setFontSize(8);
    
    // Hash (Simulated AGT Signature)
    if (invoice.hash) {
        doc.text(`Assinatura (Hash): ${invoice.hash.substring(0, 40)}...`, 14, 280);
        doc.text(`Processado por Programa Certificado nº 000/AGT/2026`, 14, 285);
    } else {
        doc.text(`Documento processado por computador.`, 14, 285);
    }

    doc.save(`Fatura_${invoice.invoiceNumber || invoice.id}.pdf`);
  }
};

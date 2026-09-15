import PDFDocument from 'pdfkit';

/**
 * Generate a Medical-Legal Packet PDF
 * @param {Object} caseInfo - Case details
 * @param {Array} documents - Array of document metadata
 * @returns {Promise<Buffer>} - Resolves with the PDF Buffer
 */
export const generateMasterPacket = (caseInfo, documents) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => reject(err));

      // Cover Page
      doc.fontSize(24).text('Master Medical-Legal Packet', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Case Information
      doc.fontSize(18).text('Case Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      
      const pName = caseInfo?.patient?.firstName ? `${caseInfo.patient.firstName} ${caseInfo.patient.lastName}` : (caseInfo?.patientName || 'Demo Patient 001');
      const caseNumber = caseInfo?.caseId || caseInfo?.id || 'CASE-001';
      
      doc.text(`Patient Name: ${pName}`);
      doc.text(`Case ID: ${caseNumber}`);
      if (caseInfo?.accidentDate) doc.text(`Accident Date: ${caseInfo.accidentDate}`);
      if (caseInfo?.accidentLocation) doc.text(`Location: ${caseInfo.accidentLocation}`);
      if (caseInfo?.mechanismOfInjury) doc.text(`Mechanism of Injury: ${caseInfo.mechanismOfInjury}`);
      
      doc.moveDown(2);

      // Document Summary
      doc.fontSize(18).text('Included Documents Summary', { underline: true });
      doc.moveDown(0.5);

      if (!documents || documents.length === 0) {
        doc.fontSize(12).text('No documents selected for this packet.', { italic: true });
      } else {
        documents.forEach((d, i) => {
          doc.fontSize(12).font('Helvetica-Bold').text(`${i + 1}. ${d.name || 'Unknown Document'}`);
          doc.font('Helvetica').text(`    Provider: ${d.providerName || 'N/A'}`);
          doc.text(`    Type: ${d.type || d.documentType || 'N/A'}`);
          doc.text(`    Date: ${d.date || 'N/A'}`);
          doc.moveDown(0.5);
        });
      }

      // Add a page break before actual documents (simulated)
      documents.forEach((d, i) => {
        doc.addPage();
        doc.fontSize(20).text(`Document ${i + 1}: ${d.name}`, { align: 'center' });
        doc.moveDown(2);
        doc.fontSize(14).text('--- This is a placeholder for the actual document content ---', { align: 'center', italic: true });
        doc.moveDown(1);
        doc.fontSize(12).text(`Provider: ${d.providerName}`, { align: 'center' });
        doc.text(`Type: ${d.type || d.documentType}`, { align: 'center' });
      });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

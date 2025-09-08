import jsPDF from "jspdf";
import autoTable from  'jspdf-autotable';

const getFontAsBinaryString = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const binaryString = new Uint8Array(arrayBuffer).reduce(
    (data, byte) => data + String.fromCharCode(byte),
    ''
  );
  return binaryString;
};

export const genPdf = async (items, patientInfo) => {
  try {
    const fontUrl = '/Poppins-Regular.ttf'; // Assumes the file is in the /public folder
    const poppinsFont = await getFontAsBinaryString(fontUrl);

    const doc = new jsPDF();

    doc.addFileToVFS('Poppins-Regular.ttf', poppinsFont);
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
    doc.setFont('Poppins'); 

    doc.setFontSize(20);
    doc.text("Your Patient codes", 14, 22);

    // 5. Add Patient Information (if available)
    const hasPatientInfo = patientInfo.name || patientInfo.email || patientInfo.phone;
    let startY = 30;

    if (hasPatientInfo) {
      doc.setFontSize(12);
      doc.text("Patient Information", 14, startY);
      startY += 8;

      doc.setFontSize(10);
      if (patientInfo.name) {
        doc.text(`Name: ${patientInfo.name}`, 14, startY);
        startY += 7;
      }
      if (patientInfo.email) {
        doc.text(`Email: ${patientInfo.email}`, 14, startY);
        startY += 7;
      }
      if (patientInfo.phone) {
        doc.text(`Phone: ${patientInfo.phone}`, 14, startY);
        startY += 7;
      }
      startY += 5;
    }

    // 6. Prepare data for the table
    const tableColumn = ["Title / Display", "ICD Code", "NAM Code"];
    const tableRows = items.map(item => [
      item.display || item.title || 'N/A',
      item.icd_code || 'N/A',
      item.nam_code || 'N/A',
    ]);

    // 7. Add the table using jspdf-autotable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        font: 'Poppins', // Ensure table header uses Poppins
        fontStyle: 'bold',
      },
      styles: {
        font: 'Poppins', // IMPORTANT: Specify the font for the table content
        fontStyle: 'normal',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      }
    });

    // 8. Add a footer with page numbers and generation date
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageNumText = `Page ${i} of ${pageCount}`;
      const generatedDate = `Generated on: ${new Date().toLocaleDateString()}`;
      doc.setFontSize(8);
      doc.text(generatedDate, 14, doc.internal.pageSize.height - 10);
      doc.text(pageNumText, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
    }

    // 9. Save the PDF
    const fileName = `medical-codes-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

  } catch (error) {
    // If the font fails to load, inform the user.
    console.error("Failed to generate PDF:", error);
    alert("Could not generate PDF. The required font file failed to load.");
  }
};

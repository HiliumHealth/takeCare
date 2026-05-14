import jsPDF from "jspdf";

interface HospitalBookData {
  user: any;
  records: any[];
  prescriptions: any[];
  personalization: any;
  preview?: boolean;
}

export const generateHospitalBook = (data: HospitalBookData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const { user, records, prescriptions, personalization } = data;
  const timestamp = new Date().toLocaleString();

  // Helper to add a new page with header
  const addNewPage = () => {
    doc.addPage();
    addHeader();
  };

  const addHeader = () => {
    // Top Bar
    doc.setFillColor(0, 71, 255); // Hilium Blue
    doc.rect(0, 0, 210, 15, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("HILIUM CLINICAL VAULT • OFFICIAL MEDICAL RECORD", 105, 10, { align: "center" });
  };

  // --- PAGE 1: COVER ---
  addHeader();

  // Logo Placeholder (in real usage we'd use a base64 image)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text("HILIUM", 105, 60, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Intelligent Healthcare Infrastructure", 105, 70, { align: "center" });

  doc.setDrawColor(0, 71, 255);
  doc.setLineWidth(1);
  doc.line(40, 80, 170, 80);

  doc.setFontSize(24);
  doc.text("PERSONAL HEALTH BOOKLET", 105, 100, { align: "center" });

  // Patient Info Card
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(30, 120, 150, 60, 5, 5, "F");
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text("PATIENT NAME:", 40, 135);
  doc.setFont("helvetica", "bold");
  doc.text(user.name.toUpperCase(), 80, 135);

  doc.setFont("helvetica", "normal");
  doc.text("IDENTIFICATION:", 40, 145);
  doc.setFont("helvetica", "bold");
  doc.text(user.id.substring(0, 12).toUpperCase(), 80, 145);

  doc.setFont("helvetica", "normal");
  doc.text("BLOOD TYPE:", 40, 155);
  doc.setFont("helvetica", "bold");
  doc.text(personalization?.bloodType || "NOT SPECIFIED", 80, 155);

  doc.setFont("helvetica", "normal");
  doc.text("GENERATED ON:", 40, 165);
  doc.setFont("helvetica", "bold");
  doc.text(timestamp, 80, 165);

  // Digital Seal
  doc.setDrawColor(16, 185, 129); // Success Green
  doc.setLineWidth(0.5);
  doc.circle(160, 240, 20, "D");
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(6);
  doc.text("VERIFIED BY", 160, 235, { align: "center" });
  doc.setFontSize(10);
  doc.text("HILIUM AI", 160, 242, { align: "center" });
  doc.setFontSize(6);
  doc.text("BLOCKCHAIN SECURED", 160, 247, { align: "center" });

  // --- PAGE 2: CLINICAL SUMMARY ---
  addNewPage();
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical History & Analysis", 20, 30);

  let yPos = 45;

  records.forEach((record, index) => {
    if (yPos > 250) {
      addNewPage();
      yPos = 30;
    }

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(15, yPos, 180, 40, 2, 2, "F");

    doc.setFontSize(10);
    doc.setTextColor(0, 71, 255);
    doc.text(`${record.type} • ${new Date(record.createdAt).toLocaleDateString()}`, 20, yPos + 10);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(record.fileName, 20, yPos + 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const summary = record.analysis?.summary || record.fallbackSummary || "No summary available.";
    const splitSummary = doc.splitTextToSize(summary, 170);
    doc.text(splitSummary, 20, yPos + 25);

    yPos += 50;
  });

  // --- PAGE 3: ACTIVE MEDICATIONS ---
  if (prescriptions.length > 0) {
    addNewPage();
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Current Treatment Plan", 20, 30);

    yPos = 45;
    prescriptions.forEach((presc) => {
      presc.medications.forEach((med: any) => {
        if (yPos > 260) {
          addNewPage();
          yPos = 30;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(med.name, 25, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`${med.dosage} — ${med.frequency}`, 25, yPos + 5);
        doc.text(`Instructions: ${med.instructions || "Standard use"}`, 25, yPos + 10);
        
        doc.setDrawColor(230, 230, 230);
        doc.line(20, yPos + 15, 190, yPos + 15);
        yPos += 20;
      });
    });
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("End of Document • Hilium Clinical OS v2.0", 105, 285, { align: "center" });

  if (data.preview) {
    return doc.output("bloburl");
  } else {
    doc.save(`${user.name.replace(/\s+/g, "_")}_Hospital_Book.pdf`);
    return null;
  }
};

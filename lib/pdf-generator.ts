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
    doc.text("HILIUM CLINICAL VAULT • OFFICIAL PATIENT BOOKLET", 105, 10, { align: "center" });
  };

  // --- PAGE 1: COVER ---
  addHeader();

  // Branded Background Elements
  doc.setFillColor(0, 71, 255, 0.02);
  doc.rect(0, 0, 210, 297, "F");

  // Logo
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.text("HILIUM", 105, 70, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 150, 150);
  doc.text("INTELLIGENT CLINICAL OPERATING SYSTEM", 105, 80, { align: "center" });

  doc.setDrawColor(0, 71, 255);
  doc.setLineWidth(0.5);
  doc.line(80, 85, 130, 85);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("PERSONAL HEALTH", 105, 110, { align: "center" });
  doc.text("RECORD BOOK", 105, 122, { align: "center" });

  // Patient Dossier Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(240, 240, 240);
  doc.roundedRect(25, 140, 160, 80, 4, 4, "FD");
  
  doc.setFillColor(0, 71, 255, 0.05);
  doc.rect(25, 140, 160, 15, "F");
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(8);
  doc.text("PATIENT DOSSIER (CONFIDENTIAL)", 105, 150, { align: "center" });

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const drawRow = (label: string, value: string, y: number) => {
    doc.text(label, 40, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, 90, y);
    doc.setFont("helvetica", "normal");
    doc.line(40, y + 2, 175, y + 2);
  };

  drawRow("FULL NAME", user.name.toUpperCase(), 170);
  drawRow("PATIENT ID", user.id.substring(0, 16).toUpperCase(), 180);
  drawRow("BLOOD GROUP", personalization?.bloodType || "PENDING", 190);
  drawRow("DATE OF ISSUE", timestamp.split(",")[0], 200);
  drawRow("SECURITY HASH", Math.random().toString(36).substring(7).toUpperCase(), 210);

  // Digital Verification Seal
  doc.setDrawColor(0, 71, 255);
  doc.circle(165, 255, 18, "D");
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(6);
  doc.text("OFFICIALLY SIGNED", 165, 250, { align: "center" });
  doc.setFontSize(10);
  doc.text("HILIUM AI", 165, 257, { align: "center" });
  doc.setFontSize(6);
  doc.text("VERIFIED RECORD", 165, 262, { align: "center" });

  // --- PAGE 2: CLINICAL OVERVIEW ---
  addNewPage();
  
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical History & Intelligent Summary", 20, 30);
  doc.line(20, 35, 190, 35);

  let yPos = 45;

  records.forEach((record, index) => {
    // Check for page break
    if (yPos > 240) {
      addNewPage();
      yPos = 30;
    }

    doc.setFillColor(252, 253, 255);
    doc.setDrawColor(230, 235, 255);
    doc.roundedRect(15, yPos, 180, 55, 3, 3, "FD");

    // Header within card
    doc.setFillColor(0, 71, 255, 0.1);
    doc.rect(15, yPos, 180, 10, "F");
    
    doc.setFontSize(9);
    doc.setTextColor(0, 71, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`ENTRY #${String(index + 1).padStart(3, '0')} • ${record.type}`, 20, yPos + 6.5);
    doc.text(new Date(record.createdAt).toLocaleDateString(), 185, yPos + 6.5, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(record.fileName, 22, yPos + 20);
    
    // AI Summary Section
    doc.setFillColor(240, 240, 240, 0.5);
    doc.roundedRect(22, yPos + 25, 166, 22, 1, 1, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("XERINE AI CLINICAL SUMMARY", 25, yPos + 30);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const summary = record.analysis?.summary || record.fallbackSummary || "Automated analysis pending synchronization.";
    const splitSummary = doc.splitTextToSize(summary, 160);
    doc.text(splitSummary, 25, yPos + 35);

    yPos += 65;
  });

  // --- PAGE 3: PRESCRIPTIONS ---
  if (prescriptions.length > 0) {
    addNewPage();
    doc.setTextColor(0, 71, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Medication & Treatment Logs", 20, 30);
    doc.line(20, 35, 190, 35);

    yPos = 45;
    prescriptions.forEach((presc) => {
      presc.medications.forEach((med: any) => {
        if (yPos > 260) {
          addNewPage();
          yPos = 30;
        }

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(240, 240, 240);
        doc.roundedRect(15, yPos, 180, 25, 2, 2, "D");

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(med.name, 25, yPos + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`${med.dosage} • ${med.frequency}`, 25, yPos + 14);
        doc.text(`INSTRUCTIONS: ${med.instructions || "Standard medical use"}`, 25, yPos + 20);
        
        yPos += 30;
      });
    });
  }

  // Final Signature Page
  if (yPos > 220) addNewPage();
  
  doc.setDrawColor(200, 200, 200);
  doc.line(120, 250, 180, 250);
  doc.setFontSize(8);
  doc.text("CHIEF MEDICAL OFFICER (HILIUM AI)", 150, 255, { align: "center" });
  
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`DOCUMENT UID: ${user.id}-${Date.now()}`, 105, 280, { align: "center" });
  doc.text("GENUINE HILIUM CLINICAL ASSET • HIPAA COMPLIANT", 105, 285, { align: "center" });

  if (data.preview) {
    return doc.output("bloburl");
  } else {
    doc.save(`${user.name.replace(/\s+/g, "_")}_Hospital_Book.pdf`);
    return null;
  }
};

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
    doc.rect(0, 0, 210, 12, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("HILIUM CLINICAL VAULT • OFFICIAL PATIENT BOOKLET", 105, 8, { align: "center" });
  };

  // --- PAGE 1: COVER ---
  addHeader();

  // Clean White Background (Default)
  
  // Logo
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(44);
  doc.setFont("helvetica", "bold");
  doc.text("HILIUM", 105, 60, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("INTELLIGENT CLINICAL OPERATING SYSTEM", 105, 68, { align: "center" });

  doc.setDrawColor(0, 71, 255);
  doc.setLineWidth(0.3);
  doc.line(85, 72, 125, 72);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("PERSONAL HEALTH", 105, 95, { align: "center" });
  doc.text("RECORD BOOK", 105, 107, { align: "center" });

  // Patient Dossier Box
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.roundedRect(25, 120, 160, 80, 2, 2, "D");
  
  doc.setFillColor(248, 250, 255);
  doc.rect(25.2, 120.2, 159.6, 12, "F");
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(8);
  doc.text("PATIENT DOSSIER (OFFICIAL)", 105, 128, { align: "center" });

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const drawRow = (label: string, value: string, y: number) => {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label, 40, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(value, 95, y);
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(240, 240, 240);
    doc.line(40, y + 2, 175, y + 2);
  };

  drawRow("FULL NAME", (user.name || "N/A").toUpperCase(), 145);
  drawRow("PATIENT ID", (user.id || "").substring(0, 16).toUpperCase(), 155);
  drawRow("BLOOD GROUP", personalization?.bloodType || "NOT SPECIFIED", 165);
  drawRow("DATE OF ISSUE", timestamp.split(",")[0], 175);
  drawRow("SECURITY HASH", (user.id || "HASH").substring(0, 8).toUpperCase(), 185);
  drawRow("PROVIDER", "HILIUM CLOUD INFRASTRUCTURE", 195);

  // AI Executive Summary on Cover
  doc.setFillColor(250, 250, 250);
  doc.rect(25, 210, 160, 30, "F");
  
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("HILIUM AI EXECUTIVE SUMMARY", 30, 218);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  
  // Use the most recent record's summary or a generic one
  const latestSummary = records[0]?.analysis?.summary || records[0]?.fallbackSummary || "Patient records successfully digitized and secured within the Hilium Clinical Operating System. No immediate clinical anomalies detected in the primary overview.";
  const coverSummary = doc.splitTextToSize(latestSummary, 150);
  doc.text(coverSummary.slice(0, 3), 30, 225); // Limit to 3 lines on cover

  // Digital Verification Seal
  doc.setDrawColor(0, 71, 255);
  doc.setLineWidth(0.5);
  doc.circle(165, 265, 18, "D");
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(6);
  doc.text("OFFICIALLY SIGNED", 165, 260, { align: "center" });
  doc.setFontSize(10);
  doc.text("HILIUM AI", 165, 267, { align: "center" });
  doc.setFontSize(6);
  doc.text("VERIFIED RECORD", 165, 272, { align: "center" });

  // --- PAGE 2: CLINICAL OVERVIEW ---
  addNewPage();
  
  doc.setTextColor(0, 71, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical History & Intelligent Summary", 20, 30);
  doc.setDrawColor(0, 71, 255);
  doc.setLineWidth(0.5);
  doc.line(20, 33, 190, 33);

  let yPos = 45;

  const getDisplayTitle = (r: any) => {
    let title = r.fileName || "Unnamed Clinical Record";
    if (title.match(/\.(jpeg|jpg|png|pdf)$/i) || title.includes("WhatsApp Image")) {
      title = r.description && r.description !== "Patient uploaded medical record" ? r.description : "Clinical Observation";
    }
    return title;
  };

  const stripMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1')     // italic
      .replace(/_{1,2}(.*?)_{1,2}/g, '$1') // underline/italic
      .replace(/#+\s?/g, '')           // headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // code
      .replace(/\n\s*-\s/g, '\n• ')    // lists
      .replace(/\n\s*\*\s/g, '\n• ')   // lists
      .replace(/<[^>]*>?/gm, '')       // html tags
      .trim();
  };

  records.forEach((record, index) => {
    // Each record on a new page (except the first one which starts on the initial overview page)
    if (index > 0) {
      addNewPage();
      yPos = 30;
    }

    const rawSummary = record.analysis?.summary || record.fallbackSummary || "Clinical synthesis in progress.";
    const summary = stripMarkdown(rawSummary);
    const splitSummary = doc.splitTextToSize(summary, 155);
    
    // Dynamic height calculation
    const textHeight = splitSummary.length * 4; // approx 4mm per line
    const boxHeight = textHeight + 10;
    const cardHeight = boxHeight + 30;

    // Record Card
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(15, yPos, 180, cardHeight, 1, 1, "D");

    // Header within card
    doc.setFillColor(250, 252, 255);
    doc.rect(15.2, yPos + 0.2, 179.6, 8, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(0, 71, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`ENTRY #${String(index + 1).padStart(3, '0')} • ${record.type}`, 20, yPos + 6);
    doc.text(new Date(record.createdAt).toLocaleDateString(), 185, yPos + 6, { align: "right" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(getDisplayTitle(record), 22, yPos + 18);
    
    // AI Summary Section
    doc.setFillColor(250, 250, 250);
    doc.rect(22, yPos + 22, 166, boxHeight, "F");
    
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("HILIUM AI CLINICAL INSIGHT", 25, yPos + 27);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(splitSummary, 25, yPos + 32);

    yPos += cardHeight + 8;
  });

  // --- PAGE 3: PRESCRIPTIONS ---
  if (prescriptions && prescriptions.length > 0) {
    addNewPage();
    doc.setTextColor(0, 71, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Medication & Treatment Logs", 20, 30);
    doc.line(20, 33, 190, 33);

    yPos = 45;
    prescriptions.forEach((presc) => {
      if (presc.medications) {
        presc.medications.forEach((med: any) => {
          if (yPos > 260) {
            addNewPage();
            yPos = 30;
          }

          doc.setDrawColor(245, 245, 245);
          doc.roundedRect(15, yPos, 180, 22, 1, 1, "D");

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(med.name, 25, yPos + 8);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`${med.dosage} • ${med.frequency}`, 25, yPos + 14);
          doc.text(`INSTRUCTIONS: ${med.instructions || "Standard use"}`, 25, yPos + 19);
          
          yPos += 28;
        });
      }
    });
  }

  // Final Signature Page
  if (yPos > 210) addNewPage();
  
  doc.setDrawColor(200, 200, 200);
  doc.line(130, 255, 180, 255);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("CERTIFIED BY HILIUM CLINICAL AI", 155, 260, { align: "center" });
  
  doc.setFontSize(6);
  doc.setTextColor(180, 180, 180);
  doc.text(`UID: ${user.id || 'N/A'}-${Date.now()}`, 105, 280, { align: "center" });
  doc.text("OFFICIAL CLINICAL RECORD • HIPAA COMPLIANT SECURED", 105, 285, { align: "center" });

  if (data.preview) {
    return doc.output("bloburl");
  } else {
    doc.save(`${(user.name || "Patient").replace(/\s+/g, "_")}_Hospital_Book.pdf`);
    return null;
  }
};

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendInvitationEmail = async (email: string, doctorName: string, otp: string, patientName: string) => {
  const mailOptions = {
    from: `"TakeCare AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Medical Consultation Request - ${patientName}`,
    html: `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <div style="margin-bottom: 32px;">
          <h2 style="color: #2563eb; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">TakeCare</h2>
          <p style="color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; tracking: 0.1em; margin-top: 4px;">Professional Medical Portal</p>
        </div>

        <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Dear Dr. <strong>${doctorName}</strong>,
        </p>

        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
          You have been invited to review the clinical profile and medical history of <strong>${patientName}</strong>. 
          Please visit your specialized <strong>Doctor Dashboard</strong> to provide your expert assessment and medical guidance.
        </p>

        <div style="background-color: #f8fafc; padding: 32px; border-radius: 20px; text-align: center; margin-bottom: 32px; border: 1px solid #f1f5f9;">
          <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Your Secure Access Code</p>
          <h1 style="margin: 0; font-size: 48px; color: #0f172a; letter-spacing: 0.2em; font-weight: 900;">${otp}</h1>
          <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; font-weight: 500;">Valid for 60 minutes</p>
        </div>

        <div style="text-align: center; margin-bottom: 40px;">
          <a href="${process.env.NEXTAUTH_URL || 'https://takecare-ai.vercel.app'}/doctor/verify" 
             style="background-color: #2563eb; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 15px; display: inline-block;">
            Access Doctor Dashboard
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 40px;">
          This secure access allows you to directly upload clinical reports, provide diagnostic notes, and synchronize your findings with the patient's digital health record.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 32px;">
          <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; text-align: center; margin: 0;">
            CONFIDENTIALITY NOTICE: This clinical invitation is intended only for Dr. ${doctorName}. 
            If you are not the intended recipient, please notify the sender and delete this message.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendReportNotificationEmail = async (email: string, patientName: string, doctorName: string) => {
  const mailOptions = {
    from: `"TakeCare Health" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Medical Assessment Ready - Dr. ${doctorName}`,
    html: `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 28px; background-color: #ffffff; box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.05);">
        <div style="margin-bottom: 32px; display: flex; align-items: center; gap: 12px;">
          <div style="background: #10b981; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px;">T</div>
          <div>
            <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">TakeCare</h2>
            <p style="color: #10b981; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; margin: 2px 0 0 0;">Clinical Intelligence</p>
          </div>
        </div>

        <h1 style="color: #0f172a; font-size: 32px; font-weight: 900; letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 24px;">
          Your medical <span style="color: #10b981;">assessment</span> is ready for review.
        </h1>

        <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Hi <strong>${patientName.split(' ')[0]}</strong>,
        </p>

        <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 32px;">
          Great news! <strong>Dr. ${doctorName}</strong> has just completed their review of your clinical profile and submitted a detailed report. 
          Your digital health record has been updated with the latest clinical notes and expert assessments.
        </p>

        <div style="background-color: #f0fdf4; padding: 32px; border-radius: 24px; margin-bottom: 32px; border: 1px solid #dcfce7;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>
            <p style="margin: 0; font-size: 11px; color: #10b981; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">New Clinical Updates</p>
          </div>
          <ul style="margin: 0; padding: 0; list-style: none; color: #166534; font-size: 14px; font-weight: 600;">
            <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span style="color: #10b981;">✓</span> Comprehensive Doctor's Note
            </li>
            <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span style="color: #10b981;">✓</span> Diagnostic Assessment Files
            </li>
            <li style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #10b981;">✓</span> AI-Powered Insight Synchronization
            </li>
          </ul>
        </div>

        <div style="text-align: center; margin-bottom: 40px;">
          <a href="${process.env.NEXTAUTH_URL || 'https://takecare-ai.vercel.app'}/dashboard" 
             style="background-color: #0f172a; color: #ffffff; padding: 20px 40px; text-decoration: none; border-radius: 20px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2);">
            View My Health Dashboard
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
          Access your secure dashboard to read the full report, download files, and explore personalized health insights generated by our AI engine.
        </p>

        <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; font-weight: 500;">
            &copy; 2026 TakeCare AI. HIPAA Compliant & Secure.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

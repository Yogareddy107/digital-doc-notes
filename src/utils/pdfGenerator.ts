
import { Prescription } from '@/types/database';

export const generatePrescriptionPDF = async (prescription: Prescription) => {
  // Create a simple HTML template for the prescription
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Prescription - ${prescription.diagnosis}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .info-section {
                margin-bottom: 25px;
            }
            .info-label {
                font-weight: bold;
                color: #374151;
                display: inline-block;
                min-width: 120px;
            }
            .medications {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #2563eb;
            }
            .medication-item {
                background: white;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
            .medication-name {
                font-weight: bold;
                font-size: 16px;
                color: #1f2937;
                margin-bottom: 5px;
            }
            .medication-details {
                color: #6b7280;
                margin-bottom: 5px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🩺 MedicNote</div>
            <div>Digital Prescription Manager</div>
        </div>

        <div class="info-section">
            <div><span class="info-label">Patient:</span> ${prescription.patient?.profiles?.full_name || 'N/A'}</div>
            <div><span class="info-label">Doctor:</span> Dr. ${prescription.doctor?.profiles?.full_name || 'N/A'}</div>
            <div><span class="info-label">Specialization:</span> ${prescription.doctor?.specialization || 'N/A'}</div>
            <div><span class="info-label">Date Issued:</span> ${new Date(prescription.date_issued).toLocaleDateString()}</div>
            <div><span class="info-label">Prescription ID:</span> ${prescription.id}</div>
        </div>

        <div class="info-section">
            <div><span class="info-label">Diagnosis:</span> ${prescription.diagnosis}</div>
        </div>

        <div class="medications">
            <h3 style="margin-top: 0; color: #1f2937;">Prescribed Medications</h3>
            ${prescription.medications.map(med => `
                <div class="medication-item">
                    <div class="medication-name">${med.name}</div>
                    <div class="medication-details">
                        <strong>Dosage:</strong> ${med.dosage} | 
                        <strong>Frequency:</strong> ${med.frequency} | 
                        <strong>Duration:</strong> ${med.duration}
                    </div>
                    ${med.instructions ? `<div class="medication-details"><strong>Instructions:</strong> ${med.instructions}</div>` : ''}
                </div>
            `).join('')}
        </div>

        ${prescription.notes ? `
            <div class="info-section">
                <div><span class="info-label">Additional Notes:</span></div>
                <div style="margin-top: 10px; padding: 15px; background: #f9fafb; border-radius: 6px;">
                    ${prescription.notes}
                </div>
            </div>
        ` : ''}

        <div class="footer">
            <div>This prescription was generated electronically by MedicNote</div>
            <div>Generated on: ${new Date().toLocaleString()}</div>
        </div>
    </body>
    </html>
  `;

  // Create a blob and download the PDF
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and download
  const link = document.createElement('a');
  link.href = url;
  link.download = `prescription-${prescription.id.substring(0, 8)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

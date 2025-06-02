
import jsPDF from 'jspdf';
import { Prescription } from '@/types/database';

export const generatePrescriptionPDF = async (prescription: Prescription) => {
  const doc = new jsPDF();
  
  // Set up the document
  doc.setFontSize(20);
  doc.text('PRESCRIPTION', 105, 20, { align: 'center' });
  
  // Add a line
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Doctor Information
  doc.setFontSize(14);
  doc.text('Doctor Information:', 20, 40);
  doc.setFontSize(12);
  
  const doctorName = prescription.doctor?.profiles?.full_name || 'Unknown Doctor';
  const doctorSpec = prescription.doctor?.specialization || 'General Practice';
  const doctorLicense = prescription.doctor?.license_number || 'N/A';
  
  doc.text(`Name: Dr. ${doctorName}`, 25, 50);
  doc.text(`Specialization: ${doctorSpec}`, 25, 60);
  doc.text(`License: ${doctorLicense}`, 25, 70);
  
  // Patient Information
  doc.setFontSize(14);
  doc.text('Patient Information:', 20, 90);
  doc.setFontSize(12);
  
  const patientName = prescription.patient?.profiles?.full_name || 'Unknown Patient';
  const patientDOB = prescription.patient?.date_of_birth || 'N/A';
  
  doc.text(`Name: ${patientName}`, 25, 100);
  doc.text(`Date of Birth: ${patientDOB}`, 25, 110);
  
  // Prescription Details
  doc.setFontSize(14);
  doc.text('Prescription Details:', 20, 130);
  doc.setFontSize(12);
  
  doc.text(`Date Issued: ${new Date(prescription.date_issued || prescription.created_at).toLocaleDateString()}`, 25, 140);
  doc.text(`Diagnosis: ${prescription.diagnosis}`, 25, 150);
  
  // Medications
  doc.setFontSize(14);
  doc.text('Medications:', 20, 170);
  doc.setFontSize(12);
  
  let yPosition = 180;
  prescription.medications.forEach((medication, index) => {
    doc.text(`${index + 1}. ${medication.name}`, 25, yPosition);
    doc.text(`   Dosage: ${medication.dosage}`, 30, yPosition + 10);
    doc.text(`   Frequency: ${medication.frequency}`, 30, yPosition + 20);
    doc.text(`   Duration: ${medication.duration}`, 30, yPosition + 30);
    
    if (medication.instructions) {
      doc.text(`   Instructions: ${medication.instructions}`, 30, yPosition + 40);
      yPosition += 50;
    } else {
      yPosition += 40;
    }
    
    yPosition += 10; // Space between medications
  });
  
  // Additional Notes
  if (prescription.notes) {
    doc.setFontSize(14);
    doc.text('Additional Notes:', 20, yPosition + 10);
    doc.setFontSize(12);
    
    // Split long text into multiple lines
    const splitNotes = doc.splitTextToSize(prescription.notes, 170);
    doc.text(splitNotes, 25, yPosition + 20);
  }
  
  // Save the PDF
  const fileName = `prescription-${prescription.id}.pdf`;
  doc.save(fileName);
};

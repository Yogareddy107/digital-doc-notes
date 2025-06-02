
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Prescription } from '@/types/database';
import { Edit, Download, Eye } from 'lucide-react';
import { generatePrescriptionPDF } from '@/utils/pdfGenerator';
import { toast } from '@/hooks/use-toast';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  onEdit: (prescription: Prescription) => void;
  onRefresh: () => void;
}

export default function PrescriptionList({ prescriptions, onEdit, onRefresh }: PrescriptionListProps) {
  const handleDownloadPDF = async (prescription: Prescription) => {
    try {
      await generatePrescriptionPDF(prescription);
      toast({
        title: "Success",
        description: "Prescription PDF downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Eye className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions yet</h3>
          <p className="text-gray-600 text-center">
            Create your first prescription to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <Card key={prescription.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {prescription.diagnosis}
                </CardTitle>
                <CardDescription>
                  Patient: {prescription.patient?.profiles?.full_name}
                </CardDescription>
                <CardDescription>
                  Issued: {new Date(prescription.date_issued).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  prescription.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : prescription.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {prescription.status}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(prescription)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadPDF(prescription)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Medications:</h4>
                <div className="space-y-2">
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">{med.name}</div>
                      <div className="text-sm text-gray-600">
                        {med.dosage} • {med.frequency} • {med.duration}
                      </div>
                      {med.instructions && (
                        <div className="text-sm text-gray-600 mt-1">
                          Instructions: {med.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {prescription.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Notes:</h4>
                  <p className="text-gray-600">{prescription.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

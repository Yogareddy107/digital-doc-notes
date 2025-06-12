
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Prescription, Medication } from '@/types/database';
import { FileText, Calendar, Download, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generatePrescriptionPDF } from '@/utils/pdfGenerator';
import { toast } from '@/hooks/use-toast';

export default function PatientDashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      // First fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (prescriptionsError) throw prescriptionsError;

      // Then fetch doctors and profiles separately
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*');

      if (doctorsError) throw doctorsError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Transform and combine the data
      const transformedData: Prescription[] = prescriptionsData?.map(prescription => {
        const doctor = doctorsData?.find(d => d.id === prescription.doctor_id);
        const profile = profilesData?.find(p => p.id === prescription.doctor_id);

        return {
          id: prescription.id,
          doctor_id: prescription.doctor_id,
          patient_id: prescription.patient_id,
          date_issued: prescription.date_issued || new Date().toISOString(),
          diagnosis: prescription.diagnosis,
          medications: prescription.medications as unknown as Medication[],
          notes: prescription.notes,
          pdf_url: prescription.pdf_url,
          status: prescription.status as 'active' | 'cancelled' | 'completed',
          created_at: prescription.created_at || new Date().toISOString(),
          updated_at: prescription.updated_at || new Date().toISOString(),
          doctor: doctor && profile ? {
            id: doctor.id,
            specialization: doctor.specialization,
            license_number: doctor.license_number,
            created_at: doctor.created_at || new Date().toISOString(),
            updated_at: doctor.updated_at || new Date().toISOString(),
            profiles: {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              phone: profile.phone,
              role: profile.role,
              created_at: profile.created_at || new Date().toISOString(),
              updated_at: profile.updated_at || new Date().toISOString()
            }
          } : undefined
        };
      }) || [];
      
      setPrescriptions(transformedData);
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (prescription: Prescription) => {
    try {
      await generatePrescriptionPDF(prescription);
      toast({
        title: "PDF Downloaded",
        description: "Prescription PDF has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter(p => p.status === 'active').length,
    thisMonth: prescriptions.filter(p => 
      new Date(p.created_at).getMonth() === new Date().getMonth()
    ).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
              <p className="text-gray-600">Welcome to the Patient Portal</p>
            </div>
            <Link to="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
            </CardContent>
          </Card>
        </div>

        {/* Prescriptions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">My Prescriptions</h2>
          
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No prescriptions found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Dr. {prescription.doctor?.profiles?.full_name || 'Unknown Doctor'}
                        </CardTitle>
                        <CardDescription>
                          {prescription.doctor?.specialization} • {new Date(prescription.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                          prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prescription.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(prescription)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {prescription.diagnosis && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Diagnosis</h4>
                          <p className="text-gray-600">{prescription.diagnosis}</p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Medications</h4>
                        <div className="space-y-2">
                          {prescription.medications.map((medication, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-gray-900">{medication.name}</h5>
                                <span className="text-sm text-gray-600">{medication.dosage}</span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Frequency:</strong> {medication.frequency}</p>
                                <p><strong>Duration:</strong> {medication.duration}</p>
                                {medication.instructions && (
                                  <p><strong>Instructions:</strong> {medication.instructions}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {prescription.notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                          <p className="text-gray-600">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

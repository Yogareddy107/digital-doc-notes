
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Prescription, Medication } from '@/types/database';
import { FileText, Download, Calendar, LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generatePrescriptionPDF } from '@/utils/pdfGenerator';

export default function PatientDashboard() {
  const { profile, signOut } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors!inner (
            *,
            profiles!inner (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: Prescription[] = data?.map(prescription => ({
        ...prescription,
        medications: prescription.medications as unknown as Medication[],
        status: prescription.status as 'active' | 'cancelled' | 'completed',
        doctor: prescription.doctors ? {
          ...prescription.doctors,
          profiles: prescription.doctors.profiles
        } : undefined
      })) || [];
      
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

  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter(p => p.status === 'active').length,
    recent: prescriptions.filter(p => 
      new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
              <p className="text-gray-600">Welcome, {profile?.full_name}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
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
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent (30 days)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Prescriptions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">My Prescriptions</h2>
          
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions yet</h3>
                <p className="text-gray-600 text-center">
                  Your prescriptions from doctors will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
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
                          Dr. {prescription.doctor?.profiles?.full_name} • {prescription.doctor?.specialization}
                        </CardDescription>
                        <CardDescription>
                          Issued: {new Date(prescription.date_issued).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
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
          )}
        </div>
      </main>
    </div>
  );
}

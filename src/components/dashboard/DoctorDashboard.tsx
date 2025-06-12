
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Prescription, Medication } from '@/types/database';
import { Plus, FileText, Users, Calendar, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import PrescriptionForm from '@/components/prescriptions/PrescriptionForm';
import PrescriptionList from '@/components/prescriptions/PrescriptionList';
import { toast } from '@/hooks/use-toast';

export default function DoctorDashboard() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (
            *,
            profiles (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: Prescription[] = data?.map(prescription => ({
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
        patient: prescription.patients && prescription.patients.profiles ? {
          id: prescription.patients.id,
          date_of_birth: prescription.patients.date_of_birth,
          medical_record_number: prescription.patients.medical_record_number,
          emergency_contact: prescription.patients.emergency_contact,
          created_at: prescription.patients.created_at || new Date().toISOString(),
          updated_at: prescription.patients.updated_at || new Date().toISOString(),
          profiles: {
            id: prescription.patients.profiles.id,
            email: prescription.patients.profiles.email,
            full_name: prescription.patients.profiles.full_name,
            phone: prescription.patients.profiles.phone,
            role: prescription.patients.profiles.role,
            created_at: prescription.patients.profiles.created_at || new Date().toISOString(),
            updated_at: prescription.patients.profiles.updated_at || new Date().toISOString()
          }
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

  const handlePrescriptionSaved = () => {
    fetchPrescriptions();
    setShowForm(false);
    setEditingPrescription(null);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setShowForm(true);
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
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600">Welcome to the Doctor Portal</p>
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
              <Users className="h-4 w-4 text-muted-foreground" />
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

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Prescriptions</h2>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        </div>

        {/* Prescription Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <PrescriptionForm
                prescription={editingPrescription}
                onSave={handlePrescriptionSaved}
                onCancel={() => {
                  setShowForm(false);
                  setEditingPrescription(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Prescriptions List */}
        <PrescriptionList
          prescriptions={prescriptions}
          onEdit={handleEditPrescription}
          onRefresh={fetchPrescriptions}
        />
      </main>
    </div>
  );
}

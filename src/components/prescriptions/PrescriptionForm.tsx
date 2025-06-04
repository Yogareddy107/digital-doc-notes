
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Prescription, Patient, Profile, Medication } from '@/types/database';
import { Plus, X, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PrescriptionFormProps {
  prescription?: Prescription | null;
  onSave: () => void;
  onCancel: () => void;
}

interface PatientWithProfile extends Patient {
  profiles: Profile;
}

export default function PrescriptionForm({ prescription, onSave, onCancel }: PrescriptionFormProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    patient_id: '',
    diagnosis: '',
    notes: '',
    medications: [] as Medication[]
  });

  useEffect(() => {
    fetchPatients();
    
    if (prescription) {
      setFormData({
        patient_id: prescription.patient_id,
        diagnosis: prescription.diagnosis,
        notes: prescription.notes || '',
        medications: prescription.medications
      });
    }
  }, [prescription]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          profiles!inner (*)
        `);

      if (error) throw error;
      
      // Transform the data to match our interface, filtering out any with missing profiles
      const transformedData: PatientWithProfile[] = data?.filter(patient => 
        patient.profiles && typeof patient.profiles === 'object' && !('error' in patient.profiles) && patient.profiles !== null
      ).map(patient => ({
        ...patient,
        profiles: patient.profiles as Profile
      })) || [];
      
      setPatients(transformedData);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive"
      });
    }
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setFormData({ ...formData, medications: updatedMedications });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create prescriptions",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    try {
      if (formData.medications.length === 0) {
        throw new Error('At least one medication is required');
      }

      const prescriptionData = {
        doctor_id: user.id,
        patient_id: formData.patient_id,
        diagnosis: formData.diagnosis,
        medications: formData.medications as any, // Cast to Json type for Supabase
        notes: formData.notes || null
      };

      if (prescription) {
        const { error } = await supabase
          .from('prescriptions')
          .update(prescriptionData)
          .eq('id', prescription.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Prescription updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('prescriptions')
          .insert([prescriptionData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Prescription created successfully"
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {prescription ? 'Edit Prescription' : 'New Prescription'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">Patient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {filteredPatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    <div>
                      <div className="font-medium">{patient.profiles?.full_name}</div>
                      <div className="text-sm text-gray-500">{patient.profiles?.email}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Patient's diagnosis"
              required
            />
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Medications</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="w-4 h-4 mr-1" />
                Add Medication
              </Button>
            </div>
            
            {formData.medications.map((medication, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Medication {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedication(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Medication Name</Label>
                      <Input
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="e.g., Amoxicillin"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Dosage</Label>
                      <Input
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Frequency</Label>
                      <Input
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., 3 times daily"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Duration</Label>
                      <Input
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Instructions</Label>
                    <Textarea
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      placeholder="Special instructions for taking this medication"
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            ))}
            
            {formData.medications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No medications added yet. Click "Add Medication" to get started.
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or instructions"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : prescription ? 'Update' : 'Create'} Prescription
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

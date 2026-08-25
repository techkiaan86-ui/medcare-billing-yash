import { prisma } from '../config/db.js';

/**
 * Format a DB patient object to match frontend model (with nested address)
 */
const formatPatient = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    patientId: p.patientId,
    firstName: p.firstName,
    middleName: p.middleName,
    lastName: p.lastName,
    dob: p.dob,
    sex: p.sex,
    phone: p.phone,
    email: p.email,
    ssn: p.ssn,
    address: {
      street: p.street || '',
      suite: p.suite || '',
      city: p.city || '',
      state: p.state || '',
      zipCode: p.zipCode || ''
    },
    communicationPref: p.communicationPref,
    consentStatus: p.consentStatus,
    assignedProviderIds: typeof p.assignedProviderIds === 'string' ? JSON.parse(p.assignedProviderIds) : p.assignedProviderIds,
    status: p.status,
    createdAt: p.createdAt
  };
};

/**
 * Get patients list (with filters & search)
 */
export const getPatients = async (req, res) => {
  const { search, status, providerId } = req.query;

  try {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { patientId: { contains: q } },
        { id: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { middleName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { city: { contains: q } },
        { ssn: { contains: q } }
      ];
    }

    let patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAtDate: 'desc' }
    });

    // Client-side provider ID filter mapping if requested
    if (providerId) {
      patients = patients.filter(p => {
        const ids = typeof p.assignedProviderIds === 'string' ? JSON.parse(p.assignedProviderIds) : p.assignedProviderIds;
        return Array.isArray(ids) && ids.includes(providerId);
      });
    }

    return res.status(200).json(patients.map(formatPatient));
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ error: 'Internal server error fetching patients.' });
  }
};

/**
 * Get patient profile details by ID
 */
export const getPatientById = async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id },
          { patientId: id }
        ]
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    return res.status(200).json(formatPatient(patient));
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve patient profile.' });
  }
};

/**
 * Register new patient profile
 */
export const createPatient = async (req, res) => {
  const data = req.body;

  if (!data.firstName || !data.lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required.' });
  }

  const generatedId = `pat-${Date.now()}`;
  const generatedMrn = `${Math.floor(100000000 + Math.random() * 900000000)}`;
  
  // Extract address if provided nested or flat
  const nestedAddress = data.address || {};
  const street = nestedAddress.street || data.street || '';
  const suite = nestedAddress.suite || data.suite || '';
  const city = nestedAddress.city || data.city || '';
  const state = nestedAddress.state || data.state || '';
  const zipCode = nestedAddress.zipCode || data.zipCode || '';

  try {
    const newPatient = await prisma.patient.create({
      data: {
        id: generatedId,
        patientId: generatedMrn,
        firstName: data.firstName,
        middleName: data.middleName || '',
        lastName: data.lastName,
        dob: data.dob || '',
        sex: data.sex || 'M',
        phone: data.phone || '',
        email: data.email || '',
        ssn: data.ssn || '',
        street,
        suite,
        city,
        state,
        zipCode,
        communicationPref: data.communicationPref || 'SMS',
        consentStatus: data.consentStatus || 'SIGNED',
        assignedProviderIds: data.assignedProviderIds || ['prov-josmic', 'prov-davs', 'prov-anik', 'prov-counselor'],
        status: 'ACTIVE',
        createdAt: new Date().toISOString().split('T')[0]
      }
    });

    return res.status(201).json(formatPatient(newPatient));
  } catch (error) {
    console.error('Error registering patient profile:', error);
    return res.status(500).json({ error: 'Failed to create patient profile.' });
  }
};

/**
 * Update patient profile settings
 */
export const updatePatient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const existing = await prisma.patient.findFirst({
      where: {
        OR: [
          { id },
          { patientId: id }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    const nestedAddress = updates.address || {};
    const street = nestedAddress.street || updates.street || existing.street;
    const suite = nestedAddress.suite || updates.suite || existing.suite;
    const city = nestedAddress.city || updates.city || existing.city;
    const state = nestedAddress.state || updates.state || existing.state;
    const zipCode = nestedAddress.zipCode || updates.zipCode || existing.zipCode;

    const updated = await prisma.patient.update({
      where: { id: existing.id },
      data: {
        firstName: updates.firstName || existing.firstName,
        middleName: updates.middleName !== undefined ? updates.middleName : existing.middleName,
        lastName: updates.lastName || existing.lastName,
        dob: updates.dob || existing.dob,
        sex: updates.sex || existing.sex,
        phone: updates.phone || existing.phone,
        email: updates.email || existing.email,
        ssn: updates.ssn || existing.ssn,
        street,
        suite,
        city,
        state,
        zipCode,
        communicationPref: updates.communicationPref || existing.communicationPref,
        consentStatus: updates.consentStatus || existing.consentStatus,
        assignedProviderIds: updates.assignedProviderIds || existing.assignedProviderIds,
        status: updates.status || existing.status
      }
    });

    return res.status(200).json(formatPatient(updated));
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return res.status(500).json({ error: 'Failed to update patient profile.' });
  }
};

/**
 * DELETE /api/patients/:id
 * Cascades deletion across cases, appointments, notes, and documents without foreign key conflicts
 */
export const deletePatient = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await prisma.$transaction([
      prisma.clinicalNote.deleteMany({ where: { patientId: id } }),
      prisma.appointment.deleteMany({ where: { patientId: id } }),
      prisma.case.deleteMany({ where: { patientId: id } }),
      prisma.patient.delete({ where: { id } })
    ]);

    return res.status(200).json({ success: true, message: 'Patient and all associated records deleted cleanly.' });
  } catch (error) {
    console.error('Error deleting patient record:', error);
    return res.status(500).json({ error: 'Failed to delete patient record.' });
  }
};

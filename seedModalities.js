import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/v1/modalities';

const DEFAULT_MODALITIES = [
  { name: 'Pain Management', enabled: true, cptCode: '99204 (Confirmed)', fee: '$1,214.00', duration: '60 min', template: 'JOSMIC Pain Evaluation', status: 'COMPLETE' },
  { name: 'Laser Therapy', enabled: true, cptCode: '97039 (Confirmed)', fee: '$2,000.00', duration: '45 min', template: 'ANIK Laser Procedure Form', status: 'COMPLETE' },
  { name: 'Shockwave Therapy', enabled: true, cptCode: '0101T (Confirmed)', fee: '$1,000.00', duration: '30 min', template: "DAV'S ESWT Therapy Record", status: 'COMPLETE' },
  { name: 'Trigger Point Injection', enabled: false, cptCode: '20552 (Pending)', fee: 'Pricing Pending', duration: '30 min', template: 'Trigger Point Form (Pending)', status: 'CONFIGURATION_PENDING' },
  { name: 'TECAR Therapy', enabled: false, cptCode: '97039-RF (Pending)', fee: 'Pricing Pending', duration: '45 min', template: 'TECAR Procedure Form (Pending)', status: 'CONFIGURATION_PENDING' },
  { name: 'Counseling & Mental Health', enabled: true, cptCode: '90834 / 90791', fee: '$180.00 - $350.00', duration: '45 min', template: 'Behavioral Health Progress Note', status: 'COMPLETE' }
];

async function seed() {
  console.log('Seeding Service Modalities via Backend API...');
  
  for (const mod of DEFAULT_MODALITIES) {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mod),
      });

      if (response.ok) {
        console.log(`Successfully seeded ${mod.name}`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to seed ${mod.name}:`, errorText);
      }
    } catch (error) {
      console.error(`Error connecting to API for ${mod.name}:`, error.message);
    }
  }
  
  console.log('Seeding finished.');
}

seed();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_CPT_CATALOG = [
  { code: '99204', description: 'Office/Outpatient Visit New (Complex)', fee: '$450.00', category: 'E&M', modifiers: '25, 59' },
  { code: '99214', description: 'Office/Outpatient Visit Established (Moderate)', fee: '$275.00', category: 'E&M', modifiers: '25, 59' },
  { code: '97039', description: 'Unlisted Physical Medicine (HILT Laser)', fee: '$2000.00', category: 'Therapy', modifiers: 'GP, RT' },
  { code: '0101T', description: 'Extracorporeal Shock Wave Therapy (ESWT)', fee: '$1000.00', category: 'Therapy', modifiers: 'RT' },
  { code: '20552', description: 'Trigger Point Injections (1-2 muscles)', fee: '$450.00', category: 'Injections', modifiers: '59' },
  { code: '90834', description: 'Psychotherapy (45 Min)', fee: '$180.00', category: 'Mental Health', modifiers: '' }
];

async function seed() {
  console.log('Seeding CPT Codes...');
  try {
    const existing = await prisma.cptCode.count();
    if (existing > 0) {
      console.log('CPT Codes already seeded.');
    } else {
      for (const cpt of DEFAULT_CPT_CATALOG) {
        await prisma.cptCode.create({
          data: cpt
        });
      }
      console.log('Successfully seeded CPT Codes!');
    }
  } catch (err) {
    console.error('Error seeding CPT codes:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();

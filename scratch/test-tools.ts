import { PrismaClient } from '@prisma/client';
import { createHealthTools } from '../lib/ai/health-tools';

const prisma = new PrismaClient();

async function testTools() {
  const userId = 'cmnm9stin000038v5uo82ijcs'; // From logs
  const tools = createHealthTools(userId);

  console.log('Testing searchMedicalHistory...');
  try {
    const res = await (tools.searchMedicalHistory as any).execute({ query: 'blood pressure', limit: 1 });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }

  console.log('\nTesting getLatestVitals...');
  try {
    const res = await (tools.getLatestVitals as any).execute({});
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }

  console.log('\nTesting getDoctorNotes...');
  try {
    const res = await (tools.getDoctorNotes as any).execute({ limit: 1 });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }

  await prisma.$disconnect();
}

testTools();

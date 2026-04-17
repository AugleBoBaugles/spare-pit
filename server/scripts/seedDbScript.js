import { initDb } from '../db/initDb.js';

const seedData = [
  { name: 'Cordless Drill', location: 'Tool Cabinet A', status: 'available' },
  { name: 'Impact Driver', location: 'Tool Cabinet A', status: 'available' },
  { name: 'Soldering Iron', location: 'Electronics Bench', status: 'available' },
  { name: 'Multimeter', location: 'Electronics Bench', status: 'in-use' },
  { name: 'Band Saw', location: 'Machine Shop', status: 'available' },
  { name: 'Drill Press', location: 'Machine Shop', status: 'available' },
  { name: 'Allen Wrench Set', location: 'Tool Cabinet B', status: 'available' },
  { name: 'Torque Wrench', location: 'Tool Cabinet B', status: 'missing' },
];

async function seed() {
    const db = await initDb();

    console.log('Seeding database with initial tool data...');

    for (const tool of seedData) {
        await db.run(
            'INSERT INTO tools (name, location, status) VALUES (?, ?, ?)',
            tool.name,
            tool.location,
            tool.status
        );
    }
    console.log('Database seeding completed.');
    await db.close();
}

seed().catch(err => {
    console.error('Error occurred while seeding the database:', err);
    process.exit(1);
});
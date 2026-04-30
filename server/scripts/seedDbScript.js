import { initDb } from '../db/initDb.js';

const seedData = [
  // Tools
  { name: 'Cordless Drill', type: 'tool', location: 'Tool Cabinet A', status: 'available' },
  { name: 'Impact Driver', type: 'tool', location: 'Tool Cabinet A', status: 'available' },
  { name: 'Soldering Iron', type: 'tool', location: 'Electronics Bench', status: 'available' },
  { name: 'Multimeter', type: 'tool', location: 'Electronics Bench', status: 'in-use' },
  { name: 'Band Saw', type: 'tool', location: 'Machine Shop', status: 'available' },
  { name: 'Drill Press', type: 'tool', location: 'Machine Shop', status: 'available' },
  { name: 'Allen Wrench Set', type: 'tool', location: 'Tool Cabinet B', status: 'available' },
  { name: 'Torque Wrench', type: 'tool', location: 'Tool Cabinet B', status: 'missing' },
  { name: 'Hot Glue Gun', type: 'tool', location: 'Craft Shelf', status: 'available' },
  { name: 'Wire Strippers', type: 'tool', location: 'Electronics Bench', status: 'available' },

  // Parts
  { name: 'Wire', type: 'part', location: 'Electronics Drawer 1', status: 'available' },
  { name: 'DC Motor', type: 'part', location: 'Parts Bin A', status: 'available' },
  { name: 'Servo Motor', type: 'part', location: 'Parts Bin A', status: 'available' },
  { name: 'Wheel Set', type: 'part', location: 'Parts Bin B', status: 'available' },
  { name: 'Gear Pack', type: 'part', location: 'Parts Bin B', status: 'available' },
  { name: 'Battery Pack', type: 'part', location: 'Charging Station', status: 'in-use' },
  { name: 'Microcontroller Board', type: 'part', location: 'Electronics Drawer 2', status: 'available' },
  { name: 'Limit Switch', type: 'part', location: 'Electronics Drawer 2', status: 'available' },
  { name: 'LED Strip', type: 'part', location: 'Electronics Drawer 3', status: 'available' },
  { name: 'Zip Ties', type: 'part', location: 'Fastener Bin', status: 'available' },

  // Materials
  { name: 'Plywood Sheet', type: 'material', location: 'Lumber Rack', status: 'available' },
  { name: 'Aluminum Bar Stock', type: 'material', location: 'Metal Rack', status: 'available' },
  { name: 'Acrylic Sheet', type: 'material', location: 'Materials Shelf', status: 'available' },
  { name: 'PVC Pipe', type: 'material', location: 'Materials Shelf', status: 'available' },
  { name: 'Foam Board', type: 'material', location: 'Craft Shelf', status: 'available' },
  { name: '3D Printer Filament', type: 'material', location: '3D Print Station', status: 'available' },
  { name: 'Nylon Rope', type: 'material', location: 'Materials Bin', status: 'available' },
  { name: 'Duct Tape', type: 'material', location: 'Supply Cabinet', status: 'available' },
];

async function seed() {
    const db = await initDb();

    console.log('Seeding database with initial tool data...');

    for (const tool of seedData) {
        await db.run(
            'INSERT INTO inventory (name, type, location, status) VALUES (?, ?, ?, ?)',
            tool.name,
            tool.type || null,
            tool.location || null,
            tool.status || null
        );
    }
    console.log('Database seeding completed.');
    await db.close();
}

seed().catch(err => {
    console.error('Error occurred while seeding the database:', err);
    process.exit(1);
});
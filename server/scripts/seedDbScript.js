import { initDb } from '../db/initDb.js';

const seedData = [
  // Tools
  { name: 'Cordless Drill', type: 'tool', area: 'Machine Shop', location: 'Tool Cabinet A', status: 'available', quantity: 2, condition: 'good', checkOutBy: null, tags: 'power,drilling', notes: 'Includes 2 battery packs', itemImage: 'images/cordless-drill.jpg' },
  { name: 'Impact Driver', type: 'tool', area: 'Machine Shop', location: 'Tool Cabinet A', status: 'checked-out', quantity: 1, condition: 'good', checkOutBy: 'Alex T.', tags: 'power,fastening', notes: null, itemImage: 'images/impact-driver.jpg' },
  { name: 'Soldering Iron', type: 'tool', area: 'Electronics Lab', location: 'Electronics Bench 1', status: 'available', quantity: 3, condition: 'good', checkOutBy: null, tags: 'electronics,soldering', notes: 'Set temp to 350°C for standard use', itemImage: 'images/soldering-iron.jpg' },
  { name: 'Multimeter', type: 'tool', area: 'Electronics Lab', location: 'Electronics Bench 2', status: 'checked-out', quantity: 2, condition: 'fair', checkOutBy: 'Jamie R.', tags: 'electronics,testing', notes: 'One unit has a cracked screen but works fine', itemImage: 'images/multimeter.jpg' },
  { name: 'Band Saw', type: 'tool', area: 'Machine Shop', location: 'Machine Shop Floor', status: 'available', quantity: 1, condition: 'good', checkOutBy: null, tags: 'power,cutting', notes: 'Mentor supervision required', itemImage: 'images/band-saw.jpg' },
  { name: 'Drill Press', type: 'tool', area: 'Machine Shop', location: 'Machine Shop Floor', status: 'maintenance', quantity: 1, condition: 'poor', checkOutBy: null, tags: 'power,drilling', notes: 'Belt needs replacement — do not use', itemImage: 'images/drill-press.jpg' },
  { name: 'Allen Wrench Set', type: 'tool', area: 'Main Lab', location: 'Tool Cabinet B', status: 'available', quantity: 4, condition: 'good', checkOutBy: null, tags: 'hand-tool,fastening', notes: 'Metric and imperial sets both present', itemImage: 'images/allen-wrench-set.jpg' },
  { name: 'Torque Wrench', type: 'tool', area: 'Main Lab', location: 'Tool Cabinet B', status: 'missing', quantity: 0, condition: null, checkOutBy: null, tags: 'hand-tool,fastening', notes: 'Last seen 2025-04-10 — please report if found', itemImage: 'images/torque-wrench.jpg' },
  { name: 'Hot Glue Gun', type: 'tool', area: 'Fabrication Area', location: 'Craft Shelf', status: 'available', quantity: 5, condition: 'good', checkOutBy: null, tags: 'hand-tool,adhesive', notes: 'Extra glue sticks in drawer below', itemImage: 'images/hot-glue-gun.jpg' },
  { name: 'Wire Strippers', type: 'tool', area: 'Electronics Lab', location: 'Electronics Bench 1', status: 'available', quantity: 3, condition: 'good', checkOutBy: null, tags: 'electronics,wiring', notes: null, itemImage: 'images/wire-strippers.jpg' },
  { name: 'Oscilloscope', type: 'tool', area: 'Electronics Lab', location: 'Electronics Bench 3', status: 'available', quantity: 1, condition: 'good', checkOutBy: null, tags: 'electronics,testing', notes: 'Handle with care — expensive equipment', itemImage: 'images/oscilloscope.jpg' },
  { name: 'Heat Gun', type: 'tool', area: 'Fabrication Area', location: 'Craft Shelf', status: 'available', quantity: 2, condition: 'good', checkOutBy: null, tags: 'power,heat-shrink', notes: null, itemImage: 'images/heat-gun.jpg' },

  // Parts
  { name: '22 AWG Hookup Wire', type: 'part', area: 'Electronics Lab', location: 'Electronics Drawer 1', status: 'available', quantity: 10, condition: 'new', checkOutBy: null, tags: 'wiring,electronics', notes: 'Mixed colors — red, black, yellow, green spools', itemImage: 'images/hookup-wire.jpg' },
  { name: 'DC Gearmotor 12V', type: 'part', area: 'Electronics Lab', location: 'Parts Bin A', status: 'available', quantity: 6, condition: 'good', checkOutBy: null, tags: 'motor,drivetrain', notes: '100 RPM at no load', itemImage: 'images/dc-gearmotor.jpg' },
  { name: 'Servo Motor (Standard)', type: 'part', area: 'Electronics Lab', location: 'Parts Bin A', status: 'available', quantity: 8, condition: 'good', checkOutBy: null, tags: 'motor,actuator', notes: 'Compatible with PWM signal 50Hz', itemImage: 'images/servo-motor.jpg' },
  { name: 'Mecanum Wheel Set', type: 'part', area: 'Main Lab', location: 'Parts Bin B', status: 'available', quantity: 2, condition: 'good', checkOutBy: null, tags: 'drivetrain,wheels', notes: 'Sets of 4 — one left-hand, one right-hand', itemImage: 'images/mecanum-wheel-set.jpg' },
  { name: 'Spur Gear Pack', type: 'part', area: 'Main Lab', location: 'Parts Bin B', status: 'available', quantity: 3, condition: 'new', checkOutBy: null, tags: 'gears,transmission', notes: 'Assorted tooth counts: 12T, 24T, 48T', itemImage: 'images/spur-gear-pack.jpg' },
  { name: 'LiPo Battery Pack 12V', type: 'part', area: 'Charging Station', location: 'Charging Shelf', status: 'checked-out', quantity: 4, condition: 'good', checkOutBy: 'Sam K.', tags: 'power,battery', notes: 'Always store at storage charge when not in use', itemImage: 'images/lipo-battery-pack.jpg' },
  { name: 'Arduino Mega 2560', type: 'part', area: 'Electronics Lab', location: 'Electronics Drawer 2', status: 'available', quantity: 5, condition: 'good', checkOutBy: null, tags: 'microcontroller,electronics', notes: null, itemImage: 'images/arduino-mega.jpg' },
  { name: 'Raspberry Pi 4', type: 'part', area: 'Electronics Lab', location: 'Electronics Drawer 2', status: 'available', quantity: 3, condition: 'good', checkOutBy: null, tags: 'microcontroller,electronics,vision', notes: 'SD cards stored separately in Drawer 3', itemImage: 'images/raspberry-pi-4.jpg' },
  { name: 'Limit Switch (Snap Action)', type: 'part', area: 'Electronics Lab', location: 'Electronics Drawer 3', status: 'available', quantity: 20, condition: 'new', checkOutBy: null, tags: 'sensor,electronics', notes: null, itemImage: 'images/limit-switch.jpg' },
  { name: 'RGB LED Strip 5M', type: 'part', area: 'Electronics Lab', location: 'Electronics Drawer 3', status: 'available', quantity: 4, condition: 'good', checkOutBy: null, tags: 'electronics,lighting', notes: '12V addressable WS2812B', itemImage: 'images/rgb-led-strip.jpg' },
  { name: 'Zip Ties Assorted', type: 'part', area: 'Main Lab', location: 'Fastener Bin', status: 'available', quantity: 200, condition: 'new', checkOutBy: null, tags: 'fastener,cable-management', notes: 'Sizes: 4in, 8in, 12in', itemImage: 'images/zip-ties.jpg' },
  { name: 'Ultrasonic Distance Sensor', type: 'part', area: 'Electronics Lab', location: 'Parts Bin A', status: 'available', quantity: 7, condition: 'good', checkOutBy: null, tags: 'sensor,electronics', notes: 'HC-SR04 — 5V logic', itemImage: 'images/ultrasonic-sensor.jpg' },

  // Materials
  { name: '3/4" Plywood Sheet', type: 'material', area: 'Fabrication Area', location: 'Lumber Rack', status: 'available', quantity: 5, condition: 'good', checkOutBy: null, tags: 'wood,structural', notes: '4x8 ft sheets', itemImage: 'images/plywood-sheet.jpg' },
  { name: '1" Aluminum Bar Stock', type: 'material', area: 'Machine Shop', location: 'Metal Rack', status: 'available', quantity: 8, condition: 'good', checkOutBy: null, tags: 'metal,structural', notes: '36 inch lengths', itemImage: 'images/aluminum-bar-stock.jpg' },
  { name: '1/4" Acrylic Sheet (Clear)', type: 'material', area: 'Fabrication Area', location: 'Materials Shelf', status: 'available', quantity: 3, condition: 'good', checkOutBy: null, tags: 'plastic,enclosure', notes: '24x24 in sheets', itemImage: 'images/acrylic-sheet.jpg' },
  { name: '1/2" PVC Pipe', type: 'material', area: 'Fabrication Area', location: 'Materials Shelf', status: 'available', quantity: 10, condition: 'good', checkOutBy: null, tags: 'plastic,structural', notes: '10 ft lengths', itemImage: 'images/pvc-pipe.jpg' },
  { name: 'Foam Board 1/2"', type: 'material', area: 'Fabrication Area', location: 'Craft Shelf', status: 'available', quantity: 12, condition: 'new', checkOutBy: null, tags: 'foam,prototyping', notes: '20x30 in sheets — great for mock-ups', itemImage: 'images/foam-board.jpg' },
  { name: 'PLA Filament 1.75mm', type: 'material', area: '3D Print Station', location: '3D Print Station Shelf', status: 'available', quantity: 6, condition: 'good', checkOutBy: null, tags: '3d-printing,plastic', notes: 'Colors: black x2, white x2, red x1, blue x1', itemImage: 'images/pla-filament.jpg' },
  { name: 'Nylon Braided Rope 1/4"', type: 'material', area: 'Main Lab', location: 'Materials Bin', status: 'available', quantity: 3, condition: 'good', checkOutBy: null, tags: 'rope,rigging', notes: '50 ft coils', itemImage: 'images/nylon-rope.jpg' },
  { name: 'Gaffer Tape 2"', type: 'material', area: 'Main Lab', location: 'Supply Cabinet', status: 'available', quantity: 4, condition: 'new', checkOutBy: null, tags: 'tape,adhesive', notes: 'Preferred over duct tape — no residue', itemImage: 'images/gaffer-tape.jpg' },
  { name: '1/8" Steel Sheet', type: 'material', area: 'Machine Shop', location: 'Metal Rack', status: 'available', quantity: 2, condition: 'good', checkOutBy: null, tags: 'metal,structural', notes: '12x24 in pieces — cut to size in machine shop', itemImage: 'images/steel-sheet.jpg' },
  { name: 'Heat Shrink Tubing Kit', type: 'material', area: 'Electronics Lab', location: 'Electronics Drawer 1', status: 'available', quantity: 5, condition: 'new', checkOutBy: null, tags: 'electronics,wiring', notes: 'Assorted sizes 2:1 shrink ratio', itemImage: 'images/heat-shrink-tubing.jpg' },
];

async function seed() {
    const db = await initDb();

    console.log('Seeding database with initial inventory data...');

    for (const item of seedData) {
        await db.run(
            `INSERT INTO inventory 
              (name, type, area, location, status, quantity, condition, itemImage, checkOutBy, tags, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            item.name,
            item.type ?? null,
            item.area ?? null,
            item.location ?? null,
            item.status ?? null,
            item.quantity ?? null,
            item.condition ?? null,
            item.itemImage ?? null,
            item.checkOutBy ?? null,
            item.tags ?? null,
            item.notes ?? null
        );
    }

    console.log(`Database seeding completed. ${seedData.length} items inserted.`);
    await db.close();
}

seed().catch(err => {
    console.error('Error occurred while seeding the database:', err);
    process.exit(1);
});
import 'dotenv/config';
import * as mqtt from 'mqtt';
import * as readline from 'readline';
import { AppDataSource } from '../src/database/data-source';

const TASHKENT_CENTER = { lat: 41.2995, lng: 69.2401 };
const TICK_MS = Number(process.env.SIM_TICK_MS ?? 1000);
const VEHICLE_LIMIT = Number(process.env.SIM_VEHICLES ?? 3);

interface SimVehicle {
  id: string;
  imei: string;
  plateNumber: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  fuel: number;
  ignition: number;
  odometer: number;
}

interface VehicleRow {
  id: string;
  deviceImei: string;
  plateNumber: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastFuelLevel: number | null;
  totalMileage: string | number;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function autopilotTick(v: SimVehicle): void {
  if (Math.random() < 0.03) {
    v.ignition = v.ignition === 1 ? 0 : 1;
  }
  if (v.ignition === 1) {
    if (Math.random() < 0.3) {
      v.heading = (v.heading + rand(-30, 30) + 360) % 360;
    }
    v.speed = Math.max(0, Math.min(110, v.speed + rand(-8, 10)));
  } else {
    v.speed = 0;
  }
}

function integratePosition(v: SimVehicle): void {
  if (v.speed <= 0) return;
  const distanceKm = (v.speed * (TICK_MS / 1000)) / 3600;
  const headingRad = (v.heading * Math.PI) / 180;
  const dLat = (distanceKm / 111) * Math.cos(headingRad);
  const dLng =
    (distanceKm / (111 * Math.cos((v.lat * Math.PI) / 180))) * Math.sin(headingRad);
  v.lat += dLat;
  v.lng += dLng;
  v.odometer += distanceKm;
  v.fuel = Math.max(0, v.fuel - distanceKm * 0.08);
}

function publish(client: mqtt.MqttClient, v: SimVehicle): void {
  const payload = {
    ts: Date.now(),
    lat: Number(v.lat.toFixed(6)),
    lng: Number(v.lng.toFixed(6)),
    alt: 450,
    speed: Math.round(v.speed),
    heading: Math.round(v.heading),
    sat: 8 + Math.floor(rand(0, 4)),
    ignition: v.ignition,
    movement: v.speed > 1 ? 1 : 0,
    fuel: Math.round(v.fuel),
    etemp: v.ignition === 1 ? 80 + Math.round(rand(0, 20)) : 25,
    rpm: v.ignition === 1 ? 800 + Math.round(v.speed * 30) : 0,
    odo: Math.round(v.odometer),
  };
  client.publish(`devices/${v.imei}/data`, JSON.stringify(payload), { qos: 1 });
}

function printBanner(vehicles: SimVehicle[], activeIndex: number): void {
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│  TrackFlow FMB Simulator — Interactive Drive Mode              │');
  console.log('├────────────────────────────────────────────────────────────────┤');
  console.log('│  W / ↑    accelerate   (engine must be ON)                     │');
  console.log('│  S / ↓    brake                                                │');
  console.log('│  A / ←    turn left 15°                                        │');
  console.log('│  D / →    turn right 15°                                       │');
  console.log('│  SPACE    emergency stop (speed = 0)                           │');
  console.log('│  E        engine ON                                            │');
  console.log('│  Q        engine OFF (creates a stop event)                    │');
  console.log('│  R        reset position to Tashkent center                    │');
  console.log('│  1-9      switch which vehicle YOU control                     │');
  console.log('│  H        show this help                                       │');
  console.log('│  Ctrl+C   quit                                                 │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`\nVehicles loaded (you control [${activeIndex + 1}], others on autopilot):`);
  vehicles.forEach((v, i) => {
    const tag = i === activeIndex ? '★ YOU' : '  bot';
    console.log(`  ${tag}  [${i + 1}] ${v.plateNumber.padEnd(14)} IMEI ${v.imei}`);
  });
  console.log('');
}

function renderHud(v: SimVehicle, activeIndex: number, total: number): void {
  const ign = v.ignition === 1 ? '\x1b[32mON \x1b[0m' : '\x1b[31mOFF\x1b[0m';
  const speed = String(Math.round(v.speed)).padStart(3);
  const hdg = String(Math.round(v.heading)).padStart(3);
  const fuel = String(Math.round(v.fuel)).padStart(3);
  process.stdout.write(
    `\r[${activeIndex + 1}/${total}] ${v.plateNumber.padEnd(12)} │ ENG ${ign} │ ${speed} km/h │ hdg ${hdg}° │ fuel ${fuel}% │ ${v.lat.toFixed(4)},${v.lng.toFixed(4)}    `,
  );
}

async function main(): Promise<void> {
  await AppDataSource.initialize();

  const rows = await AppDataSource.manager.query<VehicleRow[]>(
    `SELECT id, "deviceImei", "plateNumber", "lastLatitude", "lastLongitude",
            "lastFuelLevel", "totalMileage"
     FROM vehicles
     WHERE "isActive" = true
     ORDER BY "createdAt" DESC
     LIMIT $1`,
    [VEHICLE_LIMIT],
  );

  if (rows.length === 0) {
    console.error('No active vehicles found. Add one via the dashboard first.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  const vehicles: SimVehicle[] = rows.map((row) => ({
    id: row.id,
    imei: row.deviceImei,
    plateNumber: row.plateNumber,
    lat: row.lastLatitude ?? TASHKENT_CENTER.lat + rand(-0.05, 0.05),
    lng: row.lastLongitude ?? TASHKENT_CENTER.lng + rand(-0.05, 0.05),
    heading: rand(0, 360),
    speed: 0,
    fuel: row.lastFuelLevel ?? rand(40, 95),
    ignition: 0,
    odometer: Number(row.totalMileage) || 0,
  }));

  await AppDataSource.destroy();

  let activeIndex = 0;

  const url = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
  const client = mqtt.connect(url, {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    clientId: `trackflow-sim-${Date.now()}`,
  });

  let interval: NodeJS.Timeout;
  let shuttingDown = false;

  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(interval);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
    console.log('\n\nShutting down…');
    client.end(false, {}, () => process.exit(0));
  };

  client.on('connect', () => {
    console.log(`✓ MQTT connected to ${url}`);
    printBanner(vehicles, activeIndex);

    interval = setInterval(() => {
      vehicles.forEach((v, i) => {
        if (i !== activeIndex) {
          autopilotTick(v);
        }
        integratePosition(v);
        publish(client, v);
      });
      renderHud(vehicles[activeIndex], activeIndex, vehicles.length);
    }, TICK_MS);

    if (process.stdin.isTTY) {
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.resume();

      process.stdin.on('keypress', (str: string | undefined, key: readline.Key) => {
        if (key.ctrl && key.name === 'c') {
          shutdown();
          return;
        }

        const v = vehicles[activeIndex];

        if (str && /^[1-9]$/.test(str)) {
          const idx = Number(str) - 1;
          if (idx < vehicles.length) {
            activeIndex = idx;
            process.stdout.write(`\n→ Now controlling [${idx + 1}] ${vehicles[idx].plateNumber}\n`);
          }
          return;
        }

        switch (key.name) {
          case 'w':
          case 'up':
            if (v.ignition === 1) v.speed = Math.min(120, v.speed + 5);
            break;
          case 's':
          case 'down':
            v.speed = Math.max(0, v.speed - 10);
            break;
          case 'a':
          case 'left':
            v.heading = (v.heading - 15 + 360) % 360;
            break;
          case 'd':
          case 'right':
            v.heading = (v.heading + 15) % 360;
            break;
          case 'space':
            v.speed = 0;
            process.stdout.write(`\n→ [${v.plateNumber}] EMERGENCY STOP (speed = 0)\n`);
            break;
          case 'e':
            if (v.ignition !== 1) {
              v.ignition = 1;
              process.stdout.write(`\n→ [${v.plateNumber}] ENGINE ON\n`);
            }
            break;
          case 'q':
            if (v.ignition !== 0) {
              v.ignition = 0;
              v.speed = 0;
              process.stdout.write(`\n→ [${v.plateNumber}] ENGINE OFF\n`);
            }
            break;
          case 'r':
            v.lat = TASHKENT_CENTER.lat;
            v.lng = TASHKENT_CENTER.lng;
            process.stdout.write(`\n→ [${v.plateNumber}] position reset to Tashkent center\n`);
            break;
          case 'h':
            printBanner(vehicles, activeIndex);
            break;
        }
      });
    } else {
      console.warn('⚠ Not running in a TTY — keyboard control disabled, all vehicles on autopilot.');
    }
  });

  client.on('error', (err) => {
    console.error('\nMQTT error:', err.message);
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

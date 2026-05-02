# TrackFlow — Avtomobil Parki Boshqaruv Tizimi

Toshkent va O'rta Osiyo kompaniyalari uchun GPS fleet tracking tizimi.

## Texnologiyalar

| Qism        | Texnologiya                   |
| ----------- | ----------------------------- |
| Backend     | NestJS + TypeScript           |
| Database    | PostgreSQL + TimescaleDB      |
| Cache / RT  | Redis                         |
| MQTT Broker | EMQX                          |
| Admin Panel | React + TypeScript + Tailwind |
| Mobile App  | React Native + Expo           |
| GPS Qurilma | Teltonika FMB920              |
| Protokol    | MQTT (qurilma → server)       |
| Real-time   | WebSocket (server → UI)       |

## Loyiha Tuzilmasi

```
trackflow/
├── apps/
│   ├── backend/          # NestJS API + MQTT + WebSocket
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/         # JWT authentication
│   │       │   ├── vehicles/     # Mashinalar CRUD
│   │       │   ├── tracking/     # GPS + MQTT + WebSocket
│   │       │   ├── drivers/      # Haydovchilar
│   │       │   ├── reports/      # Hisobotlar
│   │       │   ├── alerts/       # Tezlik, yoqilg'i ogohlantirishlari
│   │       │   └── geofencing/   # Hudud chegaralari
│   │       └── database/
│   │           └── migrations/
│   ├── dashboard/        # React + TS Admin Panel (CEO/Manager)
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       └── stores/   # Zustand (live tracking state)
│   └── mobile/           # React Native (Haydovchi/Menejer)
├── packages/
│   └── shared-types/     # Umumiy TypeScript tiplari
└── infrastructure/
    ├── docker/           # Docker Compose
    └── nginx/            # Reverse proxy config
```

## Boshlash

### 1. Talablar

- Docker + Docker Compose
- Node.js 20+
- Yarn

### 2. O'rnatish

```bash
git clone <repo>
cd trackflow

# Dependencies o'rnatish
yarn install

# Environment variables
cp apps/backend/.env.example apps/backend/.env
# .env faylini tahrirlang (DB, JWT, MQTT sozlamalari)
```

### 3. Development muhiti ishga tushirish

```bash
# Barcha servislarni Docker bilan ishga tushirish
yarn docker:up

# Backend (hot reload)
yarn dev:backend

# Admin Dashboard
yarn dev:dashboard

# Mobile App
yarn dev:mobile
```

### 4. API Dokumentatsiya

```
http://localhost:4000/api/docs  (Swagger UI)
```

### 5. EMQX Dashboard

```
http://localhost:18083
Default: admin / public
```

## Teltonika FMB920 Sozlash

1. **Configurator** dasturini yuklab oling (Teltonika Wiki)
2. MQTT serverini sozlang:
   - Server: `your-server-ip:1883`
   - Topic: `trackflow/devices/{IMEI}/data`
3. Payload formatini JSON qilib qo'ying
4. OBD ma'lumotlarini yoniqing

## API Endpointlar (asosiy)

```
POST   /api/auth/login
GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
GET    /api/vehicles/:id/history?from=&to=
GET    /api/tracking/live           # Barcha mashinalar jonli holat
GET    /api/reports/fuel?from=&to=
GET    /api/alerts
POST   /api/geofences
WS     /tracking                    # WebSocket real-time
```

## Keyingi Qadamlar

- [ ] Database migration yaratish
- [ ] Auth module (JWT + roles)
- [ ] Vehicles CRUD API
- [ ] MQTT → DB pipeline test qilish
- [ ] Dashboard Live Map komponenti
- [ ] Mobile App ekranlari

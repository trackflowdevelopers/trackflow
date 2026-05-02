# TrackFlow — Claude Code Qoidalari

## Loyiha Haqida

**TrackFlow** — Toshkent va O'rta Osiyo kompaniyalari uchun avtomobil parki boshqaruv tizimi.

| Qism        | Texnologiya                          |
| ----------- | ------------------------------------ |
| Backend     | NestJS + TypeScript                  |
| Database    | PostgreSQL + TimescaleDB             |
| Cache / RT  | Redis                                |
| MQTT Broker | EMQX                                 |
| Admin Panel | React + TypeScript + Tailwind + Vite |
| Mobile App  | React Native + Expo                  |
| GPS Qurilma | Teltonika FMB920                     |

## Kodlash Qoidalari

### Frontend (React + Vite)

- **1 fayl = 1 component**: Har bir `.tsx` faylda faqat bitta React component yoziladi
- **Interface**: Faylda faqat 1 ta interface yozilishi mumkin — u ham faqat prop types uchun. Qolgan barcha type/interfacelar `packages/shared-types/src/` ga chiqariladi
- **Yordamchi funksiyalar**: Reusable helper funksiyalar `packages/utils/src/` ga chiqariladi

### Backend (NestJS)

- NestJS standart strukturasiga amal qilinadi (`modules/`, `controllers`, `services`, `entities`, `dto`)

### Umumiy Qoidalar (barcha qismlar uchun)

- **`any` va `unknown` type HECH QACHON ishlatilmaydi** — o'rniga `packages/shared-types/src/` da yangi type ochiladi
- **Kodga comment yozilmaydi** — kod o'zi o'zini tushuntirishi kerak
- **Yordamchi funksiyalar reusable bo'lishi kerak** — ular `shared` papkaga chiqariladi

## Papka Tuzilmasi

```
TrackFlow/
├── apps/
│   ├── backend/          # NestJS API + MQTT + WebSocket
│   ├── dashboard/        # React + TS Admin Panel
│   └── mobile/           # React Native (Haydovchi/Menejer)
├── packages/
│   ├── shared-types/     # Umumiy TypeScript tiplari (barcha app ishlatadi)
│   └── utils/            # Reusable helper funksiyalar
└── infrastructure/
    └── docker/
```

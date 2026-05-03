# TrackFlow — Deploy qo'llanmasi

Ushbu hujjat **TrackFlow** loyihasini production muhitga chiqarish bo'yicha to'liq qo'llanma. Backend VPS serverga (Docker Compose), frontend (dashboard) Vercel'ga joylashtiriladi.

## Arxitektura

```
                            +-------------------+
                            |  Cloudflare DNS   |
                            +---------+---------+
                                      |
              +-----------------------+-----------------------+
              |                                               |
       app.trackflow.uz                                api.trackflow.uz
       (Cloudflare proxy)                                (A record -> VPS IP)
              |                                               |
        +-----v------+                                +-------v--------+
        |  Vercel    |                                |   VPS server   |
        |  Dashboard |  ---- HTTPS API requests --->  | Nginx + SSL    |
        |  (React)   |                                | NestJS Backend |
        +------------+                                | Postgres+TS    |
                                                      | Redis          |
                                                      | EMQX (MQTT)    |
                                                      +----------------+
                                                              |
                                                          GPS qurilma
                                                       Teltonika FMB920
                                                       (port 1883/8883)
```

## 1-bosqich: DNS sozlash (Cloudflare)

`trackflow.uz` domeni Cloudflare'da bo'lsa, DNS sahifasiga kirib quyidagi yozuvlarni qo'shing:

| Type | Name | Content        | Proxy             |
| ---- | ---- | -------------- | ----------------- |
| A    | api  | <VPS_IP>       | DNS only (kulrang)|
| A    | app  | 76.76.21.21    | Proxied (orange)  |

- `api.trackflow.uz` — **DNS only** bo'lishi shart, chunki Let's Encrypt sertifikat olishi va MQTT (1883) ishlashi kerak. Cloudflare proxy WebSocket va non-HTTP portlarni bloklaydi.
- `app.trackflow.uz` — Vercel CNAME beradi (keyinroq), hozircha placeholder.

## 2-bosqich: VPS serverni tayyorlash

### 2.1. SSH orqali kirish

```bash
ssh root@<VPS_IP>
```

### 2.2. Repo'ni klon qilish va setup skriptini ishga tushirish

```bash
apt-get update && apt-get install -y git
git clone https://github.com/trackflowdevelopers/trackflow.git /opt/trackflow
cd /opt/trackflow
sudo bash infrastructure/scripts/server-setup.sh
```

Bu skript quyidagilarni qiladi:

- Tizimni yangilaydi
- Docker va Docker Compose o'rnatadi
- UFW firewall sozlaydi (22, 80, 443, 1883, 8883 portlarini ochadi)
- `/opt/trackflow` katalogini tayyorlaydi

### 2.3. Production env faylni yaratish

```bash
cd /opt/trackflow
cp infrastructure/docker/.env.production.example infrastructure/docker/.env.production
nano infrastructure/docker/.env.production
```

`.env.production` faylida quyidagi qiymatlarni tahrirlang. Men siz uchun kuchli secret'larni generatsiya qildim, shu qiymatlardan foydalaning:

```env
NODE_ENV=production

DOMAIN=api.trackflow.uz
ACME_EMAIL=admin@trackflow.uz

POSTGRES_USER=trackflow
POSTGRES_PASSWORD=SBkT6uXTQWJA5Fwn04xXWNmA1NsZBpai
POSTGRES_DB=trackflow

REDIS_PASSWORD=8QkVpIlIGURUJvMA5C6iIAmxOAgdobKz

JWT_SECRET=RpVSAf6Yz8nfkz9oqDtgwwSuLVfYW6skVkCV5S7K42efjaG89VTYne4UEvipaQK
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=Vw9oxYbMz5RUrDua6alB3L6ktomubxl9yWl3mySyaySPJOI5fUG1aaMagdkLCD8
JWT_REFRESH_EXPIRES_IN=30d

MQTT_USERNAME=trackflow_6da9ad7c
MQTT_PASSWORD=N7NyZeY90nFBYkFn2tbjASitWSuApOvh

EMQX_DASHBOARD_USERNAME=admin
EMQX_DASHBOARD_PASSWORD=FtPrjTjqKSi6GcYXNlMOX7E5

CORS_ORIGIN=https://app.trackflow.uz
```

> **Eslatma:** Bu qiymatlarni hech kim bilan baham ko'rmang. `.env.production` fayli `.gitignore`'ga qo'shilgan, GitHub'ga yuklanmaydi.

### 2.4. Deploy

DNS yozuvi tarqalganidan keyin (5–15 daqiqa, `nslookup api.trackflow.uz` orqali tekshirish mumkin):

```bash
cd /opt/trackflow
sudo bash infrastructure/scripts/deploy.sh
```

Bu skript:

1. Git pull qiladi
2. Sertifikat yo'q bo'lsa, Let's Encrypt'dan SSL oladi
3. Backend Docker image'ini build qiladi
4. Postgres, Redis, EMQX, Backend, Nginx kontaynerlarini ko'taradi
5. TypeORM migration'larni ishga tushiradi
6. Holat ko'rsatadi

Tugaganidan keyin tekshiring:

```bash
curl https://api.trackflow.uz/api/health
```

Swagger docs: <https://api.trackflow.uz/api/docs>

## 3-bosqich: Frontend — Vercel deploy

### 3.1. Vercel'ga GitHub repo'ni ulash

1. <https://vercel.com> ga GitHub akkaunt bilan kiring
2. **Add New → Project** → `trackflowdevelopers/trackflow` repo'sini import qiling
3. Quyidagi sozlamalarni qo'ying:

   | Sozlama          | Qiymat                                                                              |
   | ---------------- | ----------------------------------------------------------------------------------- |
   | Framework Preset | Vite (avtomatik aniqlanadi `vercel.json`'dan)                                       |
   | Root Directory   | `.` (repo ildizi — **subdirectory tanlamang**)                                      |
   | Build Command    | (`vercel.json`'dan o'qiydi — bo'sh qoldiring)                                       |
   | Output Directory | (`vercel.json`'dan o'qiydi — bo'sh qoldiring)                                       |
   | Install Command  | (`vercel.json`'dan o'qiydi — bo'sh qoldiring)                                       |

### 3.2. Environment variable qo'shish

Vercel Project Settings → **Environment Variables** bo'limida:

| Name          | Value                              | Environment             |
| ------------- | ---------------------------------- | ----------------------- |
| `VITE_API_URL`| `https://api.trackflow.uz/api`     | Production, Preview, Dev|
| `VITE_WS_URL` | `https://api.trackflow.uz`         | Production, Preview, Dev|

### 3.3. Deploy

**Deploy** tugmasini bosing. Vercel:

1. `pnpm install --frozen-lockfile` (root'dan)
2. `pnpm --filter @trackflow/shared-types build`
3. `pnpm --filter @trackflow/dashboard build`
4. `apps/dashboard/dist` papkasini deploy qiladi

### 3.4. Custom domain qo'shish

Vercel project → **Settings → Domains** → `app.trackflow.uz` qo'shing.

Vercel CNAME yozuvini ko'rsatadi (masalan `cname.vercel-dns.com`). Cloudflare DNS'da `app` yozuvini quyidagicha o'zgartiring:

| Type  | Name | Content                | Proxy             |
| ----- | ---- | ---------------------- | ----------------- |
| CNAME | app  | cname.vercel-dns.com   | DNS only (kulrang)|

> SSL'ni Cloudflare orqali qilmoqchi bo'lsangiz **Proxied (orange)** qilib qo'ying — Cloudflare o'z SSL'ini beradi, Vercel'ning sertifikati o'rnida.

## 4-bosqich: Avtomatik yangilanishlar

### Backend (har push'da avtomatik deploy)

VPS'da GitHub webhook yoki cron orqali avtomatik pull qilish mumkin. Eng oddiy variant — har 5 daqiqada `git pull` cron:

```bash
sudo crontab -e
```

Quyidagini qo'shing:

```
*/5 * * * * cd /opt/trackflow && git fetch origin main && [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ] && bash infrastructure/scripts/deploy.sh >> /var/log/trackflow-deploy.log 2>&1
```

Yoki GitHub Actions orqali SSH'ga ulanib deploy qilish kerak (alohida konfiguratsiya).

### Frontend

Vercel allaqachon GitHub'ga ulangan — `main` branchga har push avtomatik production deploy bo'ladi. Pull request'lar uchun preview deploy ham yaratiladi.

## 5-bosqich: GPS qurilmalarni ulash (Teltonika FMB920)

Teltonika konfigurator orqali qurilmaga quyidagini yozing:

| Parametr           | Qiymat                              |
| ------------------ | ----------------------------------- |
| Server IP / Domain | `api.trackflow.uz`                  |
| Port               | `1883` (yoki `8883` TLS uchun)      |
| Protocol           | MQTT                                |
| Username           | `trackflow_6da9ad7c`                |
| Password           | `N7NyZeY90nFBYkFn2tbjASitWSuApOvh`  |
| Topic              | `devices/<IMEI>/data`               |

EMQX dashboard'iga kirish (faqat SSH tunnel orqali):

```bash
ssh -L 18083:127.0.0.1:18083 root@<VPS_IP>
```

So'ngra brauzerda <http://localhost:18083> ochiladi (login `admin` / parol .env.production'dan).

## Foydali buyruqlar

```bash
# Loglarni ko'rish
cd /opt/trackflow/infrastructure/docker
docker compose --env-file .env.production -f docker-compose.production.yml logs -f backend

# Bitta service'ni qayta ishga tushirish
docker compose --env-file .env.production -f docker-compose.production.yml restart backend

# To'liq qayta build
sudo bash /opt/trackflow/infrastructure/scripts/deploy.sh

# Postgres'ga psql bilan ulanish
docker compose --env-file .env.production -f docker-compose.production.yml exec postgres psql -U trackflow

# Disk holati
docker system df

# Eski image'larni tozalash
docker system prune -af --volumes
```

## Xavfsizlik bo'yicha eslatmalar

- Root foydalanuvchi bilan SSH parolini o'chiring, faqat SSH key bilan kirish
- `fail2ban` o'rnatib qo'ying: `apt-get install fail2ban`
- `.env.production` faylini hech qachon git'ga commit qilmang
- Production secret'larni vaqti-vaqti bilan rotate qiling
- Postgres backup avtomatlashtiring (alohida cron bilan `pg_dump`)

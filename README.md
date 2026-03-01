# ComparaHogar.es - V12.2

Comparador de productos de hogar inteligente con Amazon Affiliates.

## Setup

```bash
npm install
npm run dev
```

## Deploy

1. Crear repo en GitHub y push
2. Conectar repo en Vercel
3. En Vercel > Storage > Create Database > Neon Postgres
4. Deploy automatico

## Post-deploy (una sola vez)

```
https://tudominio.com/api/db/migrate?key=comparahogar2026
https://tudominio.com/api/db/seed?key=comparahogar2026
```

## Admin

5 clicks rapidos en el logo > Panel de administracion

## Variables de entorno

- POSTGRES_URL (automatica al crear DB)
- AMAZON_ACCESS_KEY (opcional, PA-API)
- AMAZON_SECRET_KEY (opcional, PA-API)
- AMAZON_PARTNER_TAG (default: digitalconect-21)
- ADMIN_KEY (default: comparahogar2026)

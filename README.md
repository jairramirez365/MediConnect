# MediConnect
MediConnect

Base local del proyecto health-tech multirol.

Backend:
- Node.js + Express
- PostgreSQL

Archivos clave:
- [init.sql](/C:/Users/azus/Documents/MediConnect/database/schemas/init.sql)
- [seeds.sql](/C:/Users/azus/Documents/MediConnect/database/seeders/seeds.sql)
- [package.json](/C:/Users/azus/Documents/MediConnect/backend/package.json)
- [server.js](/C:/Users/azus/Documents/MediConnect/backend/src/server.js)

Ejecución local:
1. Copiar `backend/.env.example` a `backend/.env`.
2. Levantar PostgreSQL con `docker compose up -d`.
3. Entrar a `backend/`.
4. Ejecutar `npm install`.
5. Ejecutar `npm run db:init`.
6. Ejecutar `npm run db:seed`.
7. Ejecutar `npm run dev`.

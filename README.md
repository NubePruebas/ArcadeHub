# ArcadeHub

Portal de juegos online con minijuegos incluidos, catálogo público y panel de administración protegido.

## Desarrollo local

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.example` a `.env`:

- `ADMIN_PASSWORD` — contraseña del admin
- `SESSION_SECRET` — secreto de sesión
- `PORT` — puerto (por defecto 3000)

## Publicar

1. Sube este repo a GitHub
2. Conéctalo en Railway (Web Service)
3. Start command: `npm start`
4. Configura las variables de entorno ahí

Los juegos individuales pueden seguir alojados en Render; en el admin solo pegas sus links.

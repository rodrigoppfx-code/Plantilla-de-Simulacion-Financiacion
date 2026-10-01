# Servicio de guardado

Fuente del servicio publicado en Vercel, proyecto `avovite-propuestas-admin`.

La pagina de GitHub Pages llama a `https://avovite-propuestas-admin.vercel.app/api/settings` para validar acceso y guardar. La configuracion se escribe solamente en `config.json` de la rama `main` del repositorio de esta plantilla.

Variables privadas del servicio: `ADMIN_KEY_SALT`, `ADMIN_KEY_HASH` (scrypt de 64 bytes, hexadecimal) y `GITHUB_TOKEN`. Se configuran en Vercel. Nunca poner sus valores en HTML, config.json o archivos del repositorio.

La clave se verifica nuevamente en cada guardado. No se escribe con una clave incorrecta, valores invalidos o una revision antigua. Los cambios se aplican en la pagina despues del despliegue de GitHub Pages.

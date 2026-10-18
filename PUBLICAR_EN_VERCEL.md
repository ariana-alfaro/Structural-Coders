# Publicar Structural Coders en Vercel + Supabase

Estado: adaptación preparada y compilada. No se ha ejecutado la migración en tu proyecto ni publicado en Vercel. Las pruebas del servidor en nube usan un almacenamiento simulado: falta verificar las políticas SQL y la conexión real entre celulares.

Repositorio: https://github.com/ariana-alfaro/Structural-Coders
Proyecto: https://supabase.com/dashboard/project/ocwtdtqodmcvxinkoucz

## 1. Cambiar las dos contraseñas temporales

En la aplicación local http://127.0.0.1:5175/, entra como Ariana con GADEST y usa Mi cuenta para cambiarla. Cierra sesión y repite con Renzo. Cada titular puede elegir su propia contraseña. Estas entradas las realiza el usuario, no el asistente. No envíes las nuevas contraseñas por el chat.

La aplicación local conserva los hashes en `.private/members.json`. El script de migración lee esos hashes y exige que ambas cuentas hayan abandonado su contraseña temporal. No restablece contraseñas de miembros que ya existan en Supabase.

## 2. Crear las tablas y los permisos

Abre tu proyecto de Supabase → SQL Editor → New query. Copia TODO el contenido de `supabase/migrations/005_cloud_web.sql` y pulsa Run. Es una migración aditiva: crea tablas con el prefijo sc_web_ y no borra las tablas de las evaluaciones anteriores.

No hace falta ejecutar 001–004 para esta versión de la plataforma compartida. La 005 crea por separado las cuentas, sesiones, límites de acceso, biblioteca, salas y permisos.

Después, en Authentication → configuración de Sign In / Providers, habilita Anonymous Sign-ins. Los aspirantes reciben una identidad técnica temporal para los canales privados; no necesitan correo ni contraseña. Las cuentas Renzo y Ariana las valida el servidor mediante sc_web_members, por eso no aparecen como miembros de correo en Authentication → Users.

En Realtime, comprueba que estén permitidos los canales privados. La migración crea sc_web_receive y sc_web_send en realtime.messages. Si el proyecto tiene otras políticas generales que permiten a cualquiera publicar en todos los canales, revísalas: los permisos se combinan y una regla general puede ampliar los permisos de las nuevas reglas. No elimines políticas que otra aplicación necesite sin revisarlas.

## 3. Copiar las cuentas y cuestionarios desde tu computadora

Usa la carpeta original del proyecto, la que contiene `.private/` y tus cuestionarios editados, no la copia limpia que subirás a GitHub.

Copia `.env.cloud.example` como `.env.cloud.local`. Completa en ese archivo local:

```
SUPABASE_URL=https://ocwtdtqodmcvxinkoucz.supabase.co
SUPABASE_SECRET_KEY=tu_clave_secreta_de_servidor
```

La clave se obtiene desde la configuración de API Keys de TU proyecto (secret key; también admite una service_role heredada). Es privada: solo va en este archivo local ignorado y en las variables del servidor de Vercel. Nunca lleva prefijo VITE_, nunca se coloca en public/ ni se pega en el chat o en GitHub.

Desde la carpeta original, ejecuta:

```
npm run cloud:seed
```

El script comprueba que las contraseñas estén personalizadas, copia las cuentas que aún no existen y carga la biblioteca solo si está vacía. Si hay una biblioteca compartida, la conserva. Así no sobrescribe trabajo posterior de la nube. No imprime claves ni hashes.

## 4. Subir el código a GitHub

Usa los archivos del paquete LIMPIO structural-coders-vercel.zip. Descomprímelo y abre el repositorio vacío en GitHub → uploading an existing file / Add file → Upload files. Sube el contenido de la carpeta, de forma que package.json, vercel.json, src/, api/ y server/ queden directamente en la raíz del repositorio. Confirma la carga con Commit changes.

El paquete excluye `.private`, `.env.local`, `.env.cloud.local`, node_modules, dist y la carpeta duplicada structural-coders. Incluye ejemplos de variables sin claves. No subas la carpeta original completa del proyecto.

Alternativa con Git: vuelve a autenticar GitHub CLI con `gh auth login`, luego usa un repositorio local saneado. La sesión actual está vencida y el conector disponible solo tiene lectura; no se ha intentado forzar una escritura con otra cuenta.

## 5. Importar en Vercel

En Vercel → Add New → Project → importa ariana-alfaro/Structural-Coders.

- Framework: Vite.
- Root Directory: raíz del repositorio, donde está package.json.
- Build Command: npm run build:cloud (también está en vercel.json).
- Output Directory: dist.

Añade estas variables al entorno Production:

| Variable | Valor / dónde obtenerlo |
|---|---|
| SUPABASE_URL | https://ocwtdtqodmcvxinkoucz.supabase.co |
| SUPABASE_SECRET_KEY | Clave privada del servidor, como en el paso 3 |
| VITE_SUPABASE_URL | https://ocwtdtqodmcvxinkoucz.supabase.co |
| VITE_SUPABASE_ANON_KEY | Publishable key del proyecto; también admite la anon heredada. Es la clave pública, NO la secreta |

Al primer despliegue puedes dejar APP_URL y VITE_PUBLIC_URL sin definir: se usa el dominio HTTPS de la página para validar el origen y generar el QR. Si luego fijas un dominio canónico, puedes poner su origen en APP_URL y su dirección en VITE_PUBLIC_URL; vuelve a desplegar tras cambiar variables VITE_. Los despliegues Preview requieren su propia configuración y datos de prueba; no publiques una Preview sin revisar el entorno.

Pulsa Deploy. El backend /api usa funciones de Vercel y escribe en Supabase, no en archivos del despliegue. La clave secreta solo se usa en el servidor. Vercel proporciona el enlace HTTPS de la aplicación.

## 6. Verificar antes de compartir con el grupo

1. Abre el enlace desde una ventana privada y comprueba que el panel de miembros exige iniciar sesión.
2. Entra con Ariana y su nueva contraseña; comprueba los 14 cuestionarios y los anteriores migrados.
3. Edita un borrador, espera «Cambios guardados en el servidor», recarga y verifica que se conserva. Prueba también desde otro equipo.
4. En un celular abre Aspirante → Práctica → S1PRAC. Confirma que carga diez preguntas.
5. Como miembro abre una sala con S1VIVO y proyecta la pantalla. Dos celulares distintos deben poder entrar con su PIN, aparecer en la sala y responder.
6. Prueba el final de partida y la exportación CSV. La pestaña anfitriona debe permanecer abierta: sigue ejecutando el juego y su puntuación.
7. Prueba cerrar sesión y cambiar contraseña. Tras un redespliegue, cuentas y biblioteca deben conservarse en Supabase.

Los mensajes del anfitrión se publican en sc-host-PIN: solo el anfitrión autorizado puede enviarlos. Las respuestas se envían por sc-player-PIN y conservan su cifrado. Los dos canales son privados y requieren una identidad autenticada y acceso a esa sala. El registro de sala lo autoriza el backend, no el navegador por sí solo.

## Alcance actual

Las cuentas, sesiones y biblioteca se comparten desde Supabase. Las partidas usan Realtime entre dispositivos. La puntuación en vivo sigue calculándose en la pestaña del miembro, y los resultados se pueden exportar en CSV. El ranking de práctica y las evaluaciones individuales del prototipo siguen siendo locales al navegador: no se ha creado todavía un historial académico centralizado ni recuperación por correo. No uses ese módulo local como registro académico definitivo.

Verificación local: 45 pruebas automatizadas y compilación en modo cloud. La prueba cloud del backend comprueba sesiones compartidas entre instancias con un doble de base de datos; no confirma por sí sola la ejecución SQL ni Realtime del proyecto remoto. Esa verificación se completa en el paso 6.

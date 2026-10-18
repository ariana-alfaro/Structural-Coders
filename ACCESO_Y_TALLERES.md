# Acceso de miembros y siete talleres

La versión actual incorpora cuentas verificadas en un servidor Node.js. Funciona con el servidor local; no se ha publicado en internet ni se han creado cuentas en Supabase Auth.

## Entrar

Abre **Miembro GADEST** y usa una de las dos cuentas iniciales:

| Usuario | Contraseña temporal |
|---|---|
| Renzo | GADEST |
| Ariana | GADEST |

Dentro del panel, abre **Mi cuenta**, escribe la contraseña actual y la nueva dos veces. La nueva debe tener entre 8 y 128 caracteres. El cambio afecta solo a tu cuenta y persiste al reiniciar el servidor. La contraseña temporal no se restablece al reiniciar. Cerrar sesión invalida la sesión; las sesiones también caducan a las ocho horas y se cierran al reiniciar el servidor. No hay registro público ni recuperación por correo en esta entrega.

## Ejecutar

Desarrollo: `npm install` y `npm run dev:demo -- --port 5175`.

Versión compilada: `npm run build:local` y `npm start`. Abre `http://127.0.0.1:5175/`. Servir solamente la carpeta dist con un servidor estático no habilita las cuentas ni la biblioteca: debe ejecutarse el servidor Node.

La carpeta `.private/` contiene los hashes de las contraseñas y la biblioteca compartida. Respáldala de forma privada para trasladar este servidor sin perder cambios; no la publiques ni la elimines para actualizar el código. El ZIP excluye esos datos privados. Una instalación nueva crea las dos cuentas iniciales y los 14 cuestionarios de base. El almacenamiento en archivos está pensado para una sola instancia del servidor con disco persistente. Para alojarlo en internet deben configurarse HTTPS, el origen del proxy y un almacenamiento persistente; el servidor está limitado a localhost por defecto.

## Cuestionarios

Cada taller tiene diez preguntas de práctica y diez distintas para la partida en vivo. Los 140 títulos y ejercicios son originales, basados en los cuadernos proporcionados; no se ejecutaron sus instrucciones de instalación o despliegue. La práctica arranca sin cronómetro, con potenciadores y ranking local. Puedes modificar el tiempo y las ayudas en Configuración y habilitar una nueva versión. Los anteriores intentos conservan su versión. El ranking de práctica y las evaluaciones locales siguen guardándose en el navegador; no se han convertido en resultados académicos compartidos.

| Taller | Temas | Código de práctica | Cuestionario para organizar en vivo |
|---|---|---|---|
| 1 | Python: primeros cimientos | S1PRAC | S1VIVO |
| 2 | Markdown, flujo y funciones | S2PRAC | S2VIVO |
| 3 | Datos y gráficos estructurales | S3PRAC | S3VIVO |
| 4 | Objetos que representan estructuras | S4PRAC | S4VIVO |
| 5 | Automatización con la API de SAP2000 | S5PRAC | S5VIVO |
| 6 | Arquitectura e interfaces con Tkinter | S6PRAC | S6VIVO |
| 7 | Aplicaciones web con Streamlit | S7PRAC | S7VIVO |

El código S1VIVO (etc.) identifica el cuestionario en la biblioteca del miembro; el aspirante entra a la partida con el **PIN numérico** que genera el anfitrión. Puedes abrir «Organizar en vivo» directamente desde la tarjeta. En la compilación local sin Supabase, el transporte en vivo usa BroadcastChannel y funciona entre pestañas del mismo navegador y origen; el juego entre celulares requiere configurar y verificar el transporte compartido de Supabase existente. No se ha hecho un ensayo entre dispositivos físicos en esta entrega.

Todos los cuestionarios se pueden editar, duplicar, exportar y volver a habilitar. El archivo content/workshops.json es un respaldo compatible con «Subir cuestionario»; importarlo crea copias con códigos nuevos. Las preguntas iniciales usan cinco dinámicas: elección, terminal escrita, piezas, ordenar y verdadero/falso. El archivo S6_Arquitectura recibido tiene solo imports; la parte de arquitectura se apoya en la separación de cálculo e interfaz presente en los materiales de Tkinter y el integrador de Streamlit.

## Protección y verificación

Las contraseñas se almacenan con scrypt y sal aleatoria de 16 bytes, siguiendo la [API de criptografía de Node](https://nodejs.org/download/release/v22.21.0/docs/api/crypto.html). La sesión viaja en una cookie HttpOnly/SameSite=Strict. Se verifica la sesión en cada lectura o escritura de la biblioteca, se limita el número de intentos de ingreso y se exige la contraseña actual para cambiarla. No se exponen los archivos privados por las rutas HTTP. Una versión de biblioteca evita sobrescribir cambios de otro miembro: si se detecta un conflicto, se muestra un aviso para exportar y recargar.

44 pruebas automatizadas verifican el banco, las publicaciones y versiones, acceso denegado, ambas cuentas, cierre de sesión, contraseña persistida, rechazo de orígenes ajenos y conflictos de edición. Los 28 ejemplos de respuesta escrita se ejecutaron en Python y coincidieron con sus soluciones. Las llamadas reales de SAP2000 y las interfaces Tkinter/Streamlit no se ejecutan en el cuestionario: se evalúa comprensión de código y del flujo de trabajo.

# Publicación en Vercel + Supabase

La adaptación de nube y los pasos de configuración están en [Publicar en Vercel](PUBLICAR_EN_VERCEL.md). La versión de nube está preparada, pero requiere aplicar la migración 005, migrar los datos y verificar un despliegue real. Para seguir usando la aplicación local, ejecuta npm run build:local y npm start.

# Versión actual: cuentas de miembros y 14 cuestionarios

Consulta [Acceso y talleres](ACCESO_Y_TALLERES.md) para ingresar, cambiar contraseñas, ejecutar el servidor y usar los siete talleres. Esta sección y esa guía sustituyen las limitaciones de acceso y autoría local que se describen en las notas históricas de abajo.

# Structural Coders Quiz · Fase 1

Prototipo React + Vite + TypeScript + Tailwind. Interfaz en español, modo oscuro, cinco formatos de retos, diez preguntas, nota sobre 20, recuperación de participación, explicación educativa y podio de demostración. Incluye un estudio de autoría local. No incluye modalidad sincronizada ni administración remota autenticada.

## Abrir en VS Code

Abre esta carpeta y ejecuta en su terminal:

```powershell
npm install
npm run dev
```

Abre la dirección Local que muestre Vite. En demostración, ingresa el código **PY2026**, un nombre y un código universitario ficticios. La demo guarda datos solo en este navegador mediante localStorage; permite reiniciar una participación desde sus resultados. No sirve como registro académico oficial. Los resultados previos de la demo se conservan en el ranking del navegador.

## Diseño de los retos

- **Predice la salida:** editor Python, números de línea y alternativas como salidas de consola.
- **Verdadero o falso:** dos decisiones grandes, accesibles por teclado.
- **Encaja piezas (retos 5 y 8):** arrastra un operador al editor o tócalo para colocarlo.
- **Arrastra y ordena (retos 7 y 9):** mueve las líneas con el asa de arrastre; las flechas ofrecen una alternativa para teclado.
- **Terminal escrita (retos 2 y 10):** escribe la salida sin alternativas. Se ignoran espacios exteriores; el formato decimal se conserva, por lo que 12.5 no sustituye a 12.50.

La barra de progreso y el mapa de diez retos acompañan el recorrido. Cada acierto vale 2 puntos; no hay penalizaciones ni límite de tiempo. El tiempo solo desempata. Las fuentes usan Google Fonts y cuentan con sustitutos locales si no hay conexión.

## Conectar Supabase

1. En [Supabase](https://supabase.com/dashboard), crea un proyecto en tu organización, elige región y guarda la contraseña de base de datos fuera del código.
2. Abre **SQL Editor** y ejecuta, en este orden, `supabase/migrations/001_phase1.sql` y `supabase/migrations/002_demo.sql` en una base nueva. Después ejecuta `003_interactive_formats.sql` y `004_learning_tools.sql`. Son migraciones de una sola ejecución. Si ya aplicaste las dos primeras en la versión anterior, ejecuta 003 y 004; no vuelvas a aplicar las anteriores.
3. Consulta el código generado con `select code from public.quiz_sessions;`. El código real es aleatorio; PY2026 corresponde únicamente a la demo.
4. En el panel **Connect**, copia la URL del proyecto y su clave pública publishable (también se admite la clave pública anon). Consulta la [guía oficial de React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) y la [documentación de claves](https://supabase.com/docs/guides/getting-started/api-keys).
5. Copia `.env.example` como `.env.local` y completa:

```dotenv
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

El nombre ANON_KEY admite la clave publishable. Nunca uses service_role ni una clave secret en el frontend. Reinicia Vite tras cambiar las variables.

El modo conectado usa RPC de PostgreSQL: el servidor emite un token de participación, abre cada pregunta una sola vez, valida las alternativas, mide el tiempo, guarda las respuestas y calcula la nota. Las tablas tienen RLS y acceso directo revocado para estudiantes. La restricción única evita intentos y respuestas duplicadas; el bloqueo de fila serializa envíos simultáneos. Reenviar exactamente la misma respuesta devuelve el recibo existente. No se ejecuta código de alumnos.

Para preservar la privacidad, el modo conectado devuelve **solo la nota y posición del propio participante**. El podio con nombres se presenta en la demo; un podio compartido con alias y autorización queda pendiente. El código universitario identifica el intento, pero el token emitido por el servidor autoriza recuperar y responder. Si se pierde el navegador original, el docente deberá gestionar la recuperación manualmente. La verificación de identidad universitaria y límites de tráfico contra registros abusivos requieren endurecimiento antes del uso oficial.

Para cerrar una evaluación, el propietario puede ejecutar `update public.quiz_sessions set active=false where code='CODIGO';` desde SQL Editor. Los alumnos no tienen permisos para esa operación.

## Estructura

`src/main.tsx`: páginas y componentes visuales. `src/style.css`: identidad visual y adaptación móvil. `src/questions.ts`: enunciados de demostración. `src/service.ts`: selección entre demo y Supabase. `src/engine.mjs`: calificación exclusivamente de la demo. `supabase/migrations/`: esquema, RLS, funciones y banco inicial. `tests/`: verificaciones de lógica y respuestas Python. `scripts/seed.mjs`: regenera la segunda migración a partir del banco local.

Al compilar con las dos variables de Supabase, Vite elimina el motor de soluciones de la demo del bundle. No publiques la compilación de demostración como evaluación segura: contiene sus soluciones y su estado es editable localmente.

## Comprobaciones realizadas

- `npm test`: treinta y tres pruebas aprobadas (nota máxima, cero puntos, desempates, respuestas duplicadas, secuencia, orden de instrucciones y serialización).
- `python tests/verify_questions.py`: diez respuestas verificadas ejecutando fragmentos fijos de Python.
- `npm run build`: TypeScript y compilación de producción aprobados.
- Compilación con variables de conexión ficticias: motor local de soluciones excluido. Esto no prueba una conexión real.
- Navegador: acceso con datos ficticios, selección y confirmación, recuperación de participación, cinco tipos de pregunta y finalización con 20/20 y podio.

**Pendiente de validación:** ejecutar las migraciones en Supabase, pruebas de permisos RLS/RPC contra una base real, simultaneidad de participantes, control de intentos y recuperación en modo conectado. No hay credenciales ni un servidor PostgreSQL de pruebas en este entorno. La Fase 1 no debe considerarse validada para uso académico hasta completar estas pruebas. La sincronización corresponde a la Fase 2, que no está implementada.

## Siguiente paso

Conectar un proyecto de prueba de Supabase y completar las verificaciones pendientes de Fase 1 antes de autorizar la Fase 2. Vercel y GitHub quedan para la fase de publicación solicitada; este proyecto se entrega localmente.

## Actualización GADEST

Identidad azul y blanca basada en el logotipo proporcionado por el usuario, conservado en `public/gadest.png`. Structural Coders se presenta como un grupo de GADEST. La distribución es dos preguntas de cada una de las cinco dinámicas. El arrastre usa eventos de puntero para mouse y tacto, con alternativa de botones y teclado. El arrastre con mouse fue probado en navegador; no se comprobó en un dispositivo táctil físico.

Esta revisión usa un espacio de almacenamiento demo v2 para no mezclar intentos del banco anterior con las nuevas preguntas. Los datos v1 no se borran.

## Mecánicas de aprendizaje individual

Rachas de aciertos, mejor racha conservada, celebraciones breves a los 3/6/9 aciertos consecutivos y al completar 5/10 retos, obra de diez bloques que avanza por participación e insignias por constancia y volver a intentarlo. Las animaciones respetan prefers-reduced-motion y el sonido continúa siendo opcional.

Una ayuda por participación descarta una alternativa incorrecta en opción múltiple. Está disponible para todos desde el inicio, sin necesidad de racha, y su uso se informa al finalizar. La segunda oportunidad es práctica posterior al primer intento incorrecto: no modifica respuestas académicas, nota, tiempo competitivo ni racha. El alumno puede continuar sin practicar. No hay pérdidas de puntos, eliminación, cuenta regresiva ni premios por velocidad.

En Supabase aplica la migración 004 antes de usar esta versión: las ayudas y prácticas se validan y registran en el servidor. No se ha probado esa migración contra una base real. En demo se guardan por token en el navegador. Esta revisión no implementa un historial longitudinal entre sesiones de clase ni afirma medir retención. Una evolución recomendable es usar proyectos semanales, recapitulaciones y metas colectivas, validando participación real en varias sesiones antes de ampliar las recompensas.

Pruebas de navegador de la revisión de aprendizaje: descarte de alternativa errónea; segundo intento correcto con nota original sin cambios; persistencia de insignia al avanzar; celebración por tres aciertos consecutivos. Las doce pruebas de lógica y la compilación final pasan.

## Vista docente de demostración

Usa el selector **Docente** de la cabecera, o abre `/#docente`. La cabecera presenta GADEST arriba y Structural Coders debajo. Se eliminaron el subtítulo de pertenencia y el resumen de ayudas de los resultados del alumno; los enunciados e indicaciones tienen mayor contraste y tamaño.

El panel docente permite consultar una vista general, revisar las diez preguntas en una ventana de vista previa, buscar participantes y exportar CSV. Puedes elegir datos ficticios etiquetados o participaciones terminadas de este navegador. Las estadísticas y la distribución se calculan a partir de la fuente seleccionada; el CSV contiene la fuente y protege campos de texto que podrían interpretarse como fórmulas en Excel. El panel funciona localmente, sin autenticación docente ni acceso administrativo a Supabase. No crea salas compartidas, no implementa sincronización. La edición local se describe en la sección de autoría.

Verificación en navegador: cambio de rol, navegación entre las tres secciones, apertura y cierre de pregunta, filtrado por nombre, acción de exportación y cambio entre datos ficticios y locales.

## Estudio de autoría · varios cuestionarios

La vista **Docente → Cuestionarios** permite crear, buscar y duplicar cuestionarios. Cada uno tiene nombre, descripción, curso, ciclo, código local y configuración de ayudas y práctica. Los borradores se guardan automáticamente en este navegador. La biblioteca admite hasta 100 preguntas por cuestionario y cinco dinámicas.

Para preparar una evaluación:

1. Pulsa **Crear cuestionario** y configura su identidad y experiencia de aprendizaje.
2. Agrega preguntas y edita título, tema, instrucciones, código, respuesta correcta, explicación y ponderación. Puedes cambiar la dinámica, duplicar preguntas, moverlas y retirarlas con opción de deshacer.
3. En ordenar instrucciones, escribe entre 3 y 5 líneas en el orden correcto: el estudiante las recibe mezcladas. En encajar piezas, incluye exactamente un hueco `___` en el código.
4. Comprueba cada reto con la vista previa interactiva. La aplicación no ejecuta Python; verifica tus soluciones.
5. Pulsa **Habilitar versión en esta demo**. Se validan preguntas, soluciones, pesos y código. Los borradores incompletos se pueden guardar, pero no habilitar.
6. Usa **Probar última versión** para ingresar como estudiante con ese código en el mismo navegador.

La nota se calcula como peso obtenido / peso total × 20, sin descuentos. El cuestionario inicial conserva diez preguntas de peso 2. Las preguntas y calificaciones de cada intento se calculan con una copia de su versión: editar el borrador y habilitar una nueva versión no cambia los intentos antiguos. Los rankings se separan por cuestionario y versión; el panel docente muestra la versión y permite filtrar resultados por cuestionario. La identificación por estudiante y versión evita abrir otro intento local con los mismos datos; esto es una facilidad de la demo, no verificación de identidad institucional.

**Exportar cuestionarios / Exportar JSON** guarda borradores y soluciones en un archivo para respaldo. **Importar JSON** recupera copias como nuevos borradores y genera nuevos códigos, sin sobrescribir originales. También admite borradores incompletos. Este respaldo no contiene intentos, notas ni historial de versiones; esos datos siguen en el navegador y los resultados se exportan por separado a CSV.

Los códigos, borradores, versiones y resultados de esta autoría son locales al navegador. No hay acceso de alumnos desde otros equipos, publicación compartida, autenticación docente ni sincronización. En modo conectado a Supabase, el estudio local queda deshabilitado: las migraciones existentes siguen siendo para el banco inicial, no para administrar los cuestionarios locales. La siguiente integración necesaria es llevar esta autoría a tablas y operaciones administrativas protegidas por Supabase Auth, manteniendo versiones inmutables, y verificarla con una base real antes de uso académico.

Verificación de esta revisión: 22 pruebas automáticas aprobadas, compilación TypeScript/Vite aprobada y prueba completa en navegador creando un cuestionario de dos preguntas, configurando ayudas, probando una solución en la vista previa, habilitando su código y respondiéndolo como alumno. Con pesos 1 y 3, acertar solo la primera produjo 5/20. Las pruebas incluyen recuperación del catálogo, versiones anteriores, códigos duplicados y restauración de borradores desde JSON.

Se incluye `examples/areas-y-cargas.json` para importar un ejemplo de dos preguntas. La importación le asignará un código nuevo. También se verificó en navegador duplicar, retirar y deshacer el retiro de una pregunta.

## Modo en vivo estilo Kahoot

**Docente → En vivo** abre una sala sincronizada. El docente elige un cuestionario completo, el tiempo por pregunta (10, 20, 30 o 60 s) y si la rapidez suma puntos. La pantalla proyectable muestra un PIN de seis dígitos, un código QR y la sala de espera con los apodos que entran; el docente puede retirar un apodo. Al comenzar, cada pregunta tiene cuenta regresiva y contador de respuestas. Se cierra al agotarse el tiempo, cuando todos responden o con **Cerrar pregunta**. Después se muestran la respuesta correcta, la distribución por alternativa y la explicación, luego la clasificación y, al final, el podio con exportación CSV.

Los estudiantes entran desde **En vivo** en la cabecera, el enlace de la pantalla de ingreso o el QR (`#vivo=PIN`). Responden en mosaicos de colores con forma (opción múltiple, verdadero/falso y encajar piezas), ordenan líneas o escriben la salida. Tras cada pregunta ven si acertaron, los puntos ganados, su racha, su puesto y la explicación.

Puntuación: hasta 1000 puntos por acierto con rapidez activada (500 si responde al agotarse el tiempo) o 1000 fijos sin ella, multiplicado por el peso de la pregunta / 2. Las rachas suman 100 por acierto consecutivo, hasta 500. **Los puntos del juego no modifican la nota académica** ni los resultados del modo individual.

Cómo probarlo en la demo: abre la vista docente en una pestaña y `/#vivo=PIN` en otras pestañas del mismo navegador. En demo el canal es `BroadcastChannel`, por lo que no llega a otros equipos.

Con Supabase: el canal usa Realtime Broadcast (`vivo-PIN`) con la clave pública ya configurada; no requiere migraciones nuevas. Los teléfonos necesitan abrir la aplicación por **HTTPS** (por ejemplo, una vez publicada); una dirección `http://` de red local no permite el cifrado del navegador. En modo conectado el estudio local está deshabilitado, así que la pestaña En vivo permite importar un cuestionario JSON exportado.

Diseño y límites:

- La pantalla docente es la autoridad del juego: guarda las soluciones, mide el tiempo con su propio reloj y califica. Los jugadores nunca reciben la solución antes de la revelación.
- Cada jugador cifra sus mensajes (ECDH P-256 + AES-GCM), así nadie que escuche el canal puede leer respuestas ajenas ni responder en nombre de otro. Los mensajes del docente van firmados (ECDSA); el teléfono confía en la primera firma válida que recibe.
- Si se recarga, la pestaña docente recupera la partida desde `sessionStorage`, y el jugador vuelve a entrar con su mismo identificador. Si se cierra la pestaña docente, la partida termina.
- No se guarda nada en la base de datos: los resultados en vivo solo se exportan por CSV desde el podio. No hay autenticación docente; cualquiera con el PIN puede entrar con un apodo. Máximo 200 jugadores por sala.
- **Pendiente de validación:** no se probó contra un proyecto real de Supabase ni con teléfonos físicos. Revisa las cuotas de mensajes Realtime de tu plan con grupos grandes; la pantalla docente agrupa sus envíos cada 200 ms.

Verificación de esta revisión: 29 pruebas automáticas (7 nuevas del modelo en vivo: PIN, apodos, retiro, puntuación por rapidez y racha, respuesta única y a tiempo, revelación posterior, avance hasta el podio y validación de valores). Compilación demo y compilación con variables de Supabase ficticias aprobadas (esta última sigue sin incluir soluciones). En navegador, con una pestaña docente y dos de jugadores: ingreso por PIN, rechazo de apodo duplicado, preguntas de opción múltiple y salida escrita, cierre automático, distribución, racha, clasificación, podio en ambas vistas, reconexión del jugador y del docente tras recargar, cambio de PIN por enlace y vista móvil.

Archivos del modo en vivo: `src/live-model.mjs` (estado y puntuación, con tipos en `live-model.d.mts`), `src/live-net.ts` (canal y cifrado), `src/LiveHost.tsx` (pantalla docente), `src/LivePlayer.tsx` (teléfono), `src/LiveParts.tsx` y `src/live.css`. Las pruebas están en `tests/live.test.mjs`.

### Validar con teléfonos reales

1. Completa `.env.local` y ejecuta `npm run check:realtime`: abre dos clientes contra tu proyecto y confirma que un mensaje Broadcast llega de uno al otro.
2. Expón Vite por HTTPS con un túnel temporal: `cloudflared tunnel --url http://127.0.0.1:5173`. `vite.config.ts` acepta los dominios `*.trycloudflare.com`.
3. Copia la dirección `https://…trycloudflare.com` en `VITE_PUBLIC_URL` y reinicia Vite: el QR y el enlace de la sala apuntarán a ella aunque proyectes desde `localhost`, que conserva los cuestionarios de este navegador.
4. Vacía `VITE_PUBLIC_URL` al cerrar el túnel. La dirección cambia en cada ejecución.

## Excel del ciclo (OneDrive o Drive)

Al terminar un taller, el panel **Excel del ciclo** aparece en **Miembro GADEST → Resultados → Este navegador**, tras elegir un cuestionario en el filtro. Escribe el ciclo (`26-1`) y el nombre del taller.

- **Crear Excel nuevo:** la primera vez del ciclo. Guárdalo dentro de tu carpeta de **OneDrive** del PC (o la de Google Drive para escritorio).
- **Agregar a mi Excel del ciclo:** en los talleres siguientes, elige ese mismo archivo. La aplicación descarga una copia actualizada. Guárdala en tu carpeta sincronizada para reemplazar la versión anterior, conservando un respaldo.
- Si el archivo está abierto en Excel, ciérralo antes de agregar un taller.

El libro contiene:

| Hoja | Contenido |
|---|---|
| `Resumen` | Un estudiante por fila (código universitario), con su nota en cada taller, cantidad de talleres, promedio y podios. Usa fórmulas: si corriges una nota en una hoja de taller, se recalcula. |
| `Ganadores` | Los tres primeros puestos de cada taller. |
| `T1 …`, `T2 …` | El detalle de cada taller: código, nombre, modalidad, aciertos, nota 0-20, puntos del juego, tiempo, puesto, fecha y ✓/✗ por pregunta. Son editables. |
| `Léeme` | Indicaciones de uso. |

`Resumen`, `Ganadores` y `Léeme` se regeneran cada vez que se agrega un taller, por lo que las correcciones deben hacerse en las hojas de taller. Un mismo taller no se agrega dos veces: para reemplazarlo, borra su hoja y vuelve a agregarlo. Al cerrar el ciclo, el Excel queda como registro final; bórralo de tu nube cuando ya no lo necesites, porque contiene datos personales.

El modo en vivo usa apodos y exporta su clasificación a CSV. La consolidación por código universitario del Excel se utiliza desde las evaluaciones individuales que registran ese código. La nota depende de los aciertos y su peso; la rapidez solo afecta a los puntos del juego.

Pendiente: en modo conectado, la pestaña Resultados aún no lee las participaciones individuales desde Supabase (requiere acceso docente autenticado). El podio en vivo permite exportar un CSV de su clasificación, sin consolidación por código universitario.

Verificación: 33 pruebas automáticas (incluye un libro de dos talleres con fórmulas, rechazo de duplicados, conservación de notas editadas a mano y archivo no válido). En navegador se generó el libro desde el podio en vivo y desde Resultados, y se leyó de vuelta con ExcelJS. La exportación usa un selector de archivos simulado; no se probó abriendo el archivo en Microsoft Excel ni con la sincronización real de OneDrive. ExcelJS (`exceljs@4.4.0`) se carga solo al exportar. `npm audit` informa un aviso moderado en su dependencia `uuid` (funciones v3/v5/v6 que exceljs no usa). `npm test` necesita Node 22.6 o superior.

## Modo práctica estilo Quizizz

Cada cuestionario puede habilitar una práctica en formato de juego: **Docente → Cuestionarios → Configuración → Modo práctica tipo juego**. Se configuran el temporizador por pregunta (sin límite, 10, 20, 30 o 60 s), los puntos por rapidez (requieren temporizador), los potenciadores y el ranking entre preguntas. Viene desactivado por defecto. Los ajustes llegan a los estudiantes al **habilitar la siguiente versión**, como el resto de la configuración.

El estudiante escribe el código del cuestionario y pulsa **Practicar como juego · sin nota**. Solo necesita un apodo; no se pide código universitario. El recorrido individual a su ritmo incluye una barra de tiempo, puntos y racha. Al agotarse el tiempo, la pregunta cuenta como fallo. Las alternativas aparecen en mosaicos de colores y se responde con un toque. Tras cada pregunta se muestran la respuesta correcta, la explicación, los puntos obtenidos y la posición frente a las prácticas anteriores en ese mismo punto del recorrido. Al final aparecen las mejores marcas por apodo y la opción de jugar otra vez.

Puntuación: igual que en vivo (hasta 1000 × peso ÷ 2 con rapidez, la mitad si responde al límite; 1000 × peso ÷ 2 sin temporizador o sin rapidez; bono de racha de 100 por acierto consecutivo, hasta 500).

Potenciadores: se recibe uno al empezar y otro cada tres aciertos seguidos, hasta tener tres. Cada uno se usa una vez y actúa solo en la pregunta actual.

- **Puntos dobles:** duplica los puntos si aciertas.
- **50/50:** retira dos alternativas incorrectas en opción múltiple o encajar piezas.
- **Congelar tiempo:** detiene el reloj; solo existe si hay temporizador.
- **Escudo de racha:** conserva la racha si fallas.

Límites: la práctica **no crea intentos académicos, no cambia notas** ni aparece en los resultados docentes. Las marcas se guardan en este navegador (`sc-practice-v1`, hasta 200 por versión), por lo que el ranking compara solo prácticas hechas en el mismo equipo. Funciona con los cuestionarios del estudio local: **en modo conectado a Supabase el botón no aparece**, porque las soluciones no se envían al navegador y harían falta funciones de servidor para calificar y un ranking compartido.

Archivos: `src/practice-model.mjs` (reglas, con tipos en `practice-model.d.mts`), `src/PracticeGame.tsx`, `src/practice.css` y `tests/practice.test.mjs`. La configuración se guarda como `game` en cada cuestionario, se copia al duplicar y se valida al importar JSON.

Verificación: 8 pruebas nuevas del modelo (configuración por defecto, rapidez con y sin temporizador, tiempo agotado, puntos dobles, escudo, 50/50, congelar, premios por racha con tope, ranking por pregunta, mejor marca por apodo y fin del recorrido). La prueba del catálogo se ajustó para resolver el nuevo módulo. En navegador, sobre una copia del proyecto en modo demostración: se activó el modo en el estudio, se habilitó la versión 2 de PY2026 y se jugaron dos partidas completas (Ana y Luis). Se comprobaron puntos dobles, tiempo agotado, premio por racha, ranking entre preguntas, podio final y vista móvil.

## Reorganización: Aspirante y Miembro GADEST

La cabecera tiene dos espacios: **Aspirante** y **Miembro GADEST**. Se mantiene compatibilidad con el enlace anterior `#docente`; el nuevo acceso es `#miembro`.

- Aspirante reúne Modo en vivo (ingreso con PIN) y Modo práctica (recorrido tipo Quizizz). La evaluación individual con nota se conserva como acceso secundario desplegable.
- Miembro GADEST abre Mis cuestionarios y permite crear, subir JSON, editar, configurar, exportar y probar los recorridos, además de organizar partidas en vivo y consultar resultados.
- El acceso de miembros sigue siendo una vista de demostración; no implementa autorización por cuentas.

Ejecuta `npm run dev:demo` para revisar la autoría y la práctica locales sin cambiar tus credenciales de Supabase. En modo normal conectado, la práctica compartida sigue pendiente y se informa en pantalla. Cada cuestionario debe tener habilitado su modo práctica en la configuración y en la versión que se pone a disposición del aspirante.

Se recuperaron `CycleExport.tsx` y `cycle-excel.ts`. La exportación de ciclo conserva talleres y permite cargar un Excel existente para descargar una copia actualizada. Esta revisión **no escribe directamente sobre archivos de OneDrive**: guarda la nueva descarga en tu carpeta sincronizada. Rechaza códigos de aspirante duplicados dentro del mismo taller para evitar consolidar notas ambiguas. Las correcciones manuales de las hojas de taller se conservan; las pruebas de Excel vuelven a pasar.

El QR de las salas ahora utiliza `VITE_PUBLIC_URL` cuando está configurada. Este ajuste no añade autenticación ni convierte la pestaña anfitriona en almacenamiento permanente.

Verificación de esta reorganización: 42 pruebas automáticas pasan, incluidas las de Excel y los enlaces. En el navegador se verificaron ambos espacios, la biblioteca editable, la configuración de partidas y el recorrido completo de práctica de dos preguntas con 2100 puntos de juego. No se probó una nueva partida con teléfonos físicos ni autorización real de miembros.

## Evaluación individual calificada en el servidor

La evaluación individual ya no se califica en el navegador. Esto aplica al servidor local (`npm run dev:demo`, `npm start` o un túnel) y a la nube (Vercel + Supabase). El navegador recibe las preguntas **sin soluciones ni explicaciones**. El servidor:

- abre cada pregunta y mide el tiempo con su propio reloj;
- valida la secuencia y el formato de cada respuesta, califica y devuelve la explicación después de responder;
- calcula la nota sobre 20 y guarda el intento.

Las ayudas (descartar una alternativa) y las segundas oportunidades también se validan en el servidor. La práctica posterior no cambia la nota. Ninguna compilación (demo ni nube) incluye ya el motor de soluciones.

- **Rutas:** `POST /api/eval/join|recover|question|submit|results|learning|hint|practice` (públicas, protegidas por un token por participación) y `GET /api/member/eval-results` (solo miembros, únicamente de los cuestionarios que pueden ver en su biblioteca).
- **Identidad del intento:** el token se entrega una sola vez y solo se guarda su hash. Un mismo código universitario no puede abrir otra participación del mismo cuestionario y versión. Si se pierde el navegador original, un miembro debe gestionar la recuperación.
- **Privacidad:** el aspirante ve solo su nota y su posición, no los nombres de otros. Los miembros ven los resultados en **Resultados** y pueden pasarlos al Excel del ciclo.
- **Práctica y evaluación separadas:** un código con *práctica tipo juego* activada no se acepta como evaluación, porque la práctica entrega sus soluciones al navegador. Ahora `/api/practice` solo sirve cuestionarios con práctica activada. Si un taller de práctica y su evaluación comparten preguntas, practicar revela esas respuestas: usa preguntas distintas.
- **Almacenamiento:** en la nube, la tabla `sc_web_attempts` (`supabase/migrations/007_server_evaluation.sql`, que debes ejecutar en SQL Editor antes de publicar), con RLS y acceso solo para `service_role`. En el servidor local, `.private/attempts.json`. Los intentos antiguos guardados solo en `localStorage` no se migran.
- **Límites:** 30 ingresos cada 15 minutos por IP. Si dos pestañas envían a la vez, solo una gana; la otra recibe un aviso para recargar.

Archivos: `server/evaluation.mjs` (reglas comunes), `server/local-attempts.mjs`, los cambios en `server/cloud-api.mjs` y `server/member-api.mjs`, `src/service.ts` y `src/Teacher.tsx`. Pruebas: `tests/evaluation.test.mjs`, 7 pruebas que cubren reglas, servidor local por HTTP y adaptador de Supabase simulado.

Verificación: 71 pruebas aprobadas, TypeScript sin errores y compilaciones demo y nube sin el motor de soluciones. En navegador, sobre una copia aislada del proyecto, se comprobó:

- rechazo de un código de práctica;
- respuesta del servidor sin soluciones;
- diez preguntas respondidas con nota 16/20 calculada en el servidor;
- archivo de intentos sin el token en claro;
- panel de miembros mostrando el resultado y habilitando el Excel del ciclo.

**Pendiente:** ejecutar la migración 007 y probar contra el proyecto real de Supabase y Vercel.

## Historial de partidas en vivo: nota y eliminación

- **Nota por aciertos:** cada partida guardada muestra la nota sobre 20 de cada participante (aciertos ÷ preguntas × 20, con un decimal). También aparece en el CSV del historial y en el del podio. Los puntos del juego siguen mostrándose aparte.
- **Eliminar partidas:** quien guardó la partida ve **Eliminar partida**, que pide confirmación y borra definitivamente. Los demás miembros pueden verla y descargarla, pero no borrarla; el servidor lo comprueba. En el servidor local, las partidas guardadas antes de este cambio no tienen dueño registrado y cualquier miembro puede borrarlas.
- **Supabase:** ejecuta `supabase/migrations/008_live_history_delete.sql`, que da permiso de borrado al servidor. Sin ella, eliminar responde «No se pudo acceder al almacenamiento compartido».

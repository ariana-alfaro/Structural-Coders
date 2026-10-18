begin;
insert into public.courses(id,name) values('ad8d7ce8-67b7-465a-9f37-9d9e3e049715','Structural Coders');
insert into public.academic_cycles(id,name) values('acee0550-d874-4f9b-8791-5cce03320cb9','2026-1');
insert into public.quizzes(id,course_id,cycle_id,title) values('318b5ea4-5b74-4f95-b1ee-47ab95f3f353','ad8d7ce8-67b7-465a-9f37-9d9e3e049715','acee0550-d874-4f9b-8791-5cce03320cb9','Cuestionario N.º 1 — Fundamentos de Python');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(1,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Un giro inesperado','Slicing de cadenas','choice','La cadena tiene una nueva dirección. ¿Qué aparecerá en la terminal?','s = ''Structural Coders''
print(s[::-1])','["sredoC larutcurtS","Structural Coders","Coders Structural","Structural sredoC"]'::jsonb,'0'::jsonb,'El paso -1 recorre toda la cadena desde el final hacia el inicio.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(2,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Repartir sin decimales','División entera','input','Tenemos 17 elementos en grupos de 5. Escribe la salida en la terminal, sin elegir alternativas.','a, b = 17, 5
resultado = a // b
print(resultado)','[]'::jsonb,'"3"'::jsonb,'// devuelve el cociente entero: 17 dividido entre 5 da 3 y sobran 2.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(3,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Una cadena que explica','F-strings','choice','Esta f-string muestra la expresión y su valor. ¿Cuál es la salida exacta?','print(f''{2**10 = }'')','["1024","2**10 = 20","2**10 = 1024","{2**10 = }"]'::jsonb,'2'::jsonb,'El signo = dentro de la f-string conserva el texto de la expresión; ** calcula la potencia.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(4,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Cambio de identidad','Tipado dinámico','boolean','¿Puede una variable guardar primero un entero y luego una cadena sin declarar su tipo?','altura = 12
altura = ''doce''','["Verdadero","Falso"]'::jsonb,'0'::jsonb,'En Python, una misma variable puede referenciar valores de distintos tipos.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(5,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','La pieza que falta','Operadores aritméticos','blank','Arrastra el operador al espacio del editor para calcular el área de la losa. También puedes tocar la pieza.','base = 8
ancho = 5
area = base ___ ancho
print(area)  # 40','["+","**","/","*"]'::jsonb,'3'::jsonb,'El operador * multiplica: 8 × 5 = 40.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(6,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Vacío, pero válido','Truthy y falsy','boolean','Una lista vacía se evalúa como True al convertirla a booleano. ¿Es correcto?','elementos = []
print(bool(elementos))','["Verdadero","Falso"]'::jsonb,'1'::jsonb,'Las listas vacías son falsy: bool([]) devuelve False.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(7,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Cada dato en su lugar','Listas, tuplas y diccionarios','order','Construye el diccionario, agrega el material y muéstralo. Arrastra las líneas hasta formar el programa.',NULL,'["print(proyecto[''material''])","proyecto[''material''] = ''acero''","proyecto = {''pisos'': 4}"]'::jsonb,'[2,1,0]'::jsonb,'Primero crea el diccionario, luego asigna acero a la clave material y finalmente consulta esa clave.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(8,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','El punto de encuentro','Operaciones con conjuntos','blank','Lleva una pieza al editor para obtener los elementos comunes a los dos conjuntos.','grupo_a = {1, 2, 3}
grupo_b = {2, 3, 4}
comunes = grupo_a ___ grupo_b
print(comunes)  # {2, 3}','["|","&","-","^"]'::jsonb,'1'::jsonb,'El operador & calcula la intersección: los elementos presentes en ambos conjuntos.');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(9,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Construye la secuencia','Modificación de listas','order','Arrastra las líneas: primero crea la lista, después agrega un nivel y finalmente muestra el resultado. También puedes usar las flechas.',NULL,'["print(niveles)","niveles.append(3)","niveles = [1, 2]"]'::jsonb,'[2,1,0]'::jsonb,'Primero se crea la lista, después append agrega el 3 y finalmente print muestra [1, 2, 3].');
insert into public.questions(id,quiz_id,title,topic,type,brief,code,options,solution,explanation) values(10,'318b5ea4-5b74-4f95-b1ee-47ab95f3f353','Precisión de ingeniero','Formato de números','input','El informe necesita exactamente dos decimales. Escribe la salida exacta, incluyendo los ceros finales.','carga = 12.5
print(f"{carga:.2f}")','[]'::jsonb,'"12.50"'::jsonb,'El formato .2f muestra dos cifras decimales, incluyendo el cero final.');
insert into public.quiz_sessions(quiz_id,code) values('318b5ea4-5b74-4f95-b1ee-47ab95f3f353',upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)));
commit;
-- Consultar el código generado: select code from public.quiz_sessions;

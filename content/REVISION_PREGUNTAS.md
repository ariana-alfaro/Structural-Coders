# Banco de revisión · 14 cuestionarios · 140 preguntas
Para revisar y editar desde Miembro GADEST. Incluye soluciones; no compartir como hoja de evaluación.

## Taller 1 · Python: primeros cimientos · Práctica · S1PRAC

### 1. El tipo de una medición (choice)

¿Qué tipo devuelve esta conversión?

```python
longitud = float("6.5")
print(type(longitud).__name__)
```

1. `int`
2. `bool`
3. `float`
4. `str`

**Solución:** 3. float convierte una cadena numérica a punto flotante.

### 2. Repartir sin decimales (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
print(23 // 4)
```


**Solución:** 5. La división entera redondea hacia abajo: 23 // 4 es 5.

### 3. Una potencia para el área (blank)

Arrastra al hueco la pieza que completa el código.

```python
lado = 6
area = lado ___ 2
```

1. `^`
2. `**`
3. `//`
4. `%`

**Solución:** 2. En Python ** es potencia; ^ corresponde a XOR de bits.

### 4. La primera sección (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `base = 4`
2. `altura = base - 1`
3. `area = base * altura`
4. `print(area)`

**Solución:** 1 → 2 → 3 → 4. Las variables deben existir antes del cálculo y del print. Base y altura se definen en ese orden para este reto.

### 5. Una lista que crece (boolean)

Una lista permite agregar elementos con append después de crearla.

1. `Verdadero`
2. `Falso`

**Solución:** 1. Las listas son mutables y append añade un elemento al final.

### 6. La última etiqueta (choice)

¿Qué elemento se obtiene?

```python
vigas = ["V-101", "V-102", "V-103"]
print(vigas[-1])
```

1. `IndexError`
2. `V-101`
3. `V-102`
4. `V-103`

**Solución:** 4. El índice -1 selecciona el último elemento.

### 7. Limpiar una entrada (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
print("  GADEST  ".strip().lower())
```


**Solución:** gadest. strip elimina espacios exteriores y lower pasa a minúsculas.

### 8. Leer sin KeyError (blank)

Arrastra al hueco la pieza que completa el código.

```python
material = {"nombre": "Acero"}
print(material.___("fy", 420))
```

1. `append`
2. `get`
3. `keys`
4. `popitem`

**Solución:** 2. get permite indicar un valor por defecto si falta la clave.

### 9. Intercambio de luces (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `a, b = 4, 7`
2. `a, b = b, a`
3. `mayor = a`
4. `print(mayor)`

**Solución:** 1 → 2 → 3 → 4. Primero se definen a y b, luego se intercambian; mayor queda en 7.

### 10. Colección sin duplicados (choice)

Quieres guardar códigos únicos sin exigir un orden. ¿Qué estructura eliges?

1. `str`
2. `list`
3. `tuple`
4. `set`

**Solución:** 4. Un set representa una colección de elementos únicos.

## Taller 1 · Python: primeros cimientos · En vivo · S1VIVO

### 1. El residuo del reparto (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
print(29 % 6)
```


**Solución:** 5. 29 = 6 × 4 + 5; el módulo entrega el residuo.

### 2. Una cadena no es un número (choice)

¿Qué imprime la consola?

```python
print("1" + "2")
```

1. `12`
2. `3`
3. `TypeError`
4. `111`

**Solución:** 1. El operador + concatena dos cadenas.

### 3. Corte de un registro (blank)

Arrastra al hueco la pieza que completa el código.

```python
codigos = [10, 20, 30, 40]
print(codigos[1:___])
```

1. `1`
2. `3`
3. `-4`
4. `0`

**Solución:** 2. El límite superior no se incluye: índices 1 y 2 producen [20, 30].

### 4. Copiar antes de cambiar (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `original = [2, 4]`
2. `copia = original.copy()`
3. `copia.append(6)`
4. `print(original)`

**Solución:** 1 → 2 → 3 → 4. La copia superficial basta para esta lista de enteros: original conserva [2, 4].

### 5. Tupla de coordenadas (boolean)

Puedes sustituir una coordenada de una tupla mediante punto[0] = 8.

1. `Verdadero`
2. `Falso`

**Solución:** 2. Las tuplas no admiten asignación a sus posiciones.

### 6. Verdad en una colección (choice)

¿Cuál expresión produce False?

1. `bool([0])`
2. `bool("0")`
3. `bool([])`
4. `bool(-1)`

**Solución:** 3. La lista vacía es falsa; una lista no vacía, una cadena no vacía y -1 son verdaderos.

### 7. Mostrar solo lo necesario (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
valor = 3.14159
print(f"{valor:.2f}")
```


**Solución:** 3.14. El formato .2f muestra dos cifras decimales.

### 8. Dos condiciones simultáneas (blank)

Arrastra al hueco la pieza que completa el código.

```python
luz = 6
print(luz > 3 ___ luz < 8)
```

1. `in`
2. `is`
3. `and`
4. `or not`

**Solución:** 3. and exige que ambas comparaciones sean verdaderas.

### 9. Acumular una carga (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `carga = 10`
2. `carga += 5`
3. `carga *= 2`
4. `print(carga)`

**Solución:** 1 → 2 → 3 → 4. Tras sumar 5 y multiplicar por 2, carga vale 30.

### 10. Una copia con objetos internos (choice)

¿Qué herramienta evita compartir listas anidadas con el original?

1. `list.reverse`
2. `str.copy`
3. `copy.deepcopy`
4. `dict.keys`

**Solución:** 3. deepcopy copia recursivamente los objetos internos; copy superficial los comparte.

## Taller 2 · Markdown, flujo y funciones · Práctica · S2PRAC

### 1. Una memoria legible (choice)

¿Cómo escribes un encabezado de segundo nivel en Markdown?

1. `< Geometría`
2. `## Geometría`
3. `** Geometría`
4. `// Geometría`

**Solución:** 2. Dos signos # seguidos de un espacio crean un encabezado de nivel 2.

### 2. Un límite que no entra (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
print(list(range(2, 8, 2)))
```


**Solución:** [2, 4, 6]. range incluye el inicio y excluye el límite final.

### 3. La función devuelve (blank)

Arrastra al hueco la pieza que completa el código.

```python
def area(b, h):
    ___ b * h
```

1. `return`
2. `yield from`
3. `break`
4. `print`

**Solución:** 1. return entrega el resultado al código que llamó la función.

### 4. Definir y después usar (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `def doble(x):`
2. `    return 2 * x`
3. `carga = doble(15)`
4. `print(carga)`

**Solución:** 1 → 2 → 3 → 4. La definición y su cuerpo van antes de la llamada; la salida es 30.

### 5. Negrita en la memoria (boolean)

En Markdown, **Carga muerta** representa texto en negrita.

1. `Verdadero`
2. `Falso`

**Solución:** 1. Los pares de dos asteriscos delimitan negrita.

### 6. Una ruta con nombre (choice)

¿Cuál es un enlace Markdown válido?

1. `(GADEST)[https://example.org]`
2. `[GADEST](https://example.org)`
3. `{GADEST}(https://example.org)`
4. `<GADEST|https://example.org>`

**Solución:** 2. Primero va el texto entre corchetes y luego la dirección entre paréntesis.

### 7. Un valor predeterminado (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
def potencia(x, n=2):
    return x ** n
print(potencia(5))
```


**Solución:** 25. Al omitir n se usa el valor 2, por lo que 5² = 25.

### 8. Filtrar las cargas pares (blank)

Arrastra al hueco la pieza que completa el código.

```python
pares = [x for x in range(1, 7) ___ x % 2 == 0]
```

1. `if`
2. `while`
3. `else`
4. `for`

**Solución:** 1. La condición if al final filtra los elementos de la comprensión.

### 9. Una lectura que puede fallar (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `try:`
2. `    luz = float("seis")`
3. `except ValueError:`
4. `    luz = 0`
5. `print(luz)`

**Solución:** 1 → 2 → 3 → 4 → 5. float falla con ValueError y el bloque except asigna 0.

### 10. No terminar todavía (choice)

¿Qué instrucción salta a la siguiente iteración sin cerrar el bucle?

1. `return`
2. `continue`
3. `break`
4. `raise`

**Solución:** 2. continue omite el resto de la iteración actual; break finaliza el bucle.

## Taller 2 · Markdown, flujo y funciones · En vivo · S2VIVO

### 1. Suma flexible (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
def total(*cargas):
    return sum(cargas)
print(total(8, 12, 5))
```


**Solución:** 25. *cargas recoge los argumentos posicionales y sum los acumula.

### 2. Figura en el informe (choice)

¿Qué distingue una imagen de un enlace en Markdown?

1. `El sufijo #`
2. `El uso de //`
3. `La palabra image obligatoria`
4. `El prefijo !`

**Solución:** 4. La imagen usa ![texto alternativo](ruta), con ! al principio.

### 3. Enumerar desde el primer piso (blank)

Arrastra al hueco la pieza que completa el código.

```python
for numero, piso in ___(["P1", "P2"], start=1):
    print(numero, piso)
```

1. `enumerate`
2. `sorted`
3. `zip`
4. `range`

**Solución:** 1. enumerate entrega índice y valor; start=1 ajusta el inicio del contador.

### 4. Iterar con una condición (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `n = 1`
2. `while n < 3:`
3. `    n += 1`
4. `print(n)`

**Solución:** 1 → 2 → 3 → 4. El while incrementa n hasta 3; el print debe quedar fuera del bucle.

### 5. El generador no es una lista (boolean)

Una función con yield puede producir valores a demanda sin construir toda una lista.

1. `Verdadero`
2. `Falso`

**Solución:** 1. yield suspende la ejecución y permite continuar al pedir el siguiente valor.

### 6. El parámetro por nombre (choice)

¿Qué recibe **datos dentro de una función?

1. `Una tupla de posicionales`
2. `Un diccionario de argumentos nombrados`
3. `Una lista de funciones`
4. `Una cadena`

**Solución:** 2. **kwargs recoge pares nombre-valor en un diccionario.

### 7. Una transformación breve (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
doble = lambda x: x * 2
print(doble(9))
```


**Solución:** 18. La lambda evalúa x * 2 para el argumento 9.

### 8. Raíz con un módulo (blank)

Arrastra al hueco la pieza que completa el código.

```python
import math
print(math.___(81))
```

1. `square`
2. `pow2`
3. `sqrt`
4. `root`

**Solución:** 3. math.sqrt calcula la raíz cuadrada y devuelve 9.0.

### 9. Clasificar una nota (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `nota = 16`
2. `if nota >= 14:`
3. `    nivel = "Logrado"`
4. `else:`
5. `    nivel = "En proceso"`

**Solución:** 1 → 2 → 3 → 4 → 5. if y else deben acompañarse de sus bloques; 16 cumple la condición.

### 10. Atrapar el problema correcto (choice)

¿Qué excepción corresponde a dividir un número por cero?

1. `ZeroDivisionError`
2. `ImportError`
3. `IndexError`
4. `KeyError`

**Solución:** 1. La división por cero lanza ZeroDivisionError.

## Taller 3 · Datos y gráficos estructurales · Práctica · S3PRAC

### 1. Vectorizar una carga (choice)

Con import numpy as np, ¿qué crea un array numérico?

1. `np.array([10, 20])`
2. `np.frame(10, 20)`
3. `np.list(10, 20)`
4. `np.table([10, 20])`

**Solución:** 1. np.array construye un ndarray a partir de una lista.

### 2. La forma de la matriz (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
import numpy as np
print(np.zeros((2, 3)).shape)
```


**Solución:** (2, 3). La forma indica dos filas y tres columnas.

### 3. De fuerzas a esfuerzos (blank)

Arrastra al hueco la pieza que completa el código.

```python
import numpy as np
P = np.array([100, 200])
sigma = P ___ 0.02
```

1. `// 100 +`
2. `and`
3. `@`
4. `/`

**Solución:** 4. La división de un array por un escalar se aplica a cada elemento.

### 4. Una curva con ejes (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import matplotlib.pyplot as plt`
2. `fig, ax = plt.subplots()`
3. `ax.plot([0, 1], [0, 2])`
4. `ax.set_xlabel("x (m)")`
5. `plt.show()`

**Solución:** 1 → 2 → 3 → 4 → 5. Importa, crea los ejes, añade datos, etiqueta y muestra la figura.

### 5. Puntos independientes (boolean)

Un gráfico scatter es adecuado para comparar pares de mediciones sin unirlos obligatoriamente.

1. `Verdadero`
2. `Falso`

**Solución:** 1. scatter representa pares de valores como puntos.

### 6. Resolver sin invertir (choice)

¿Qué llamada resuelve K @ u = F para una K cuadrada no singular?

1. `np.mean(K, F)`
2. `np.linspace(K, F)`
3. `np.zeros(K, F)`
4. `np.linalg.solve(K, F)`

**Solución:** 4. solve obtiene la solución del sistema sin escribir una inversa explícita.

### 7. Carga total por fila (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
import numpy as np
a = np.array([[2, 3], [4, 5]])
print(a.sum(axis=1).tolist())
```


**Solución:** [5, 9]. axis=1 reduce las columnas de cada fila: 2+3 y 4+5.

### 8. Seleccionar columnas (blank)

Arrastra al hueco la pieza que completa el código.

```python
import pandas as pd
df = pd.DataFrame({"P": [10, 20], "L": [3, 4]})
print(df[___].sum())
```

1. `"Z"`
2. `"L"`
3. `"P"`
4. `0`

**Solución:** 3. df["P"] selecciona la serie de cargas cuya suma es 30.

### 9. Una tabla de esfuerzos (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import pandas as pd`
2. `df = pd.DataFrame({"P": [100], "A": [2]})`
3. `df["sigma"] = df["P"] / df["A"]`
4. `print(df["sigma"].iloc[0])`

**Solución:** 1 → 2 → 3 → 4. Primero se crea la tabla; luego se calcula la columna derivada y se consulta.

### 10. Guardar una figura (choice)

¿Qué método guarda fig como un archivo PNG?

1. `fig.save("curva.png")`
2. `fig.savefig("curva.png")`
3. `fig.export_excel("curva.png")`
4. `fig.to_csv("curva.png")`

**Solución:** 2. savefig exporta una figura a PNG y otros formatos admitidos.

## Taller 3 · Datos y gráficos estructurales · En vivo · S3VIVO

### 1. Un rango equiespaciado (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
import numpy as np
print(np.linspace(0, 6, 4).tolist())
```


**Solución:** [0.0, 2.0, 4.0, 6.0]. Cuatro puntos igualmente espaciados incluyen ambos extremos por defecto.

### 2. Etiquetas o posiciones (choice)

¿Qué acceso de Pandas utiliza posiciones enteras?

1. `.label`
2. `.name`
3. `.loc`
4. `.iloc`

**Solución:** 4. iloc usa posiciones; loc usa etiquetas.

### 3. El producto de matrices (blank)

Arrastra al hueco la pieza que completa el código.

```python
import numpy as np
A = np.eye(2)
B = np.array([[1, 2], [3, 4]])
C = A ___ B
```

1. `//`
2. `*`
3. `@`
4. `%`

**Solución:** 3. @ realiza el producto matricial; * opera elemento a elemento.

### 4. Exportar un resumen (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import pandas as pd`
2. `df = pd.DataFrame({"Piso": [1, 1, 2], "P": [2, 3, 4]})`
3. `resumen = df.groupby("Piso")["P"].sum()`
4. `resumen.to_csv("cargas.csv")`

**Solución:** 1 → 2 → 3 → 4. Se construye la tabla, se agrupa por piso, se suma y se exporta.

### 5. Filas y columnas transpuestas (boolean)

Para un array de forma (2, 4), su transpuesta .T tiene forma (4, 2).

1. `Verdadero`
2. `Falso`

**Solución:** 1. La transposición intercambia los ejes de un array bidimensional.

### 6. Un filtro de demanda (choice)

¿Qué selecciona df[df["Pu"] > 500]?

1. `Filas con Pu menor que 500`
2. `Las primeras 500 filas`
3. `Solo la columna Pu`
4. `Filas con Pu mayor que 500`

**Solución:** 4. La condición produce una máscara booleana que filtra las filas.

### 7. El valor medio (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
import numpy as np
print(float(np.mean([20, 30, 40])))
```


**Solución:** 30.0. La media es la suma 90 dividida entre tres observaciones.

### 8. Barras para los pisos (blank)

Arrastra al hueco la pieza que completa el código.

```python
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
ax.___(["P1", "P2"], [80, 60])
```

1. `scatter3d`
2. `bar`
3. `histogram`
4. `tableplot`

**Solución:** 2. bar dibuja barras verticales para comparar categorías.

### 9. Preparar una máscara numérica (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import numpy as np`
2. `cargas = np.array([10, 30, 50])`
3. `mascara = cargas > 20`
4. `mayores = cargas[mascara]`
5. `print(mayores.tolist())`

**Solución:** 1 → 2 → 3 → 4 → 5. La comparación produce la máscara usada después para obtener [30, 50].

### 10. Un dato ausente (choice)

¿Qué método rellena valores faltantes con cero en una serie?

1. `.astype_missing(0)`
2. `.empty(0)`
3. `.fillna(0)`
4. `.drop_duplicates(0)`

**Solución:** 3. fillna sustituye valores ausentes; que cero sea apropiado depende del contexto.

## Taller 4 · Objetos que representan estructuras · Práctica · S4PRAC

### 1. Plantilla y ejemplar (choice)

En Viga(6, 25), ¿qué representa Viga si es una clase?

1. `Una plantilla para crear objetos`
2. `Una propiedad de solo lectura`
3. `Una excepción`
4. `Un archivo CSV`

**Solución:** 1. La clase define la estructura y el comportamiento de sus instancias.

### 2. Un atributo propio (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
class Nodo:
    def __init__(self, x):
        self.x = x
n = Nodo(7)
print(n.x)
```


**Solución:** 7. El constructor guarda el argumento en el atributo x de esa instancia.

### 3. El área es comportamiento (blank)

Arrastra al hueco la pieza que completa el código.

```python
class Rectangulo:
    def area(self):
        return ___.b * self.h
```

1. `super`
2. `cls`
3. `self`
4. `Rectangulo()`

**Solución:** 3. self referencia la instancia y permite acceder a sus atributos.

### 4. Crear una sección y calcular (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `class Seccion:`
2. `    def area(self):`
3. `        return 3 * 4`
4. `s = Seccion()`
5. `print(s.area())`

**Solución:** 1 → 2 → 3 → 4 → 5. El método debe pertenecer a la clase y la instancia se crea antes de usarlo.

### 5. Objetos independientes (boolean)

Dos instancias pueden tener valores diferentes para un mismo atributo de instancia.

1. `Verdadero`
2. `Falso`

**Solución:** 1. Cada objeto conserva sus propios atributos, salvo que se comparta un objeto explícitamente.

### 6. Cerrar la puerta al dato inválido (choice)

¿Dónde encaja la validación de fc antes de asignarla mediante una propiedad?

1. `En __str__ obligatoriamente`
2. `En el nombre del archivo`
3. `En @fc.setter`
4. `Solo en print`

**Solución:** 3. El setter controla las asignaciones y puede rechazar valores no positivos.

### 7. Reacción de una viga simple (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
class Viga:
    def reaccion(self):
        return self.w * self.L / 2
v = Viga()
v.w, v.L = 20, 6
print(v.reaccion())
```


**Solución:** 60.0. Con carga uniforme, la reacción por apoyo es wL/2 en este modelo.

### 8. Reutilizar el constructor padre (blank)

Arrastra al hueco la pieza que completa el código.

```python
class Acero(Material):
    def __init__(self):
        ___().__init__("Acero", 200000)
```

1. `self`
2. `super`
3. `parentclass`
4. `cls`

**Solución:** 2. super() permite delegar en la implementación de la clase base.

### 9. Una clase de datos (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `from dataclasses import dataclass`
2. `@dataclass`
3. `class Punto:`
4. `    x: float`
5. `p = Punto(2.5)`

**Solución:** 1 → 2 → 3 → 4 → 5. El decorador dataclass debe aparecer inmediatamente antes de la clase.

### 10. Construir con otros objetos (choice)

Una Viga guarda una Seccion y un Material como atributos. ¿Qué relación ejemplifica?

1. `Indexación negativa`
2. `Recursión obligatoria`
3. `Composición`
4. `Conversión a entero`

**Solución:** 3. La composición permite formar un objeto con otros objetos colaboradores.

## Taller 4 · Objetos que representan estructuras · En vivo · S4VIVO

### 1. Un cálculo común (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
class Cuadrado:
    def area(self):
        return 4 * 4
class Rectangulo:
    def area(self):
        return 3 * 5
print(sum(s.area() for s in [Cuadrado(), Rectangulo()]))
```


**Solución:** 31. Ambos objetos responden a area(); 16 + 15 = 31, ejemplo de polimorfismo.

### 2. La propiedad se consulta (choice)

Con @property sobre def area(self), ¿cómo se lee desde s?

1. `s.get.property`
2. `s.area`
3. `s.area()`
4. `property(s)`

**Solución:** 2. Una property se consulta como atributo, aunque su valor se calcule con un método.

### 3. Una lista por sistema (blank)

Arrastra al hueco la pieza que completa el código.

```python
from dataclasses import dataclass, field
@dataclass
class Sistema:
    vigas: list = field(___=list)
```

1. `default`
2. `default_factory`
3. `init_value`
4. `shared`

**Solución:** 2. default_factory crea una lista nueva para cada instancia.

### 4. Un catálogo de tipos (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `from enum import Enum`
2. `class MaterialTipo(Enum):`
3. `    ACERO = "acero"`
4. `tipo = MaterialTipo.ACERO`
5. `print(tipo.value)`

**Solución:** 1 → 2 → 3 → 4 → 5. Enum declara miembros con nombres; .value recupera el valor asociado.

### 5. Un resultado que no se reasigna (boolean)

@dataclass(frozen=True) impide la reasignación normal de los campos de la instancia.

1. `Verdadero`
2. `Falso`

**Solución:** 1. frozen=True genera restricciones de asignación; no hace profundamente inmutables todos los objetos contenidos.

### 6. Una clase, una tarea (choice)

¿Qué diseño sigue mejor la responsabilidad única?

1. `Cada clase depende de cada botón`
2. `Una clase calcula, dibuja, autentica y envía correos`
3. `Una clase Seccion calcula sus propiedades geométricas`
4. `Todo se guarda en variables globales`

**Solución:** 3. Una responsabilidad clara reduce acoplamiento y facilita las pruebas.

### 7. Elegir la mayor demanda (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
demandas = [("V1", 80), ("V2", 120), ("V3", 95)]
print(max(demandas, key=lambda v: v[1])[0])
```


**Solución:** V2. La clave compara el segundo elemento de cada tupla; 120 es el máximo.

### 8. Validación antes del guardado (blank)

Arrastra al hueco la pieza que completa el código.

```python
def validar(fc):
    if fc <= 0:
        ___ ValueError("fc debe ser positiva")
```

1. `raise`
2. `except`
3. `yield from`
4. `return from`

**Solución:** 1. raise interrumpe la operación y comunica un dato inválido.

### 9. Guardar una viga en el sistema (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `class Sistema:`
2. `    def __init__(self):`
3. `        self.vigas = []`
4. `s = Sistema()`
5. `s.vigas.append("V-101")`

**Solución:** 1 → 2 → 3 → 4 → 5. Se define e inicializa la colección antes de agregar una viga.

### 10. Herencia con significado (choice)

¿Cuál relación describe mejor una herencia razonable?

1. `Seccion es un ArchivoCSV`
2. `Concreto es un Material`
3. `Viga es una ListaDeUsuarios`
4. `Material es una Ventana`

**Solución:** 2. La herencia expresa una relación es-un entre el subtipo y el tipo base.

## Taller 5 · Automatización con la API de SAP2000 · Práctica · S5PRAC

### 1. El puente hacia SAP2000 (choice)

En el enfoque del cuaderno, ¿qué tecnología conecta Python con SAP2000?

1. `Markdown`
2. `Tkinter exclusivamente`
3. `COM`
4. `HTML`

**Solución:** 3. El material usa la interfaz COM y comtypes para controlar SAP2000 en Windows.

### 2. Una carga combinada del ejemplo (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
CM, CV = 10, 6
print(1.4 * CM + 1.7 * CV)
```


**Solución:** 24.2. Se aplica la combinación usada como ejemplo en el notebook: 14 + 10.2. No es una recomendación normativa universal.

### 3. Importar la conexión COM (blank)

Arrastra al hueco la pieza que completa el código.

```python
import ___.client
```

1. `matplotlib`
2. `comtypes`
3. `pandas`
4. `tkinter`

**Solución:** 2. comtypes.client permite crear u obtener objetos COM.

### 4. Del modelo al resultado (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `pasos = []`
2. `pasos.append("Definir materiales y secciones")`
3. `pasos.append("Crear geometría y cargas")`
4. `pasos.append("Ejecutar análisis")`
5. `print(pasos)`

**Solución:** 1 → 2 → 3 → 4 → 5. Materiales y secciones preceden a sus asignaciones; el análisis requiere el modelo y sus cargas.

### 5. Hay un programa detrás (boolean)

El enfoque COM del cuaderno requiere SAP2000 instalado en el equipo que ejecuta la automatización.

1. `Verdadero`
2. `Falso`

**Solución:** 1. El script controla la aplicación instalada; no sustituye su motor de análisis.

### 6. La responsabilidad de la conexión (choice)

¿Qué tarea corresponde a ConexionSAP2000?

1. `Modificar las notas del taller`
2. `Dibujar un histograma de ensayos`
3. `Abrir o enlazar la aplicación y obtener el modelo`
4. `Diseñar todas las secciones sin datos`

**Solución:** 3. La conexión administra el enlace con la aplicación; las otras clases se ocupan de modelar, analizar y reportar.

### 7. Altura acumulada (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
h1, h2 = 3.5, 3.0
print(h1 + h2)
```


**Solución:** 6.5. La cota del segundo nivel se obtiene sumando las alturas entre pisos.

### 8. La instrucción de análisis (blank)

Arrastra al hueco la pieza que completa el código.

```python
ret = modelo.Analyze.___()
```

1. `StartExcel`
2. `PlotFrame`
3. `DrawNotebook`
4. `RunAnalysis`

**Solución:** 4. Analyze.RunAnalysis() ejecuta el análisis del modelo mediante la API.

### 9. Tratar un código de retorno (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `ret = 0`
2. `if ret != 0:`
3. `    raise RuntimeError("Falló la operación")`
4. `estado = "Operación completada"`
5. `print(estado)`

**Solución:** 1 → 2 → 3 → 4 → 5. En este ejemplo, solo se informa éxito si el retorno es cero.

### 10. Antes de confiar en los resultados (choice)

¿Qué comprobación es necesaria tras llamar a una operación de la API?

1. `Convertir todo a cadenas`
2. `Ignorar siempre el retorno`
3. `Verificar el código de retorno y la validez de las salidas`
4. `Cambiar el nombre del notebook`

**Solución:** 3. Una llamada puede fallar o devolver datos vacíos; comprobarlos evita informes engañosos.

## Taller 5 · Automatización con la API de SAP2000 · En vivo · S5VIVO

### 1. Un vano más (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
vanos, luz = 3, 5
print(vanos * luz)
```


**Solución:** 15. Tres vanos de cinco metros suman quince metros de longitud total.

### 2. Unidades consistentes (choice)

Antes de asignar geometría y cargas, ¿qué decisión debes fijar?

1. `Solo el color de la ventana`
2. `El sistema de unidades utilizado por el modelo`
3. `El orden alfabético del reporte`
4. `El apodo del participante`

**Solución:** 2. Longitudes, fuerzas y propiedades deben ser coherentes con las unidades del modelo.

### 3. Organizar la tabla extraída (blank)

Arrastra al hueco la pieza que completa el código.

```python
import pandas as pd
resultados = pd.___({"Elemento": ["V1"], "M3": [80]})
```

1. `Figure`
2. `Window`
3. `ArrayFrame`
4. `DataFrame`

**Solución:** 4. Un DataFrame organiza columnas de resultados para filtrarlas y exportarlas.

### 4. Preparar un reporte de fuerzas (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import pandas as pd`
2. `df = pd.DataFrame({"M3": [12, 25]})`
3. `maximo = df["M3"].max()`
4. `reporte = f"M3 máximo: {maximo}"`
5. `print(reporte)`

**Solución:** 1 → 2 → 3 → 4 → 5. La tabla existe antes del cálculo del máximo y la construcción del texto.

### 5. Analizar no equivale a dibujar (boolean)

La clase encargada de generar reportes debería crear automáticamente materiales y apoyos como responsabilidad principal.

1. `Verdadero`
2. `Falso`

**Solución:** 2. En el enfoque del taller, el reporte organiza resultados; el modelado pertenece a otras clases.

### 6. Una fuerza en su sitio (choice)

Según la tabla de resultados del cuaderno, ¿qué familia consulta fuerzas en elementos frame?

1. `Results.FrameForce`
2. `Results.JointDispl`
3. `PropMaterial.SetMaterial`
4. `File.Save`

**Solución:** 1. FrameForce extrae fuerzas internas de elementos frame; JointDispl obtiene desplazamientos nodales.

### 7. Encontrar la demanda absoluta (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
momentos = [-45, 30, -70, 60]
print(max(abs(m) for m in momentos))
```


**Solución:** 70. La mayor magnitud es 70; usar solo max(momentos) daría 60.

### 8. Poner nombre al modelo (blank)

Arrastra al hueco la pieza que completa el código.

```python
ruta = "portico.sdb"
ret = modelo.File.___(ruta)
```

1. `WriteMarkdown`
2. `RunAnalysis`
3. `Save`
4. `to_csv`

**Solución:** 3. File.Save guarda el modelo SAP2000 en la ruta indicada.

### 9. Guardar antes del análisis (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `modelo = conexion.modelo`
2. `ruta = "portico.sdb"`
3. `modelo.File.Save(ruta)`
4. `ret = modelo.Analyze.RunAnalysis()`
5. `print(ret)`

**Solución:** 1 → 2 → 3 → 4 → 5. Tras obtener el modelo y una ruta, se guarda antes de analizar en este flujo.

### 10. Seleccionar el caso a consultar (choice)

¿Para qué se seleccionan los casos o combinaciones antes de extraer resultados?

1. `Para que la tabla corresponda a la carga que se desea estudiar`
2. `Para cambiar la versión de Python`
3. `Para eliminar todas las unidades`
4. `Para convertir vigas en nodos`

**Solución:** 1. La selección de salida determina a qué casos o combinaciones pertenecen los resultados consultados.

## Taller 6 · Arquitectura e interfaces con Tkinter · Práctica · S6PRAC

### 1. Separar el cálculo del botón (choice)

¿Dónde ubicarías una función reutilizable de cálculo de área?

1. `En un archivo de contraseñas`
2. `Solo dentro del texto del botón`
3. `En un módulo de cálculo independiente de Tkinter`
4. `En el color de la ventana`

**Solución:** 3. Separar cálculo e interfaz permite reutilizar y probar la lógica por separado.

### 2. Leer y convertir una entrada (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
texto = "6.5"
luz = float(texto)
print(luz * 2)
```


**Solución:** 13.0. Las entradas de texto deben convertirse antes de realizar cálculos numéricos.

### 3. Crear la ventana principal (blank)

Arrastra al hueco la pieza que completa el código.

```python
import tkinter as tk
ventana = tk.___()
```

1. `FrameGraph`
2. `AppFrame`
3. `Show`
4. `Tk`

**Solución:** 4. Tk() crea la ventana raíz de una aplicación Tkinter.

### 4. Una interfaz mínima (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import tkinter as tk`
2. `root = tk.Tk()`
3. `label = tk.Label(root, text="GADEST")`
4. `label.pack()`
5. `root.mainloop()`

**Solución:** 1 → 2 → 3 → 4 → 5. Se crea la raíz, el widget, se distribuye y se inicia el bucle de eventos.

### 5. Esperar el clic (boolean)

Al configurar Button(command=calcular), se pasa la función para que se ejecute cuando corresponda.

1. `Verdadero`
2. `Falso`

**Solución:** 1. Sin paréntesis se entrega la referencia; calcular() la ejecutaría durante la construcción.

### 6. Elegir una opción (choice)

¿Qué widget de ttk ofrece una lista desplegable?

1. `Combobox`
2. `Label`
3. `Canvas`
4. `Scrollbar exclusivamente`

**Solución:** 1. ttk.Combobox permite seleccionar entre opciones de una lista.

### 7. Una fórmula sin interfaz (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
def momento(w, L):
    return w * L**2 / 8
print(momento(10, 4))
```


**Solución:** 20.0. La función calcula wL²/8 y puede probarse sin abrir una ventana.

### 8. Leer el Entry (blank)

Arrastra al hueco la pieza que completa el código.

```python
texto = entrada.___()
```

1. `mainloop`
2. `pack`
3. `read_csv`
4. `get`

**Solución:** 4. Entry.get() recupera la cadena escrita por el usuario.

### 9. Actualizar un resultado (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `texto = "4"`
2. `luz = float(texto)`
3. `reaccion = 10 * luz / 2`
4. `mensaje = f"R = {reaccion:.1f} kN"`
5. `print(mensaje)`

**Solución:** 1 → 2 → 3 → 4 → 5. Primero se lee, luego se convierte, se calcula y se prepara la salida.

### 10. Ubicación en filas y columnas (choice)

¿Qué gestor sitúa widgets mediante row y column?

1. `grid`
2. `plot`
3. `place_csv`
4. `show`

**Solución:** 1. grid organiza widgets en una cuadrícula con filas y columnas.

## Taller 6 · Arquitectura e interfaces con Tkinter · En vivo · S6VIVO

### 1. Un resultado formateado (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
area = 0.3 * 0.6
print(f"{area:.3f}")
```


**Solución:** 0.180. El formato .3f muestra tres posiciones decimales, incluso el cero final.

### 2. Datos no numéricos (choice)

Si float(entrada.get()) falla por un texto como "hola", ¿qué excepción conviene manejar?

1. `FileNotFoundError`
2. `ImportError`
3. `StopIteration`
4. `ValueError`

**Solución:** 4. La cadena no tiene una representación numérica válida y float lanza ValueError.

### 3. Una variable vinculada (blank)

Arrastra al hueco la pieza que completa el código.

```python
import tkinter as tk
valor = tk.___(value="Listo")
```

1. `TextValue`
2. `LabelVar`
3. `StringVar`
4. `StringFrame`

**Solución:** 3. StringVar almacena un valor de texto que puede vincularse a widgets.

### 4. Validar una geometría (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `h = -2`
2. `if h <= 0:`
3. `    mensaje = "Altura inválida"`
4. `else:`
5. `    mensaje = "Altura aceptada"`

**Solución:** 1 → 2 → 3 → 4 → 5. Una geometría no positiva se rechaza antes de calcular con ella.

### 5. Diseño de responsabilidades (boolean)

Para comprobar una función de cálculo debería ser obligatorio abrir la ventana gráfica.

1. `Verdadero`
2. `Falso`

**Solución:** 2. Una lógica independiente de la interfaz se puede probar directamente.

### 6. Un aviso claro (choice)

¿Qué recurso de Tkinter se usa para mostrar una alerta de error?

1. `numpy.error_window`
2. `pandas.alert`
3. `plt.showerror`
4. `messagebox.showerror`

**Solución:** 4. messagebox proporciona cuadros de diálogo, incluidos los avisos de error.

### 7. Un módulo con alias (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
import math as m
print(m.sqrt(49))
```


**Solución:** 7.0. El alias m sigue referenciando el módulo math; sqrt devuelve un float.

### 8. Pestañas para organizar (blank)

Arrastra al hueco la pieza que completa el código.

```python
from tkinter import ttk
pestanas = ttk.___(root)
```

1. `WindowTabs`
2. `Notebook`
3. `DataFrame`
4. `Subplots`

**Solución:** 2. ttk.Notebook reúne páginas seleccionables mediante pestañas.

### 9. Incrustar una figura (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg`
2. `canvas = FigureCanvasTkAgg(fig, master=root)`
3. `canvas.draw()`
4. `canvas.get_tk_widget().pack()`

**Solución:** 1 → 2 → 3 → 4. Con fig y root ya creados, el adaptador dibuja la figura y coloca su widget en la ventana.

### 10. La ventana deja de responder (choice)

Un análisis largo corre dentro del callback principal. ¿Qué efecto puede tener?

1. `Acelerar siempre todos los botones`
2. `Guardar automáticamente un Excel`
3. `Eliminar la necesidad de mainloop`
4. `Bloquear temporalmente la atención a eventos de la interfaz`

**Solución:** 4. El bucle de eventos no puede atender la interfaz mientras el callback largo lo ocupa.

## Taller 7 · Aplicaciones web con Streamlit · Práctica · S7PRAC

### 1. Llevar el script al navegador (choice)

¿Qué comando inicia una aplicación Streamlit llamada app.py?

1. `python notebook app.py`
2. `streamlit run app.py`
3. `pip run app.py`
4. `tkinter app.py`

**Solución:** 2. Streamlit inicia su servidor y ejecuta la aplicación con streamlit run.

### 2. El cálculo que alimenta la tarjeta (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
w, L = 25, 6
print(f"{w * L**2 / 8:.1f}")
```


**Solución:** 112.5. El momento del modelo simple es 25 × 36 / 8 = 112.5.

### 3. Una entrada numérica directa (blank)

Arrastra al hueco la pieza que completa el código.

```python
import streamlit as st
L = st.___("Luz", min_value=1.0, value=6.0)
```

1. `StringVar`
2. `numeric_entry`
3. `number_input`
4. `Entry`

**Solución:** 3. number_input devuelve directamente un número, sin usar .get().

### 4. La primera app web (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import streamlit as st`
2. `st.title("Mi primera viga")`
3. `L = st.number_input("Luz", min_value=1.0, value=6.0)`
4. `R = 10 * L / 2`
5. `st.metric("Reacción", R)`

**Solución:** 1 → 2 → 3 → 4 → 5. Importa, presenta, recoge la entrada, calcula y muestra la métrica.

### 5. El script vuelve a empezar (boolean)

En el comportamiento habitual de Streamlit, cambiar un widget provoca una nueva ejecución del script.

1. `Verdadero`
2. `Falso`

**Solución:** 1. El modelo del taller se basa en reejecutar el script para actualizar la interfaz.

### 6. Recordar las vigas agregadas (choice)

¿Qué herramienta conserva datos entre reejecuciones en una sesión?

1. `Una variable local reiniciada en cada ejecución`
2. `plt.show`
3. `tk.StringVar`
4. `st.session_state`

**Solución:** 4. session_state permite mantener valores ligados a la sesión del usuario.

### 7. Un dato inicial protegido (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
estado = {}
if "contador" not in estado:
    estado["contador"] = 0
estado["contador"] += 1
print(estado["contador"])
```


**Solución:** 1. La inicialización solo ocurre si la clave falta; después se incrementa una vez.

### 8. La figura dentro de la página (blank)

Arrastra al hueco la pieza que completa el código.

```python
import streamlit as st
st.___(fig)
```

1. `plot_window`
2. `pyplot`
3. `show_tk`
4. `mainloop`

**Solución:** 2. st.pyplot(fig) muestra una figura Matplotlib dentro de la aplicación.

### 9. Guardar un estado inicial (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import streamlit as st`
2. `if "vigas" not in st.session_state:`
3. `    st.session_state.vigas = []`
4. `st.session_state.vigas.append("V1")`
5. `st.write(st.session_state.vigas)`

**Solución:** 1 → 2 → 3 → 4 → 5. Primero se comprueba e inicializa el estado y luego se usa la lista.

### 10. Confirmar varios datos juntos (choice)

¿Qué componente agrupa entradas para enviarlas al pulsar un botón de confirmación?

1. `st.metric`
2. `st.latex`
3. `st.caption`
4. `st.form`

**Solución:** 4. Un formulario agrupa las interacciones hasta el envío del formulario.

## Taller 7 · Aplicaciones web con Streamlit · En vivo · S7VIVO

### 1. Tabla calculada para la web (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
cargas = [40, 60, 80]
print(sum(cargas) / len(cargas))
```


**Solución:** 60.0. La media que puede mostrarse con st.metric es 180 / 3.

### 2. La tabla que sí se modifica (choice)

¿Qué función devuelve una tabla con las modificaciones introducidas por el usuario?

1. `st.image`
2. `st.code`
3. `st.data_editor`
4. `st.dataframe como editor de celdas`

**Solución:** 3. data_editor admite edición; dataframe se usa para mostrar y explorar la tabla.

### 3. Elegir un material (blank)

Arrastra al hueco la pieza que completa el código.

```python
import streamlit as st
material = st.___("Material", ["Acero", "Concreto"])
```

1. `selectframe`
2. `selectbox`
3. `Combobox`
4. `choose_file`

**Solución:** 2. selectbox devuelve la opción elegida de una lista desplegable.

### 4. Dividir una pantalla (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import streamlit as st`
2. `izquierda, derecha = st.columns(2)`
3. `with izquierda:`
4. `    st.write("Datos de entrada")`
5. `derecha.write("Resultados")`

**Solución:** 1 → 2 → 3 → 4 → 5. columns crea los contenedores; el bloque with coloca contenido en la izquierda.

### 5. Una contraseña no es código público (boolean)

Los secretos de una app deben escribirse directamente en un repositorio público para que la nube pueda leerlos.

1. `Verdadero`
2. `Falso`

**Solución:** 2. El material separa secretos del código público y excluye secrets.toml del control de versiones.

### 6. No repetir una lectura costosa (choice)

¿Qué decorador se propone para reutilizar resultados de lecturas o cálculos de datos con los mismos argumentos?

1. `@st.session_state`
2. `@st.columns`
3. `@st.cache_data`
4. `@st.title`

**Solución:** 3. cache_data almacena resultados de funciones de datos para evitar recalcularlos sin necesidad.

### 7. Una tabla descargable comienza aquí (input)

Escribe la salida exacta, sin comillas ni texto adicional.

```python
filas = ["V1;80", "V2;95"]
print(len(filas))
```


**Solución:** 2. Las dos filas pueden convertirse en datos para un botón de descarga.

### 8. Ofrecer el archivo al aspirante (blank)

Arrastra al hueco la pieza que completa el código.

```python
import streamlit as st
st.___("Descargar CSV", data="Viga;M
V1;80", file_name="vigas.csv")
```

1. `download_button`
2. `file_uploader`
3. `save_window`
4. `upload_button`

**Solución:** 1. download_button entrega un archivo; file_uploader recibe archivos del usuario.

### 9. Navegación de varias páginas (order)

Ordena las líneas para obtener un programa válido. Conserva la sangría.

1. `import streamlit as st`
2. `paginas = [st.Page("inicio.py", title="Inicio")]`
3. `pagina = st.navigation(paginas)`
4. `pagina.run()`

**Solución:** 1 → 2 → 3 → 4. Se describen las páginas, se crea la navegación y se ejecuta la página seleccionada.

### 10. Reutilizar el motor de cálculo (choice)

¿Qué archivo debería funcionar sin importar Streamlit en el proyecto integrador?

1. `La página que crea todos los widgets`
2. `El archivo de secretos`
3. `calculos.py`
4. `El archivo del tema visual`

**Solución:** 3. calculos.py concentra el modelo y las fórmulas para reutilizarlos desde distintas interfaces.

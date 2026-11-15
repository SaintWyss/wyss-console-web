# Wyss Console — Diseño de producto, fase 1 (hoja en blanco)

Escrito sin mirar el repositorio ni documentos existentes. Los únicos números medidos son los del pedido (63.000 contra 12.600 tokens, $0,43 contra $0,017, 4 a 5 veces en tareas reales). Todo otro número es un objetivo propuesto. Los mecanismos concretos de cada agente (cómo se le indica otra carpeta de configuración, cómo se anula el texto del proyecto) no están verificados acá: figuran como pruebas a pasar.

Vocabulario: **perfil** = la configuración de un rol (texto de instrucciones + skills + hooks + MCP + agentes). **Terminal** = una sesión de un agente lanzada con un perfil en una carpeta de proyecto.

## 1. Principios de diseño

Satisfacción, acá, quiere decir: el dueño abre la app, tiene una terminal útil enseguida, sabe exactamente qué cargó y cuánto cuesta, y nunca se entera tarde de que algo no era como la pantalla decía.

| #   | Principio                         | Qué significa                                                                                                           | Cómo se mide                                                                                      |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Rápido a la primera terminal útil | Lanzar un perfil ya creado son dos acciones                                                                             | Objetivo: menos de 10 s y 2 clics desde abrir la app; menos de 5 min desde instalación limpia     |
| 2   | Lo que se ve es lo que cargó      | La pantalla muestra el contenido real de la carpeta de configuración armada, no la intención                            | Comparar la lista de la pantalla con lo que el agente reporta adentro de la sesión: 0 diferencias |
| 3   | Todo control es real              | Cada botón, interruptor y número tiene efecto comprobable. Lo que es estimado o recomendación lleva la etiqueta escrita | Auditoría: por cada control, un antes/después observable. Controles sin efecto: 0                 |
| 4   | Falla en voz alta                 | Si una garantía no se puede cumplir, la terminal no arranca y dice cuál, por qué y qué hacer                            | Cada error tiene causa + acción. Arranques "degradados" silenciosos: 0                            |
| 5   | No toca lo tuyo                   | La configuración global y el login del usuario quedan idénticos                                                         | Huella de la configuración global antes y después de una sesión de uso: igual                     |
| 6   | Reversible                        | Todo cambio de perfil se puede deshacer; borrar pide confirmación y deja copia                                          | Volver a la versión anterior de un perfil en 1 acción                                             |
| 7   | Pocas pantallas                   | Tres pantallas. Una función nueva entra en una existente o no entra                                                     | Conteo de pantallas: 3. Profundidad máxima de navegación: 2                                       |

## 2. Trabajos del usuario

Ordenados por frecuencia, con importancia entre paréntesis.

1. **Lanzar una terminal con un rol en un proyecto** — muchas veces por día (crítica).
2. **Volver a una terminal que sigue viva o retomar una cerrada** — muchas veces por día (crítica).
3. **Tener varias abiertas, de Claude y de Codex, sin que se pisen** — todos los días (crítica).
4. **Saber qué cargó y cuánto cuesta cada una** — diario al principio, después por excepción (alta: es la razón de existir).
5. **Ajustar un perfil** (sacar una skill, cambiar el texto) — semanal (alta).
6. **Probar qué cargaría un perfil antes de lanzarlo** — al crear o cambiar (alta).
7. **Crear un perfil nuevo** — mensual (alta la primera vez).
8. **Administrar skills, hooks, MCP y agentes propios en un lugar** — mensual (media).
9. **Tener lo mismo en la otra PC** — ocasional (media).
10. **Entender por qué algo no arrancó** — raro (crítica cuando pasa).

## 3. Mapa de pantallas

Tres pantallas con una barra lateral fija. Lanzar es un diálogo, no una pantalla.

### 3.1 Terminales (pantalla de inicio)

Para qué: trabajos 1 a 4. Es donde el dueño vive el 95 % del tiempo.

```
+--------------+----------------------------------------------+
| TERMINALES   |  Investigación · Claude · ~/proyectos/app    |
| * Investig.  |  Carga: 3 skills · 1 hook · 0 MCP  [ver]     |
|   Claude app |  Costo base: 12,6k tok (medido)              |
| * Trabajador |----------------------------------------------|
|   Codex  app |                                              |
| o Investig.  |   (la terminal del agente, tal cual)         |
|   cerrada    |                                              |
|              |                                              |
| [+ Nueva]    |                                              |
|--------------|                                              |
| Perfiles     |                                              |
| Biblioteca   |                                              |
| Estado: OK   |                                              |
+--------------+----------------------------------------------+
```

Qué ve: la lista de terminales vivas (punto lleno) y cerradas retomables (punto vacío), cada una con perfil, agente y proyecto; a la derecha, la terminal activa con una franja que dice qué cargó y el costo base.

Decisiones: cuál mirar, lanzar una nueva, cerrar, retomar. "[ver]" despliega el manifiesto exacto de esa terminal (solo lectura).

Qué NO hay: edición de perfiles, gráficos, pestañas dentro de pestañas, paneles partidos (P2 como mucho), chat propio, historial de comandos embellecido.

**Diálogo "Nueva"**: perfil, agente, carpeta del proyecto, botón Lanzar. Muestra el costo estimado del perfil y la línea "El texto del perfil reemplaza al del proyecto". Nada más.

### 3.2 Perfiles

Para qué: trabajos 5, 6 y 7.

```
+-----------+---------------------------+---------------------+
| PERFILES  | Investigación             | QUÉ CARGA           |
| Investig. | Agentes: [x]Claude [x]Codex| Texto      1,1k tok |
| Trabajador| Texto de instrucciones    | Skills (3) 0,9k     |
| Mínimo    | +-----------------------+ | Hooks (1)  por cmd  |
|           | | Sos investigador...   | | MCP (0)    0        |
| [+ Nuevo] | +-----------------------+ | Base agente 9,8k    |
|           | Skills  [3 de 41] [elegir]| -------------------|
|           | Hooks   [1 de 12] [elegir]| Total 11,8k ESTIMADO|
|           | MCP     [0 de 6]  [elegir]| Medido: 12,6k (ayer)|
|           | Agentes [0 de 9]  [elegir]| Global: 63k (5x)    |
|           |                           | [Probar ahora]      |
|           | [Guardar] [Deshacer]      | [Lanzar]            |
+-----------+---------------------------+---------------------+
```

Qué ve: lista de perfiles, el editor del perfil elegido, y a la derecha la columna "Qué carga", que es el corazón de la app: el desglose por pieza, el total estimado, el último medido y la comparación con la configuración global.

Decisiones: qué texto, qué piezas, para qué agentes. "[Probar ahora]" arma la carpeta, lanza una sesión mínima y devuelve lo que el agente dice que cargó y los tokens reales. Es la única forma de obtener el número "medido".

Qué NO hay: opciones del modelo, temas, permisos finos por herramienta, plantillas de marketplace. "[elegir]" abre una lista con casillas, no otra pantalla.

### 3.3 Biblioteca

Para qué: trabajo 8. Un inventario de las piezas propias.

```
+------------------------------------------------------------+
| BIBLIOTECA   [Skills] [Hooks] [MCP] [Agentes]   buscar: __ |
|------------------------------------------------------------|
| nombre         agente   peso     usado en        estado    |
| buscar-web     ambos    0,3k     Investigación   OK        |
| revisar-diff   Claude   0,4k     Trabajador      OK        |
| formatear      Codex    por cmd  —               ROTO: ... |
|------------------------------------------------------------|
| [Importar de mi configuración global]  [Abrir en editor]   |
+------------------------------------------------------------+
```

Qué ve: cada pieza con qué agente la soporta, cuánto pesa, en qué perfiles está y si es válida.

Decisiones: importar (copia, nunca mueve), abrir en su editor, borrar (solo si ningún perfil la usa, o avisando cuáles).

Qué NO hay: editor de código embebido (se abre el editor del dueño), tienda, puntajes, versiones.

### 3.4 "Estado" no es pantalla

Es una línea al pie de la barra lateral que, al tocarla, abre un panel chico: servicio de fondo vivo, login de Claude y de Codex válidos, versión de cada agente y si esa versión fue probada. Sale en rojo solo si algo falla.

### Pantallas que no deberían existir

- **Panel de métricas con gráficos**: el costo se ve donde se decide (Perfiles) y donde se usa (Terminales).
- **Ajustes con veinte opciones**: lo necesario cabe en el panel de Estado.
- **Asistente de bienvenida de varios pasos**: lo reemplaza un perfil "Mínimo" precargado.
- **Pantalla de proyectos**: el proyecto es una carpeta que se elige al lanzar.
- **Pantalla de sesiones aparte**: son la misma lista que Terminales.
- **Chat o vista "linda" de la conversación**: la terminal del agente alcanza.

## 4. Primera vez y caso principal

### Primeros 5 minutos

1. Abre la app. La app revisa sola: agentes instalados, login de cada uno, servicio de fondo. Muestra tres tildes o el problema exacto.
2. La pantalla Terminales está vacía y dice una sola cosa: "Lanzá tu primera terminal" con el perfil **Mínimo** ya creado.
3. Elige agente y carpeta, Lanzar. La terminal abre con la franja "Costo base: N tok (medido)".
4. Al lado, un renglón: "Con tu configuración global esta misma sesión carga X (medí ahora)". Si toca "medí ahora", la app corre la comparación real y muestra los dos números. Esa es la demostración.
5. Oferta única: "Importar tus skills, hooks y MCP a la Biblioteca (se copian, no se tocan los originales)".

### Caso principal

1. Perfiles → Nuevo → "Investigación". Marca Claude y Codex.
2. Pega su texto de instrucciones.
3. Skills → elegir → marca 3. Hooks → marca 1. La columna derecha actualiza el estimado a cada clic.
4. "[Probar ahora]": en unos segundos ve la lista que el agente reporta y el costo medido. Si coincide con el manifiesto, tilde verde "Verificado".
5. Guardar. Duplica "Investigación" como "Trabajador", cambia texto, skills y hooks, prueba, guarda.
6. Terminales → Nueva → Investigación · Claude · carpeta A → Lanzar.
7. Nueva → Trabajador · Codex · carpeta A (la misma) → Lanzar. Las dos conviven; cada una tiene su carpeta de configuración propia.
8. En cada franja lee qué cargó y el costo base. En la carpeta A hay un archivo de instrucciones del proyecto: la franja dice "Texto del proyecto: reemplazado (verificado)".
9. Cierra la ventana. Vuelve a abrir: las dos siguen ahí, con lo que pasó mientras tanto.

## 5. Funciones en orden de construcción

### P0 — sin esto no sirve

| Función                                                              | Por qué primero                        | Evidencia de que es real                                                                                        |
| -------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Lanzar un agente con carpeta de configuración propia por lanzamiento | Es el producto                         | Dentro de la sesión, el agente lista solo las piezas del perfil; ninguna de la global                           |
| Global y login intactos                                              | Si rompe el login, el dueño desinstala | Huella de la configuración global igual antes y después; el agente arranca autenticado sin pedir login de nuevo |
| El texto del perfil reemplaza al del proyecto                        | Caso principal explícito               | Proyecto con un texto que contiene una frase trampa: el agente no la conoce                                     |
| Falla cerrada                                                        | Sin esto las garantías son promesas    | Con un perfil roto a propósito (skill inexistente), la terminal no arranca y el error nombra la pieza           |
| Varias terminales simultáneas, Claude y Codex                        | Caso principal                         | Dos perfiles distintos sobre la misma carpeta: cada sesión reporta solo lo suyo                                 |
| Sobreviven a cerrar la ventana                                       | Sin esto pierde trabajo                | Cerrar la ventana a mitad de una tarea, reabrir: la sesión siguió                                               |
| Editor de perfil (texto + skills + hooks)                            | Sin esto no hay cómo elegir            | Cambiar una casilla cambia lo que reporta la próxima sesión                                                     |
| Manifiesto visible por terminal                                      | Principio 2                            | Coincide con el reporte del agente                                                                              |

### P1

| Función                               | Por qué acá                                        | Evidencia                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| "Probar ahora" con costo medido       | Convierte la promesa de ahorro en un número propio | El número coincide con el que reporta el agente al cerrar la sesión de prueba |
| Costo estimado en vivo, etiquetado    | Guía mientras se edita                             | Error del estimado contra el medido menor al 15 % (objetivo)                  |
| Retomar sesiones cerradas             | Trabajo 2                                          | La sesión retomada conserva historial y perfil                                |
| Biblioteca con importación            | Trabajo 8                                          | Lo importado es copia: borrar en Biblioteca no afecta la global               |
| MCP y agentes en perfiles             | Completa el perfil                                 | Mismo test que skills                                                         |
| Deshacer / versión anterior de perfil | Principio 6                                        | Volver atrás y relanzar reproduce la carga anterior                           |
| Panel de Estado                       | Diagnóstico sin pantalla                           | Con login vencido a propósito, lo marca antes de lanzar                       |

### P2

- Perfiles sincronizados entre las dos PC (exportar/importar a una carpeta; después sincronización). Prueba: mismo perfil, mismo manifiesto en ambas.
- Costo acumulado por terminal durante el uso. Prueba: coincide con el reporte del agente.
- Tercer agente. Prueba: pasa la misma batería P0.
- Paneles partidos. Solo si el dueño los pide después de un mes de uso.

### No se construye nunca

- Un agente propio, o un chat que reinterprete la salida.
- Edición de la configuración global del usuario desde la app.
- Funciones de terminal genérica (temas, plugins de shell, autocompletado propio).
- Tienda o marketplace de skills.
- Arranque "lo mejor posible" cuando falta una garantía.
- Controles que solo guardan una preferencia sin efecto.

## 6. Errores y vacíos

Formato único para todo error: **qué pasó · por qué · qué hacer**, con un botón que hace eso.

| Situación                                                  | Qué ve                                                                                                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No se puede garantizar el reemplazo del texto del proyecto | "No arrancó. No pude asegurar que el texto de ~/app no se cargue (versión del agente no probada). [Ver detalle] [Lanzar en carpeta vacía]". Nunca arranca a medias |
| Pieza del perfil faltante o inválida                       | "No arrancó. La skill 'buscar-web' no existe en la Biblioteca. [Quitarla del perfil] [Abrir Biblioteca]"                                                           |
| Perfil dañado (no se puede leer)                           | El perfil aparece en la lista marcado "Dañado", no desaparece. "[Restaurar versión anterior] [Ver archivo]"                                                        |
| Login vencido o ausente                                    | "Claude no tiene sesión iniciada. La consola no maneja tu login. Iniciá sesión con el agente como siempre y tocá [Reintentar]". Nunca pide credenciales            |
| Agente no instalado                                        | El agente aparece gris en el diálogo, con el motivo                                                                                                                |
| Versión del agente no probada                              | Aviso amarillo: "Versión no verificada: corré [Probar ahora] antes de confiar en el manifiesto"                                                                    |
| Servicio de fondo caído                                    | Franja roja arriba: "Las terminales no están disponibles. [Reiniciar servicio]". Al volver, dice cuáles sobrevivieron                                              |
| La prueba no coincide con el manifiesto                    | "El agente cargó algo que el perfil no pide: X". El perfil pierde la tilde "Verificado" y no se puede lanzar hasta resolverlo                                      |
| Sin terminales                                             | "Ninguna terminal abierta. [Nueva]" y los últimos tres lanzamientos para repetir                                                                                   |
| Sin perfiles                                               | Siempre existe "Mínimo"; no se puede borrar el último                                                                                                              |
| Biblioteca vacía                                           | "[Importar de mi configuración global]" con la aclaración "se copian"                                                                                              |
| Costo sin medir                                            | Se muestra "sin medir" y el estimado. Nunca un número inventado                                                                                                    |

## 7. Por qué esto y no otra cosa

**Frase:** es el único lugar donde decidís qué carga cada terminal de agente, ves cuánto cuesta esa decisión y tenés la garantía de que arrancó con eso y nada más.

Warp y Ghostty son terminales: no saben qué cargó el agente. Claude Code solo carga todo. Los scripts con variables de entorno pueden lograr lo mismo, pero no muestran el manifiesto, no miden, no fallan cerrado y hay que mantenerlos.

**Demostración en 2 minutos:** lanzar "Mínimo" y tocar "medí ahora". El dueño ve en su propia máquina los dos números lado a lado (del orden de 63.000 contra 12.600 tokens según lo ya medido) y el manifiesto corto de lo que cargó. Si esa comparación no aparece en la primera sesión, la app no dio su razón de ser.

## 8. Riesgos y decisiones abiertas

**Riesgos**

- **Los agentes cambian de versión** y con eso cómo resuelven su configuración. Mitigación: la batería P0 corre como autoprueba por versión; versión no probada se avisa.
- **Aislar la configuración puede romper el login.** Es el riesgo que mata el producto. Va primero en P0 y con prueba propia.
- **El estimado puede mentir.** Por eso se etiqueta y existe "Probar ahora".
- **Crecer en pantallas.** El principio 7 es el freno.
- **Que un script le alcance al dueño.** La app se justifica solo si el manifiesto verificado y el costo medido son confiables.

**Decisiones del dueño**

1. **¿Un perfil sirve para Claude y Codex, o uno por agente?** Recomendación: un perfil con texto común y casillas de agente; cada pieza declara qué agente soporta y la que no aplica se muestra tachada, no se oculta.
2. **¿El texto del perfil reemplaza siempre al del proyecto, o hay opción de sumar?** Recomendación: reemplaza siempre en la primera versión. Un interruptor "sumar el del proyecto" recién si lo extraña, porque duplica los casos a garantizar.
3. **¿Los perfiles viajan entre las dos PC?** Recomendación: sí, pero en P2 y como carpeta de archivos de texto que él sincroniza con lo que ya usa.
4. **¿Versión de agente no probada bloquea o avisa?** Recomendación: avisa y exige una "Prueba" que pase antes del primer lanzamiento; si la prueba falla, bloquea.
5. **¿La Biblioteca copia o enlaza las piezas de la configuración global?** Recomendación: copia. Enlazar ata la app a la global, que es justo lo que se quiere dejar quieto.

## Criterios de aceptación de satisfacción

Verificables por una persona en una sesión de prueba.

1. Desde abrir la app con un perfil existente hasta tener el cursor del agente: 2 clics y menos de 10 segundos.
2. Desde instalación limpia hasta la primera terminal útil con el perfil "Mínimo": menos de 5 minutos, sin leer documentación.
3. En la primera sesión la app muestra dos costos medidos lado a lado (perfil mínimo y configuración global) y el mínimo es claramente menor.
4. Con "Investigación" y "Trabajador" abiertas sobre la misma carpeta, al preguntarle a cada agente qué skills tiene, responde solo las de su perfil.
5. En un proyecto cuyo archivo de instrucciones contiene una frase trampa, el agente lanzado desde la consola no la conoce.
6. Tras una hora de uso, la configuración global y el login del usuario están idénticos (huella igual; el agente lanzado por fuera de la app funciona como antes).
7. Con un perfil roto a propósito, la terminal no arranca y el mensaje nombra la pieza y ofrece un botón que lo resuelve.
8. Cerrar la ventana con dos terminales trabajando y reabrir: las dos están, con su salida intermedia.
9. Todo número de costo en pantalla dice "estimado" o "medido"; no hay ninguno sin etiqueta.
10. Recorriendo las tres pantallas, la persona no encuentra ningún control que no produzca un cambio observable, y puede deshacer el último cambio de un perfil en una acción.

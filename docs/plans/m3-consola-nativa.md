# M3 — Ventana Consola nativa: lista de paridad (congelada 2026-11-18)

Referencia: la Consola Tauri instalada (`773830a`), capturada en display aislado contra un host aislado.
Esta lista es el contrato: el constructor no la achica. Un ítem sin hacer es FAIL, no "casi".

## M3a — ventana, pestañas, paneles, atajos, tema oscuro

| # | Ítem | Cómo se verifica |
|---|---|---|
| A1 | Riel izquierdo de iconos: Consola (activo, marcado) arriba; Workspace, Personalización, Actividad, Ajustes; "…" (Más) abajo. Los que no son Consola abren la app Tauri como proceso aparte (D2) | Captura; clic abre el proceso (binario configurable `WYSS_TAURI_BIN`) |
| A2 | Barra de pestañas: "Terminal N", RAM de la pestaña (suma de sus paneles, "11 MB"), "▦ 2" si tiene 2+ paneles, × cerrar | Captura + RAM coincide con `/proc` ±1 MB |
| A3 | Botones a la derecha: dividir lado a lado (Ctrl+Shift+D), dividir arriba/abajo (Ctrl+Shift+E), atajos de teclado (lista los atajos). Tooltip con el atajo | Clic y atajo dividen; tooltip visible |
| A4 | Paneles divididos en árbol, con divisor arrastrable; cada panel es una terminal del host | Captura con 2 y 3 paneles; arrastre cambia `stty size` |
| A5 | Cabecera de panel: punto de estado (verde corriendo, otro color terminado), shell (`/bin/fish`), estado ("Running"), RAM del panel | Captura |
| A6 | Barra de estado: carpeta actual del panel con foco (`~` abreviado, sigue a `cd`), git ("no git" o rama), a la derecha "Terminal" | `cd /tmp` cambia la barra; repo git muestra la rama |
| A7 | Atajos: Ctrl+Shift+T pestaña, Ctrl+Shift+W cierra panel (y la terminal en el host), Ctrl+Shift+←→↑↓ foco, Ctrl+Shift+. / , siguiente/anterior, Ctrl+Shift+PgDn/PgUp pestaña, Ctrl+Shift+1..9 saltar. Ctrl+C copia (nunca interrumpe), Ctrl+Shift+C interrumpe, Ctrl+V pega | Prueba de bytes + capturas en display aislado |
| A8 | Tema grafito oscuro con los tokens de `src/app.css` `:root` (bg `#0e0e0e`, chrome `#151515`, line `#2a2a2a`, text `#ececec`, muted `#a3a3a3`, ok `#5ee39a`...), un solo archivo CSS de GTK | Comparación lado a lado con `ref-consola-*.png` |
| A9 | Persistencia: cerrar la ventana deja las terminales vivas; reabrir restaura pestañas y paneles (layout guardado en disco propio) con re-enganche | Prueba con host aislado |
| A10 | Presupuestos: RAM ventana + 1 terminal ≤ 183 MB; marginal ≤ 5 MB por terminal; CPU reposo < 0,5 % con 10 | `bench` |

## Estado M3a (2026-11-18)

Construido por Sonnet, verificado por Opus con teclado y mouse reales en display aislado contra host aislado
(`prototypes/gtk-term/ui-tests/m3test.sh`): Ctrl+Shift+D/E/W/T/PgUp, foco direccional (el texto cae en el
panel correcto), arrastre del divisor (`stty size` 33×88), `cd /tmp` en la barra de estado, clic en el riel
abre la app Tauri, cerrar y reabrir restaura 2 pestañas y paneles. RAM 113 MB con 1 terminal, +0,2 MB por
terminal, CPU reposo 0,1 % con 10. Pendiente menor: al re-enganchar, las líneas viejas que estaban partidas
por un panel angosto vuelven cortadas (el repaint del host no re-parte). IBM Plex no está instalada: usa la
sans/mono del sistema.

## M3b — resto de la Consola (después de M3a)

Menú "+ Launch" con presets (Actualizar sistema, Claude, Codex) y "Full access"; tarjeta de ciclo de vida
(Parar/Reiniciar/Olvidar por panel); etiqueta de agente en la cabecera; búsqueda (Ctrl+Shift+F); temas claro y
alto contraste; idioma español/inglés.

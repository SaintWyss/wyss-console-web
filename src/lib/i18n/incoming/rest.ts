/**
 * Spanish for text the desktop (Rust) sends to the window, area: rest. The key is the English
 * sentence exactly as the desktop writes it; a part the desktop fills in is written `{name}`
 * and matches any text there (the same name must appear in the Spanish). Read by `tIncoming`.
 */
export const INCOMING: Readonly<Record<string, string>> = {
  'Clean Architecture / Hexagonal': 'Arquitectura limpia / hexagonal',
  'Domain at the center, with application, infrastructure and adapters (ports & adapters) around it.':
    'El dominio está en el centro, rodeado por la aplicación, la infraestructura y los adaptadores (puertos y adaptadores).',
  'Layered (N-tier)': 'Por capas (N-tier)',
  'Controllers or handlers call services, which call repositories or data access.':
    'Los controladores o manejadores llaman a servicios, que a su vez llaman a repositorios o al acceso a datos.',
  MVC: 'MVC',
  'Models, views and controllers separated.':
    'Modelos, vistas y controladores separados.',
  'Feature-based (vertical slices)':
    'Basada en funcionalidades (cortes verticales)',
  'Code grouped by feature or module rather than by technical layer.':
    'Código agrupado por funcionalidad o módulo, en lugar de por capa técnica.',
  Monorepo: 'Monorepo',
  'Several packages or applications in one repository.':
    'Varios paquetes o aplicaciones en un mismo repositorio.',
  'Component-based UI': 'Interfaz basada en componentes',
  'A user interface built from reusable components.':
    'Una interfaz de usuario construida con componentes reutilizables.',
  'API / Routes': 'API / rutas',
  'Exposes endpoints organized by routes.':
    'Expone endpoints organizados por rutas.',
  'Event-driven': 'Orientada a eventos',
  'Communicates through events, queues or message handlers.':
    'Se comunica mediante eventos, colas o manejadores de mensajes.',
  CQRS: 'CQRS',
  'Separates commands (writes) from queries (reads).':
    'Separa comandos (escrituras) de consultas (lecturas).',
  Microservices: 'Microservicios',
  'Several independently built and deployed services.':
    'Varios servicios construidos y desplegados de forma independiente.',
  'Desktop app (web frontend + native backend)':
    'Aplicación de escritorio (frontend web + backend nativo)',
  'A web UI running in a native shell that calls a native backend through commands/IPC.':
    'Una interfaz web que corre en una envoltura nativa y llama a un backend nativo mediante comandos o IPC.',
  'Full-stack (client / server)': 'Full stack (cliente / servidor)',
  'A frontend framework and a backend framework in the same project.':
    'Un framework de frontend y otro de backend en el mismo proyecto.',
  'Disabling returns to the older windows. The store, its tombstones and the migration snapshot are kept for forward recovery; no older file is restored over a live writer and no session is stopped. The older window can recreate missing shells by its own behaviour.':
    'Al deshabilitar se vuelve a las ventanas anteriores. El almacén, sus marcas de eliminación y la instantánea de migración se conservan para recuperar la versión más reciente; no se restaura ningún archivo anterior sobre un escritor activo ni se detiene ninguna sesión. La ventana anterior puede volver a crear las consolas que falten por su propio comportamiento.',
  'the runtime stopped responding': 'el runtime dejó de responder',
  'the runtime could not be started': 'no se pudo iniciar el runtime',
};

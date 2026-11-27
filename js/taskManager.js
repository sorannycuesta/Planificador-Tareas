// ===== Datos de apoyo para dibujar las tarjetas =====

// Estados de una tarea: texto, ícono y clase de color del badge
const ESTADOS = {
  PORHACER:   { texto: 'Por hacer',   icono: 'bi-flag',              clase: 'estado-porhacer' },
  ENPROGRESO: { texto: 'En progreso', icono: 'bi-clock',             clase: 'estado-progreso' },
  DONE:       { texto: 'Completada',  icono: 'bi-check-circle-fill', clase: 'estado-cerrado' }
};

// Categoría -> clase de color de la etiqueta
const CATEGORIAS = {
  'Website': 'etiqueta-website',
  'Diseño': 'etiqueta-diseno',
  'App móvil': 'etiqueta-app',
  'Branding': 'etiqueta-branding'
};

// Prioridad -> clase de color
const PRIORIDADES = {
  'Alta': 'prio-alta',
  'Media': 'prio-media',
  'Baja': 'prio-baja'
};

// Evita que un texto escrito por el usuario se interprete como HTML (por ejemplo "<b>")
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Convierte '2026-11-30' en '30 nov'
function formatDate(dateString) {
  if (!dateString) return 'Sin fecha';
  const parts = dateString.split('-'); // ['2026', '11', '30']
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');
}

// Devuelve el HTML de la tarjeta de UNA tarea (Tarea 7: ahora recibe el id).
// data-task-id guarda el id: así sabremos qué tarea es cuando hagan clic en un botón.
function createTaskHtml(id, name, description, dueDate, status, category = '', priority = '') {
  const estado = ESTADOS[status] || ESTADOS.PORHACER;
  const isDone = status === 'DONE';
  const claseCompletada = isDone ? ' completada' : '';

  // Categoría y prioridad son opcionales: solo se dibujan si existen
  const etiqueta = category
    ? '<span class="etiqueta ' + (CATEGORIAS[category] || 'etiqueta-general') + '">' + escapeHtml(category) + '</span>'
    : '';
  const prioridad = priority
    ? '<span class="prioridad ' + (PRIORIDADES[priority] || '') + '">' + escapeHtml(priority) + '</span>'
    : '';

  // Una tarea pendiente muestra "Mark As Done"; una tarea hecha muestra "Desmarcar"
  const botonEstado = isDone
    ? `<button type="button" class="undo-button btn btn-completar flex-grow-1">
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Desmarcar
          </button>`
    : `<button type="button" class="done-button btn btn-completar flex-grow-1">
            <i class="bi bi-check2-circle" aria-hidden="true"></i> Mark As Done
          </button>`;

  return `
    <article class="card tarjeta-tarea${claseCompletada}" data-task-id="${id}">
      <div class="card-body d-flex flex-column">
        <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
          <span class="estado ${estado.clase}"><i class="bi ${estado.icono}" aria-hidden="true"></i> ${estado.texto}</span>
          <button type="button" class="btn btn-icono btn-icono-sm" aria-label="Más opciones: ${escapeHtml(name)}"><i class="bi bi-three-dots-vertical" aria-hidden="true"></i></button>
        </div>
        <h3 class="titulo-pequeno tarea-titulo">${escapeHtml(name)}</h3>
        <p class="texto-suave mb-3">${escapeHtml(description)}</p>
        <div class="mt-auto d-flex flex-wrap align-items-center gap-2">
          ${etiqueta}
          ${prioridad}
          <span class="tarea-fecha ms-auto"><i class="bi bi-calendar3" aria-hidden="true"></i> Entrega: ${formatDate(dueDate)}</span>
        </div>
        <div class="d-flex gap-2 mt-3">
          ${botonEstado}
          <button type="button" class="delete-button btn btn-eliminar" aria-label="Eliminar tarea: ${escapeHtml(name)}">
            <i class="bi bi-trash3" aria-hidden="true"></i> Eliminar
          </button>
        </div>
      </div>
    </article>`;
}

// ===== Clase que guarda y gestiona las tareas =====
class TaskManager {
  // currentId es el último id usado. Si no se indica, empieza en 0.
  constructor(currentId = 0) {
    this.tasks = [];
    this.currentId = currentId;
  }

  // Crea una tarea nueva y la guarda en this.tasks (Tarea 5)
  // category y priority son opcionales: la tarjeta las usa para mostrar sus etiquetas.
  addTask(name, description, dueDate, status, category = '', priority = '') {
    // 1. Aumentamos el contador: así cada tarea recibe un id distinto (1, 2, 3...)
    this.currentId++;

    // 2. Guardamos un objeto con los datos de la tarea.
    //    Regla de esta actividad: toda tarea nueva empieza como 'PORHACER'.
    this.tasks.push({
      id: this.currentId,
      name: name,
      description: description,
      dueDate: dueDate,
      status: 'PORHACER',
      category: category,
      priority: priority
    });
  }

  // Busca y devuelve la tarea con ese id (Tarea 7). Si no existe, devuelve undefined.
  getTaskById(taskId) {
    let foundTask;
    for (let task of this.tasks) {
      if (task.id === taskId) {
        foundTask = task;
      }
    }
    return foundTask;
  }

  // Elimina la tarea con ese id (Tarea 6)
  deleteTask(taskId) {
    const newTasks = [];
    // Recorremos todas las tareas y nos quedamos con las que NO tienen ese id
    for (let task of this.tasks) {
      if (task.id !== taskId) {
        newTasks.push(task);
      }
    }
    this.tasks = newTasks;
  }

  // Guarda las tareas en el navegador (localStorage) para que no se pierdan al recargar
  save() {
    localStorage.setItem('planificador.tasks', JSON.stringify(this.tasks));
    localStorage.setItem('planificador.currentId', String(this.currentId));
  }

  // Recupera lo guardado. Devuelve true si había datos y false si no (primera visita)
  load() {
    const savedTasks = localStorage.getItem('planificador.tasks');
    if (savedTasks === null) {
      return false;
    }
    try {
      this.tasks = JSON.parse(savedTasks);
      this.currentId = Number(localStorage.getItem('planificador.currentId')) || 0;

      // Compatibilidad: en la versión anterior una tarea terminada se guardaba como
      // status 'CERRADO' o con completed = true. Ahora se guarda como status 'DONE'.
      for (let task of this.tasks) {
        if (task.completed || task.status === 'CERRADO') {
          if (task.status !== 'CERRADO') {
            task.previousStatus = task.status;
          }
          task.status = 'DONE';
        }
        delete task.completed;
      }
      return true;
    } catch (error) {
      console.log('No se pudieron leer las tareas guardadas:', error);
      return false;
    }
  }

  // Dibuja las tareas en la pantalla, cada una en la columna de su estado
  render() {
    const columnas = [
      { status: 'PORHACER',   lista: '#lista-porhacer', contador: '#contador-porhacer' },
      { status: 'ENPROGRESO', lista: '#lista-progreso', contador: '#contador-progreso' },
      { status: 'DONE',       lista: '#lista-cerrado',  contador: '#contador-cerrado' }
    ];

    for (let columna of columnas) {
      const contenedor = document.querySelector(columna.lista);
      const scroll = contenedor.scrollTop; // para no perder el desplazamiento de la columna

      // filter se queda con las tareas de esta columna
      const tareasDeLaColumna = this.tasks.filter(function (task) {
        return task.status === columna.status;
      });

      if (tareasDeLaColumna.length === 0) {
        contenedor.innerHTML = '<p class="columna-vacia">No hay tareas</p>';
      } else {
        // map convierte cada tarea en su HTML; a createTaskHtml le pasamos task.id
        contenedor.innerHTML = tareasDeLaColumna.map(function (task) {
          return createTaskHtml(task.id, task.name, task.description, task.dueDate,
                                task.status, task.category, task.priority);
        }).join('');
      }

      contenedor.scrollTop = scroll;
      document.querySelector(columna.contador).textContent = tareasDeLaColumna.length;
    }

    this.renderSummary();
  }

  // Actualiza las 4 cards de resumen y la barra de progreso
  renderSummary() {
    const total = this.tasks.length;
    const contar = (status) => this.tasks.filter(function (task) { return task.status === status; }).length;

    const completadas = contar('DONE');
    const enProgreso = contar('ENPROGRESO');
    const porHacer = contar('PORHACER');
    const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

    document.querySelector('#resumen-total').textContent = total;
    document.querySelector('#resumen-completadas').textContent = completadas;
    document.querySelector('#resumen-progreso').textContent = enProgreso;
    document.querySelector('#resumen-porhacer').textContent = porHacer;

    document.querySelector('#progreso-porcentaje').textContent = porcentaje + '%';
    document.querySelector('#progreso-barra').style.width = porcentaje + '%';
    document.querySelector('#progreso-contenedor').setAttribute('aria-valuenow', porcentaje);
    document.querySelector('#progreso-texto').textContent = completadas + ' de ' + total + ' tareas completadas';
  }
}
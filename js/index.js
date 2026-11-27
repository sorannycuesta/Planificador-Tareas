// ===== Instancia de TaskManager =====
// taskManager.js se carga antes que este archivo, por eso la clase ya existe aquí.
const taskManager = new TaskManager();

// ===== Tarea 6: cargar las tareas guardadas y mostrarlas =====

// Tareas de ejemplo: solo se usan la PRIMERA vez, cuando todavía no hay nada guardado.
const tareasDeEjemplo = [
  { id: 1, name: 'Landing page', description: 'Maquetar la página de inicio con Bootstrap, con sección principal, servicios y contacto.', dueDate: '2026-12-02', status: 'PORHACER', category: 'Website', priority: 'Alta' },
  { id: 2, name: 'Guía de estilos', description: 'Definir paleta, tipografías y reglas de uso del logotipo en un documento breve.', dueDate: '2026-12-10', status: 'PORHACER', category: 'Branding', priority: 'Baja' },
  { id: 3, name: 'Crear flujo de usuario', description: 'Dibujar el recorrido de la app desde el registro hasta la primera tarea creada.', dueDate: '2026-11-30', status: 'ENPROGRESO', category: 'App móvil', priority: 'Media' },
  { id: 4, name: 'Prototipo de la tarjeta', description: 'Diseñar la tarjeta de tarea con nombre, descripción, fecha y estado.', dueDate: '2026-11-28', status: 'ENPROGRESO', category: 'Diseño', priority: 'Alta' },
  { id: 5, name: 'Revisar wireframes', description: 'Validar la estructura de pantallas con el equipo y registrar los ajustes pedidos.', dueDate: '2026-11-20', status: 'DONE', previousStatus: 'PORHACER', category: 'Diseño', priority: 'Media' }
];

// load() devuelve false si no hay nada guardado (primera visita)
const hayTareasGuardadas = taskManager.load();
if (!hayTareasGuardadas) {
  taskManager.tasks = tareasDeEjemplo;
  taskManager.currentId = tareasDeEjemplo.length; // el próximo id será el 6
  taskManager.save();
}

console.log(taskManager.tasks);
taskManager.render();

// ===== validación del formulario "Nueva tarea" =====

const modalElement = document.querySelector('#modalTarea');
const newTaskForm = document.querySelector('#newTaskForm');
const newTaskNameInput = document.querySelector('#newTaskNameInput');
const newTaskDescriptionInput = document.querySelector('#newTaskDescriptionInput');
const newTaskDueDateInput = document.querySelector('#newTaskDueDateInput');
const newTaskStatusSelect = document.querySelector('#newTaskStatusSelect');
const newTaskCategorySelect = document.querySelector('#newTaskCategorySelect');
const newTaskPrioritySelect = document.querySelector('#newTaskPrioritySelect');
const taskErrorAlert = document.querySelector('#taskErrorAlert');
const taskSuccessAlert = document.querySelector('#taskSuccessAlert');
let successTimer = null;

/**
 * Revisa los datos del formulario.
 * @param {{name: string, description: string, dueDate: string, status: string}} data
 * @returns {{isValid: boolean, errors: {field: string, message: string}[]}}
 */
function validFormFieldInput(data) {
  const errors = [];

  if (data.name.trim() === '') {
    errors.push({ field: 'name', message: 'El nombre de la tarea no puede estar vacío.' });
  }
  if (data.description.trim() === '') {
    errors.push({ field: 'description', message: 'La descripción no puede estar vacía.' });
  }
  if (data.dueDate === '') {
    errors.push({ field: 'dueDate', message: 'Debes elegir una fecha de entrega.' });
  }
  if (data.status === '') {
    errors.push({ field: 'status', message: 'Debes seleccionar un estado.' });
  }

  return { isValid: errors.length === 0, errors: errors };
}

// Campo (en los datos) -> elemento HTML, para marcarlo en rojo
const fieldElements = {
  name: newTaskNameInput,
  description: newTaskDescriptionInput,
  dueDate: newTaskDueDateInput,
  status: newTaskStatusSelect
};

function showErrors(errors) {
  taskErrorAlert.innerHTML =
    '<strong>Revisa el formulario:</strong><ul class="mb-0">' +
    errors.map(function (e) { return '<li>' + e.message + '</li>'; }).join('') +
    '</ul>';
  taskErrorAlert.classList.remove('d-none');
}

function hideErrors() {
  taskErrorAlert.classList.add('d-none');
  taskErrorAlert.innerHTML = '';
  Object.values(fieldElements).forEach(function (el) {
    el.classList.remove('is-invalid');
  });
}

// Confirmación visible durante 4 segundos
function showSuccess(taskName) {
  taskSuccessAlert.textContent = 'La tarea "' + taskName.trim() + '" se registró correctamente.';
  taskSuccessAlert.classList.remove('d-none');
  clearTimeout(successTimer);
  successTimer = setTimeout(function () {
    taskSuccessAlert.classList.add('d-none');
  }, 4000);
}

newTaskForm.addEventListener('submit', function (event) {
  event.preventDefault();

  // 1. Recuperar los datos
  const data = {
    name: newTaskNameInput.value,
    description: newTaskDescriptionInput.value,
    dueDate: newTaskDueDateInput.value,
    status: newTaskStatusSelect.value
  };

  // 2. Comprobar que se leen bien
  console.log('name: ' + data.name);
  console.log('description: ' + data.description);
  console.log('dueDate: ' + data.dueDate);
  console.log('status: ' + data.status);

  // 3. Validar
  const result = validFormFieldInput(data);
  hideErrors();

  if (!result.isValid) {
    result.errors.forEach(function (e) {
      fieldElements[e.field].classList.add('is-invalid');
    });
    showErrors(result.errors);
    console.log('Formulario inválido:', result.errors);
    return;
  }

  // 4. Datos válidos: la alerta ya está oculta
  console.log('Formulario válido:', data);

  // 5. Solo ahora, con datos válidos, registramos la tarea en TaskManager
  taskManager.addTask(
    data.name.trim(),
    data.description.trim(),
    data.dueDate,
    data.status,
    newTaskCategorySelect.value,
    newTaskPrioritySelect.value
  );
  taskManager.save();   // guardamos en localStorage
  taskManager.render(); // dibujamos la lista con la tarea nueva
  console.log(taskManager.tasks);

  // 6. Confirmación, formulario limpio y ventana cerrada
  showSuccess(data.name);
  newTaskForm.reset();
  bootstrap.Modal.getOrCreateInstance(modalElement).hide();
});

// Al cerrar la ventana se limpia cualquier error anterior
modalElement.addEventListener('hidden.bs.modal', function () {
  hideErrors();
  newTaskForm.reset();
});

// ===== Tarea 7 y 6: botones de las tarjetas (Mark As Done, Desmarcar y Eliminar) =====

// La lista de tareas tiene id="lista-tareas" en index.html
const tasksList = document.querySelector('#lista-tareas');

// UN solo EventListener en la lista sirve para todas las tarjetas, aunque se creen después.
tasksList.addEventListener('click', (event) => {
  // closest sube desde el elemento clicado hasta encontrar la tarjeta (parentTask)
  const parentTask = event.target.closest('.tarjeta-tarea');
  if (!parentTask) return; // el clic no fue dentro de una tarjeta

  // data-task-id llega como texto ("3"); lo convertimos a número para compararlo con task.id
  const taskId = Number(parentTask.dataset.taskId);

  // Botón "Mark As Done": la tarea pasa a status 'DONE'
  if (event.target.closest('.done-button')) {
    console.log(parentTask); // prueba: debe mostrar la tarjeta con su data-task-id
    const task = taskManager.getTaskById(taskId);
    task.previousStatus = task.status; // lo guardamos para poder desmarcar después
    task.status = 'DONE';
    taskManager.save();
    taskManager.render();
    return;
  }

  // Botón "Desmarcar": la tarea vuelve al estado que tenía antes
  if (event.target.closest('.undo-button')) {
    const task = taskManager.getTaskById(taskId);
    task.status = task.previousStatus || 'PORHACER';
    taskManager.save();
    taskManager.render();
    return;
  }

  // Botón "Eliminar"
  if (event.target.closest('.delete-button')) {
    taskManager.deleteTask(taskId);
    taskManager.save();
    taskManager.render();
    console.log('Tarea eliminada. Quedan:', taskManager.tasks);
  }
});
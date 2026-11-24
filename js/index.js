// ===== instancia de TaskManager =====
// taskManager.js se carga antes que este archivo, por eso la clase ya existe aquí.
const taskManager = new TaskManager();
console.log(taskManager.tasks); // Debe mostrar: []


// ===== validación del formulario "Nueva tarea" =====

const modalElement = document.querySelector('#modalTarea');
const newTaskForm = document.querySelector('#newTaskForm');
const newTaskNameInput = document.querySelector('#newTaskNameInput');
const newTaskDescriptionInput = document.querySelector('#newTaskDescriptionInput');
const newTaskDueDateInput = document.querySelector('#newTaskDueDateInput');
const newTaskStatusSelect = document.querySelector('#newTaskStatusSelect');
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
    data.status
  );
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

// ===== Marcar / desmarcar una tarea como completada =====

// Cómo se ve el badge de estado en cada caso
const ESTADOS = {
  porhacer: { texto: 'Por hacer',   icono: 'bi-flag',              clase: 'estado-porhacer' },
  progreso: { texto: 'En progreso', icono: 'bi-clock',             clase: 'estado-progreso' },
  cerrado:  { texto: 'Completada',  icono: 'bi-check-circle-fill', clase: 'estado-cerrado' }
};

const listaTareas = document.querySelector('#lista-tareas');

// Cambia el badge de la tarjeta (Por hacer, En progreso o Completada)
function mostrarEstado(card, clave) {
  const badge = card.querySelector('.estado');
  const estado = ESTADOS[clave];
  badge.className = 'estado ' + estado.clase;
  badge.innerHTML = '<i class="bi ' + estado.icono + '" aria-hidden="true"></i> ' + estado.texto;
}

// Cambia el aspecto del botón según la tarea esté completada o no
function actualizarBoton(boton, completada) {
  boton.setAttribute('aria-pressed', completada);
  boton.querySelector('i').className = completada ? 'bi bi-check-circle-fill' : 'bi bi-circle';
  boton.querySelector('.btn-completar-texto').textContent = completada ? 'Desmarcar' : 'Marcar como completada';
}

// Interruptor (toggle): cada clic alterna entre completada y pendiente
function toggleCompletada(card, boton) {
  const completada = card.classList.toggle('completada');

  mostrarEstado(card, completada ? 'cerrado' : card.dataset.estadoPendiente);
  actualizarBoton(boton, completada);

  console.log('Tarea "' + card.querySelector('.tarea-titulo').textContent + '" completada:', completada);
}

// Un solo "oyente" en la lista: detecta el clic en cualquier botón de tarea
listaTareas.addEventListener('click', function (event) {
  const boton = event.target.closest('.btn-completar');
  if (!boton) return; // el clic fue en otra cosa

  const card = boton.closest('.tarjeta-tarea');
  toggleCompletada(card, boton);
});
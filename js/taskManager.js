class TaskManager {
  // currentId es el último id usado. Si no se indica, empieza en 0.
  constructor(currentId = 0) {
    this.tasks = [];
    this.currentId = currentId;
  }

  // Crea una tarea nueva y la guarda en this.tasks
  addTask(name, description, dueDate, status) {

    this.currentId++;

    // Guardamos un objeto con los datos de la tarea.
    this.tasks.push({
      id: this.currentId,
      name: name,
      description: description,
      dueDate: dueDate,
      status: 'PORHACER'
    });
  }
}
let isScheduling = false;

const jobs: (() => Promise<void> | void)[] = [];

export function enqueueJob(job: () => Promise<void> | void) {
  jobs.push(job);

  scheduleUpdate();
}

export function scheduleUpdate() {
  if (isScheduling) {
    return;
  }

  isScheduling = true;
  // Планируем выполнение всех задач через queueMicrotask
  // Это означает, что processJobs() выполнится в следующем тике событийного цикла
  queueMicrotask(processJobs);
}

function processJobs() {
  // Выполняем все задачи из очереди
  while (jobs.length > 0) {
    const job = jobs.shift();
    if (job) {
      const result = job();

      // Если задача возвращает промис, обрабатываем его
      Promise.resolve(result)
        .then(() => {})
        .catch((error) => {
          console.error("Ошибка при выполнении задачи:", error);
        });
    }
  }
  isScheduling = false;
}

export function nextTick() {
  scheduleUpdate();

  return flushPromises();
}

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

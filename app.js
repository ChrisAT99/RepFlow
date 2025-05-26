// app.js

const presetWorkouts = {
  legs: ['Squats', 'Lunges', 'Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raises'],
  shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Shrugs', 'Reverse Fly'],
  biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Concentration Curl'],
  triceps: ['Triceps Pushdown', 'Skull Crushers', 'Dips', 'Overhead Triceps Extension'],
  back: ['Pull-Ups', 'Bent-over Row', 'Lat Pulldown', 'Deadlift', 'Seated Row'],
  chest: ['Bench Press', 'Push-ups', 'Chest Fly', 'Incline Bench Press'],
  core: ['Plank', 'Crunches', 'Leg Raises', 'Russian Twist', 'Sit-ups'],
  cardio: ['Running', 'Cycling', 'Jump Rope', 'Rowing', 'Swimming'],
  other: ['Yoga', 'Stretching', 'Foam Rolling']
};

let workouts = [];
let editIndex = null;

const workoutForm = document.getElementById('workoutForm');
const categorySelect = document.getElementById('categorySelect');
const exerciseInput = document.getElementById('exerciseInput');
const exerciseList = document.getElementById('exerciseList');
const repsInput = document.getElementById('repsInput');
const weightInput = document.getElementById('weightInput');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const filterCategory = document.getElementById('filterCategory');
const timeframeSelect = document.getElementById('timeframeSelect');
const customDateRange = document.getElementById('customDateRange');
const startDateInput = document.getElementById('startDateInput');
const endDateInput = document.getElementById('endDateInput');
const applyCustomRangeBtn = document.getElementById('applyCustomRangeBtn');

const workoutList = document.getElementById('workoutList');
const statsContainer = document.getElementById('statsContainer');
const categoryStatsContainer = document.getElementById('categoryStatsContainer');

const repsChartCtx = document.getElementById('repsChart').getContext('2d');
const weightChartCtx = document.getElementById('weightChart').getContext('2d');
const categoryRepsChartCtx = document.getElementById('categoryRepsChart').getContext('2d');
const categoryWeightChartCtx = document.getElementById('categoryWeightChart').getContext('2d');

let repsChart = null;
let weightChart = null;
let categoryRepsChart = null;
let categoryWeightChart = null;

let currentFilterCategory = 'all';
let currentTimeFrame = 'lastWeek';
let customRange = null;

// Initialization
loadWorkouts();
populateExerciseList();
renderWorkoutList();
renderStats();
renderCategoryStats();
updateCharts();

// Event Listeners

categorySelect.addEventListener('change', () => {
  populateExerciseList();
  exerciseInput.value = '';
});

workoutForm.addEventListener('submit', e => {
  e.preventDefault();
  const category = categorySelect.value;
  const exercise = exerciseInput.value.trim();
  const reps = parseInt(repsInput.value, 10);
  const weight = parseFloat(weightInput.value);

  if (!category) {
    alert('Please select a category.');
    return;
  }
  if (!exercise) {
    alert('Please enter an exercise.');
    return;
  }
  if (isNaN(reps) || reps <= 0) {
    alert('Please enter a valid number of reps.');
    return;
  }
  if (isNaN(weight) || weight < 0) {
    alert('Please enter a valid weight (0 or more).');
    return;
  }

  const workoutEntry = {
    category,
    exercise,
    reps,
    weight,
    date: new Date().toISOString()
  };

  if (editIndex !== null) {
    workouts[editIndex] = workoutEntry;
    editIndex = null;
    submitBtn.textContent = 'Add Workout';
    cancelEditBtn.style.display = 'none';
  } else {
    workouts.push(workoutEntry);
  }

  saveWorkouts();
  renderWorkoutList();
  renderStats();
  renderCategoryStats();
  updateCharts();
  workoutForm.reset();
});

cancelEditBtn.addEventListener('click', () => {
  editIndex = null;
  workoutForm.reset();
  submitBtn.textContent = 'Add Workout';
  cancelEditBtn.style.display = 'none';
});

filterCategory.addEventListener('change', e => {
  currentFilterCategory = e.target.value;
  renderWorkoutList();
  renderStats();
  renderCategoryStats();
  updateCharts();
});

timeframeSelect.addEventListener('change', e => {
  currentTimeFrame = e.target.value;
  if (currentTimeFrame === 'custom') {
    customDateRange.style.display = 'flex';
  } else {
    customDateRange.style.display = 'none';
    customRange = null;
    renderStats();
    renderCategoryStats();
    updateCharts();
  }
});

applyCustomRangeBtn.addEventListener('click', () => {
  const startVal = startDateInput.value;
  const endVal = endDateInput.value;
  if (!startVal || !endVal) {
    alert('Please select both start and end dates.');
    return;
  }
  const start = new Date(startVal);
  const end = new Date(endVal);
  if (start > end) {
    alert('Start date cannot be after end date.');
    return;
  }
  customRange = { start, end };
  renderStats();
  renderCategoryStats();
  updateCharts();
});

// Functions

function saveWorkouts() {
  localStorage.setItem('workouts', JSON.stringify(workouts));
}

function loadWorkouts() {
  const saved = localStorage.getItem('workouts');
  if (saved) {
    try {
      workouts = JSON.parse(saved).map(w => ({
        ...w,
        date: new Date(w.date).toISOString()
      }));
    } catch {
      workouts = [];
    }
  } else {
    workouts = [];
  }
}

function populateExerciseList() {
  const category = categorySelect.value;
  exerciseList.innerHTML = '';
  if (presetWorkouts[category]) {
    presetWorkouts[category].forEach(ex => {
      const option = document.createElement('option');
      option.value = ex;
      exerciseList.appendChild(option);
    });
  }
}

function filterWorkouts() {
  return workouts.filter(w => {
    const categoryMatch = currentFilterCategory === 'all' || w.category === currentFilterCategory;

    let dateMatch = true;
    const now = new Date();

    const workoutDate = new Date(w.date);

    if (currentTimeFrame === 'lastWorkout') {
      if (workouts.length < 2) {
        dateMatch = true;
      } else {
        const sorted = workouts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastWorkoutDate = new Date(sorted[1].date);
        dateMatch = workoutDate >= lastWorkoutDate;
      }
    } else if (currentTimeFrame === 'lastWeek') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      dateMatch = workoutDate >= oneWeekAgo && workoutDate <= now;
    } else if (currentTimeFrame === 'lastMonth') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      dateMatch = workoutDate >= oneMonthAgo && workoutDate <= now;
    } else if (currentTimeFrame === 'custom' && customRange) {
      dateMatch = workoutDate >= customRange.start && workoutDate <= customRange.end;
    }

    return categoryMatch && dateMatch;
  });
}

function renderWorkoutList() {
  const filteredWorkouts = filterWorkouts();
  workoutList.innerHTML = '';

  if (filteredWorkouts.length === 0) {
    workoutList.textContent = 'No workouts found.';
    return;
  }

  filteredWorkouts.forEach((w, idx) => {
    const div = document.createElement('div');
    div.className = 'workout-entry';
    div.innerHTML = `
      <strong>${w.exercise}</strong> (${w.category}) - Reps: ${w.reps}, Weight: ${w.weight}kg, Date: ${new Date(w.date).toLocaleDateString()}
      <button data-index="${idx}" class="edit-btn">Edit</button>
      <button data-index="${idx}" class="delete-btn">Delete</button>
    `;
    workoutList.appendChild(div);
  });

  // Add event listeners for edit and delete buttons
  workoutList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index, 10);
      loadWorkoutForEdit(index);
    });
  });

  workoutList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index, 10);
      if (confirm('Are you sure you want to delete this workout?')) {
        workouts.splice(index, 1);
        saveWorkouts();
        renderWorkoutList();
        renderStats();
        renderCategoryStats();
        updateCharts();
      }
    });
  });
}

function loadWorkoutForEdit(index) {
  const w = filterWorkouts()[index];
  if (!w) return;

  // Find actual index in the main workouts array
  const actualIndex = workouts.findIndex(work => work.date === w.date && work.exercise === w.exercise && work.category === w.category);
  if (actualIndex === -1) return;

  editIndex = actualIndex;
  categorySelect.value = w.category;
  populateExerciseList();
  exerciseInput.value = w.exercise;
  repsInput.value = w.reps;
  weightInput.value = w.weight;
  submitBtn.textContent = 'Update Workout';
  cancelEditBtn.style.display = 'inline-block';
}

function renderStats() {
  const filtered = filterWorkouts();

  // Calculate total reps and average weight per exercise
  const stats = {};
  filtered.forEach(w => {
    if (!stats[w.exercise]) {
      stats[w.exercise] = { reps: 0, totalWeight: 0, count: 0 };
    }
    stats[w.exercise].reps += w.reps;
    stats[w.exercise].totalWeight += w.weight;
    stats[w.exercise].count++;
  });

  statsContainer.innerHTML = '';
  for (const exercise in stats) {
    const avgWeight = (stats[exercise].totalWeight / stats[exercise].count).toFixed(1);
    const div = document.createElement('div');
    div.textContent = `${exercise}: Total Reps: ${stats[exercise].reps}, Avg Weight: ${avgWeight} kg`;
    statsContainer.appendChild(div);
  }
}

function renderCategoryStats() {
  const filtered = filterWorkouts();

  const categoryStats = {};
  filtered.forEach(w => {
    if (!categoryStats[w.category]) {
      categoryStats[w.category] = { reps: 0, totalWeight: 0, count: 0 };
    }
    categoryStats[w.category].reps += w.reps;
    categoryStats[w.category].totalWeight += w.weight;
    categoryStats[w.category].count++;
  });

  categoryStatsContainer.innerHTML = '';
  for (const category in categoryStats) {
    const avgWeight = (categoryStats[category].totalWeight / categoryStats[category].count).toFixed(1);
    const div = document.createElement('div');
    div.textContent = `${capitalize(category)}: Total Reps: ${categoryStats[category].reps}, Avg Weight: ${avgWeight} kg`;
    categoryStatsContainer.appendChild(div);
  }
}

function updateCharts() {
  const filtered = filterWorkouts();

  // Aggregate per exercise: total reps and average weight
  const exerciseData = {};
  filtered.forEach(w => {
    if (!exerciseData[w.exercise]) {
      exerciseData[w.exercise] = { reps: 0, totalWeight: 0, count: 0 };
    }
    exerciseData[w.exercise].reps += w.reps;
    exerciseData[w.exercise].totalWeight += w.weight;
    exerciseData[w.exercise].count++;
  });

  const exerciseLabels = Object.keys(exerciseData);
  const repsData = exerciseLabels.map(e => exerciseData[e].reps);
  const avgWeightData = exerciseLabels.map(e => (exerciseData[e].totalWeight / exerciseData[e].count).toFixed(1));

  // Aggregate per category
  const categoryData = {};
  filtered.forEach(w => {
    if (!categoryData[w.category]) {
      categoryData[w.category] = { reps: 0, totalWeight: 0, count: 0 };
    }
    categoryData[w.category].reps += w.reps;
    categoryData[w.category].totalWeight += w.weight;
    categoryData[w.category].count++;
  });

  const categoryLabels = Object.keys(categoryData).map(capitalize);
  const categoryReps = categoryLabels.map(label => categoryData[label.toLowerCase()].reps);
  const categoryAvgWeight = categoryLabels.map(label => (categoryData[label.toLowerCase()].totalWeight / categoryData[label.toLowerCase()].count).toFixed(1));

  // Destroy existing charts before creating new ones
  if (repsChart) repsChart.destroy();
  if (weightChart) weightChart.destroy();
  if (categoryRepsChart) categoryRepsChart.destroy();
  if (categoryWeightChart) categoryWeightChart.destroy();

  repsChart = new Chart(repsChartCtx, {
    type: 'bar',
    data: {
      labels: exerciseLabels,
      datasets: [{
        label: 'Total Reps',
        data: repsData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  weightChart = new Chart(weightChartCtx, {
    type: 'bar',
    data: {
      labels: exerciseLabels,
      datasets: [{
        label: 'Average Weight (kg)',
        data: avgWeightData,
        backgroundColor: 'rgba(255, 99, 132, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  categoryRepsChart = new Chart(categoryRepsChartCtx, {
    type: 'bar',
    data: {
      labels: categoryLabels,
      datasets: [{
        label: 'Total Reps',
        data: categoryReps,
        backgroundColor: 'rgba(75, 192, 192, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  categoryWeightChart = new Chart(categoryWeightChartCtx, {
    type: 'bar',
    data: {
      labels: categoryLabels,
      datasets: [{
        label: 'Average Weight (kg)',
        data: categoryAvgWeight,
        backgroundColor: 'rgba(153, 102, 255, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

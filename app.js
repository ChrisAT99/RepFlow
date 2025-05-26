// app.js

// Preset workout list categorized
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

// Data
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

// --- Initialization ---

loadWorkouts();
populateExerciseList();
renderWorkoutList();
renderStats();
renderCategoryStats();
updateCharts();

// --- Event Listeners ---

// Change preset exercises when category changes in input form
categorySelect.addEventListener('change', () => {
  populateExerciseList();
  exerciseInput.value = ''; // reset input
});

// Form submit (add/update)
workoutForm.addEventListener('submit', e => {
  e.preventDefault();
  const category = categorySelect.value.trim();
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
    date: new Date()
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

// Cancel edit button
cancelEditBtn.addEventListener('click', () => {
  editIndex = null;
  workoutForm.reset();
  submitBtn.textContent = 'Add Workout';
  cancelEditBtn.style.display = 'none';
});

// Filter category change
filterCategory.addEventListener('change', e => {
  currentFilterCategory = e.target.value;
  renderWorkoutList();
  renderStats();
  renderCategoryStats();
  updateCharts();
});

// Time frame change
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

// Apply custom date range filter
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

// --- Functions ---

function saveWorkouts() {
  localStorage.setItem('workouts', JSON.stringify(workouts));
}

function loadWorkouts() {
  const saved = localStorage.getItem('workouts');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      workouts = parsed.map(w => ({ ...w, date: new Date(w.date) }));
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

    if (currentTimeFrame === 'lastWorkout') {
      if (workouts.length < 2) dateMatch = true;
      else {
        const sorted = workouts.slice().sort((a, b) => b.date - a.date);
        const lastWorkoutDate = sorted[1].date;
        dateMatch = w.date >= lastWorkoutDate;
      }
    } else if (currentTimeFrame === 'lastWeek') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      dateMatch = w.date >= oneWeekAgo && w.date <= now;
    } else if (currentTimeFrame === 'lastMonth') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      dateMatch = w.date >= oneMonthAgo && w.date <= now;
    } else if (currentTimeFrame === 'custom' && customRange) {
      dateMatch = w.date >= customRange.start && w.date <= customRange.end;
    }

    return categoryMatch && dateMatch;
  });
}

function renderWorkoutList() {
  const filtered = filterWorkouts();
  workoutList.innerHTML = '';
  if (filtered.length === 0) {
    workoutList.textContent = 'No workouts found for the selected filters.';
    return;
  }
  filtered.forEach((w, i) => {
    const div = document.createElement('div');
    div.className = 'workout-entry';
    div.innerHTML = `
      <div><strong>${w.exercise}</strong> (${w.category})</div>
      <div>Reps: ${w.reps}</div>
      <div>Weight: ${w.weight.toFixed(1)} kg</div>
      <div class="workout-date">${w.date.toLocaleDateString()}</div>
      <div class="workout-actions">
        <button data-index="${i}" class="edit-btn">Edit</button>
        <button data-index="${i}" class="delete-btn">Delete</button>
      </div>
    `;
    workoutList.appendChild(div);
  });

  workoutList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.index, 10);
      const workout = filterWorkouts()[idx];

      const actualIndex = workouts.findIndex(w => w === workout);

      editIndex = actualIndex;
      categorySelect.value = workout.category;
      populateExerciseList();
      exerciseInput.value = workout.exercise;
      repsInput.value = workout.reps;
      weightInput.value = workout.weight;
      submitBtn.textContent = 'Update Workout';
      cancelEditBtn.style.display = 'inline-block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  workoutList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!confirm('Delete this workout?')) return;
      const idx = parseInt(e.target.dataset.index, 10);
      const workout = filterWorkouts()[idx];
      const actualIndex = workouts.findIndex(w => w === workout);
      if (actualIndex !== -1) {
        workouts.splice(actualIndex, 1);
        saveWorkouts();
        renderWorkoutList();
        renderStats();
        renderCategoryStats();
        updateCharts();
      }
    });
  });
}

function getFilteredWorkoutsByExercise() {
  const filtered = filterWorkouts();
  const map = {};
  filtered.forEach(w => {
    if (!map[w.exercise]) {
      map[w.exercise] = { reps: 0, weight: 0, count: 0 };
    }
    map[w.exercise].reps += w.reps;
    map[w.exercise].weight += w.weight;
    map[w.exercise].count++;
  });
  return map;
}

function getFilteredWorkoutsByCategory() {
  const filtered = filterWorkouts();
  const map = {};
  filtered.forEach(w => {
    if (!map[w.category]) {
      map[w.category] = { reps: 0, weight: 0, count: 0 };
    }
    map[w.category].reps += w.reps;
    map[w.category].weight += w.weight;
    map[w.category].count++;
  });
  return map;
}

function renderStats() {
  const stats = getFilteredWorkoutsByExercise();
  if (Object.keys(stats).length === 0) {
    statsContainer.innerHTML = '<p>No stats to display for the current filters.</p>';
    return;
  }

  let html = '<h2>Workout Stats (by Exercise)</h2><table><thead><tr><th>Exercise</th><th>Total Reps</th><th>Avg Weight (kg)</th></tr></thead><tbody>';
  for (const exercise in stats) {
    const data = stats[exercise];
    const avgWeight = data.count > 0 ? (data.weight / data.count).toFixed(1) : '0';
    html += `<tr><td>${exercise}</td><td>${data.reps}</td><td>${avgWeight}</td></tr>`;
  }
  html += '</tbody></table>';
  statsContainer.innerHTML = html;
}

function renderCategoryStats() {
  const stats = getFilteredWorkoutsByCategory();
  if (Object.keys(stats).length === 0) {
    categoryStatsContainer.innerHTML = '<p>No category stats to display for the current filters.</p>';
    return;
  }

  let html = '<h2>Workout Stats (by Category)</h2><table><thead><tr><th>Category</th><th>Total Reps</th><th>Avg Weight (kg)</th></tr></thead><tbody>';
  for (const cat in stats) {
    const data = stats[cat];
    const avgWeight = data.count > 0 ? (data.weight / data.count).toFixed(1) : '0';
    html += `<tr><td>${cat}</td><td>${data.reps}</td><td>${avgWeight}</td></tr>`;
  }
  html += '</tbody></table>';
  categoryStatsContainer.innerHTML = html;
}

function updateCharts() {
  const stats = getFilteredWorkoutsByExercise();
  const categoriesStats = getFilteredWorkoutsByCategory();

  // Exercise charts
  const labels = Object.keys(stats);
  const repsData = labels.map(ex => stats[ex].reps);
  const avgWeightData = labels.map(ex => stats[ex].count > 0 ? stats[ex].weight / stats[ex].count : 0);

  if (repsChart) repsChart.destroy();
  repsChart = new Chart(repsChartCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total Reps',
        data: repsData,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  if (weightChart) weightChart.destroy();
  weightChart = new Chart(weightChartCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Weight (kg)',
        data: avgWeightData,
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Category charts
  const catLabels = Object.keys(categoriesStats);
  const catRepsData = catLabels.map(cat => categoriesStats[cat].reps);
  const catAvgWeightData = catLabels.map(cat => categoriesStats[cat].count > 0 ? categoriesStats[cat].weight / categoriesStats[cat].count : 0);

  if (categoryRepsChart) categoryRepsChart.destroy();
  categoryRepsChart = new Chart(categoryRepsChartCtx, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{
        label: 'Total Reps',
        data: catRepsData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  if (categoryWeightChart) categoryWeightChart.destroy();
  categoryWeightChart = new Chart(categoryWeightChartCtx, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{
        label: 'Avg Weight (kg)',
        data: catAvgWeightData,
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

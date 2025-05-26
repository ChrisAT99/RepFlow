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
  const category = categorySelect.value.trim().toLowerCase();
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
  console.log('Saving workouts:', workouts);
  localStorage.setItem('workouts', JSON.stringify(workouts));
}

function loadWorkouts() {
  const saved = localStorage.getItem('workouts');
  console.log('Loaded workouts:', saved);
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
  const category = categorySelect.value.trim().toLowerCase();
  console.log('populateExerciseList category:', category);
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

// ... rest of your functions remain unchanged ...

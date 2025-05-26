// app.js

// Get DOM elements
const addWorkoutForm = document.getElementById('addWorkoutForm');
const exerciseInput = document.getElementById('exerciseInput');
const repsInput = document.getElementById('repsInput');
const weightInput = document.getElementById('weightInput');

const timeframeSelect = document.getElementById('timeframeSelect');
const customDateRange = document.getElementById('customDateRange');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const applyCustomRangeBtn = document.getElementById('applyCustomRange');

const statsContainer = document.getElementById('statsContainer');

let workouts = loadWorkouts();
let currentTimeFrame = 'lastWorkout';
let customRange = null;

// Load workouts from localStorage or initialize empty
function loadWorkouts() {
  const data = localStorage.getItem('workouts');
  if (data) return JSON.parse(data).map(w => ({ 
    ...w, 
    date: new Date(w.date) 
  }));
  return [];
}

// Save workouts to localStorage
function saveWorkouts() {
  localStorage.setItem('workouts', JSON.stringify(workouts));
}

// Add new workout
addWorkoutForm.addEventListener('submit', e => {
  e.preventDefault();

  const exercise = exerciseInput.value.trim();
  const reps = parseInt(repsInput.value);
  const weight = parseFloat(weightInput.value);
  const date = new Date();

  if (!exercise || reps <= 0 || weight < 0) {
    alert('Please enter valid values.');
    return;
  }

  workouts.push({ exercise, reps, weight, date });
  saveWorkouts();

  exerciseInput.value = '';
  repsInput.value = '';
  weightInput.value = '';

  renderStats();
});

// Show/hide custom date inputs
timeframeSelect.addEventListener('change', () => {
  currentTimeFrame = timeframeSelect.value;
  customRange = null;

  if (currentTimeFrame === 'custom') {
    customDateRange.style.display = 'block';
  } else {
    customDateRange.style.display = 'none';
    renderStats();
  }
});

applyCustomRangeBtn.addEventListener('click', () => {
  const start = startDateInput.value ? new Date(startDateInput.value) : null;
  const end = endDateInput.value ? new Date(endDateInput.value) : null;

  if (!start || !end || start > end) {
    alert('Please select a valid date range.');
    return;
  }

  customRange = { start, end };
  renderStats();
});

// Utility: Filter workouts by exercise and date range
function filterWorkouts(exercise, startDate, endDate) {
  return workouts.filter(w => 
    w.exercise.toLowerCase() === exercise.toLowerCase() &&
    w.date >= startDate &&
    w.date <= endDate
  );
}

// Get unique exercises from workouts
function getExercises() {
  const set = new Set(workouts.map(w => w.exercise.toLowerCase()));
  return Array.from(set);
}

// Calculate average reps and weight from an array of workouts
function calcAverages(workoutsArr) {
  if (workoutsArr.length === 0) return { avgReps: 0, avgWeight: 0 };
  const totalReps = workoutsArr.reduce((sum, w) => sum + w.reps, 0);
  const totalWeight = workoutsArr.reduce((sum, w) => sum + w.weight, 0);
  return {
    avgReps: totalReps / workoutsArr.length,
    avgWeight: totalWeight / workoutsArr.length
  };
}

// Calculate % change between newValue and oldValue
function calcPercentChange(newValue, oldValue) {
  if (oldValue === 0) return null; // Can't calculate %
  return ((newValue - oldValue) / oldValue) * 100;
}

// Render stats for all exercises
function renderStats() {
  statsContainer.innerHTML = '';

  if (workouts.length === 0) {
    statsContainer.innerHTML = '<p>No workouts logged yet.</p>';
    return;
  }

  const exercises = getExercises();

  exercises.forEach(exercise => {
    // Determine date ranges based on timeframe
    let currentPeriodStart, currentPeriodEnd, prevPeriodStart, prevPeriodEnd;

    const now = new Date();

    if (currentTimeFrame === 'lastWorkout') {
      // Last workout date for this exercise (excluding latest)
      const sorted = workouts
        .filter(w => w.exercise.toLowerCase() === exercise)
        .sort((a, b) => a.date - b.date);

      if (sorted.length < 2) {
        currentPeriodStart = sorted[sorted.length - 1].date;
        currentPeriodEnd = now;
        prevPeriodStart = null;
        prevPeriodEnd = null;
      } else {
        const lastWorkout = sorted[sorted.length - 1];
        const secondLastWorkout = sorted[sorted.length - 2];
        currentPeriodStart = lastWorkout.date;
        currentPeriodEnd = now;
        prevPeriodStart = secondLastWorkout.date;
        prevPeriodEnd = lastWorkout.date;
      }

    } else if (currentTimeFrame === 'lastWeek') {
      // This week and last week (Monday-Sunday)
      const day = now.getDay(); // 0 = Sunday
      const diffToMonday = day === 0 ? 6 : day - 1;
      currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(now.getDate() - diffToMonday);
      currentPeriodStart.setHours(0,0,0,0);
      currentPeriodEnd = now;

      prevPeriodStart = new Date(currentPeriodStart);
      prevPeriodStart.setDate(currentPeriodStart.getDate() - 7);
      prevPeriodStart.setHours(0,0,0,0);
      prevPeriodEnd = new Date(currentPeriodStart);
      prevPeriodEnd.setHours(0,0,0,0);

    } else if (currentTimeFrame === 'lastMonth') {
      // This month and last month
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentPeriodEnd = now;

      prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    } else if (currentTimeFrame === 'custom' && customRange) {
      currentPeriodStart = customRange.start;
      currentPeriodEnd = customRange.end;

      // For custom, previous period is same length immediately before current
      const diffTime = currentPeriodEnd - currentPeriodStart;
      prevPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
      prevPeriodStart = new Date(prevPeriodEnd.getTime() - diffTime);
    } else {
      // Default fallback - show all data
      currentPeriodStart = new Date(0);
      currentPeriodEnd = now;
      prevPeriodStart = null;
      prevPeriodEnd = null;
    }

    // Filter workouts for current and previous periods
    const currentWorkouts = filterWorkouts(exercise, currentPeriodStart, currentPeriodEnd);
    const prevWorkouts = prevPeriodStart && prevPeriodEnd 
      ? filterWorkouts(exercise, prevPeriodStart, prevPeriodEnd) 
      : [];

    const currentAvg = calcAverages(currentWorkouts);
    const prevAvg = calcAverages(prevWorkouts);

    const repsChange = calcPercentChange(currentAvg.avgReps, prevAvg.avgReps);
    const weightChange = calcPercentChange(currentAvg.avgWeight, prevAvg.avgWeight);

    // Create display elements
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-stats';

    const title = document.createElement('h3');
    title.textContent = exercise;
    exerciseDiv.appendChild(title);

    function createStatLine(label, value, change) {
      const line = document.createElement('p');
      line.innerHTML = `<strong>${label}:</strong> ${value.toFixed(2)} 
        ${formatChange(change)}`;
      return line;
    }

    function formatChange(change) {
      if (change === null) return '(N/A)';
      const arrow = change > 0 ? '⬆️' : (change < 0 ? '⬇️' : '➡️');
      const color = change > 0 ? 'green' : (change < 0 ? 'red' : 'gray');
      return `<span style="color:${color}">(${arrow} ${change.toFixed(1)}%)</span>`;
    }

    exerciseDiv.appendChild(createStatLine('Avg Reps', currentAvg.avgReps, repsChange));
    exerciseDiv.appendChild(createStatLine('Avg Weight (kg)', currentAvg.avgWeight, weightChange));

    statsContainer.appendChild(exerciseDiv);
  });
}

// Initial render
renderStats();

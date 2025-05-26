document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("nav button");
  const sections = document.querySelectorAll("section.day");

  // Load saved checkbox states from localStorage
  const savedState = JSON.parse(localStorage.getItem("repflow-state")) || {};

  function saveState() {
    const state = {};
    document.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      state[cb.dataset.ex] = cb.checked;
    });
    localStorage.setItem("repflow-state", JSON.stringify(state));
  }

  // Restore checkbox states
  Object.entries(savedState).forEach(([key, value]) => {
    const checkbox = document.querySelector(`input[data-ex="${key}"]`);
    if (checkbox) checkbox.checked = value;
  });

  // Tab switch logic
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Switch active button
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show relevant section
      const day = btn.dataset.day;
      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === day);
      });
    });
  });

  // Save checkbox state on change
  document.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", saveState);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addWorkoutBtn');
  const modal = document.getElementById('workoutModal');
  const closeModal = document.getElementById('closeModal');
  const form = document.getElementById('workoutForm');
  const nameInput = document.getElementById('workoutName');
  const dateInput = document.getElementById('workoutDate');

  addBtn.onclick = () => { modal.style.display = 'flex'; };
  closeModal.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  form.onsubmit = (e) => {
    e.preventDefault();
    const workout = {
      name: nameInput.value,
      date: dateInput.value
    };
    // Save to localStorage (append to array)
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    modal.style.display = 'none';
    form.reset();
    alert('Workout saved!');
  };
});

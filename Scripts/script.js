"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class WorkOut {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends WorkOut {
  type = "running";
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends WorkOut {
  type = "cycling";
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

//////////////////////////////
// Main App
//////////////////////////////
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get user Postion
    this._getPostion();
    // Get from localStorage
    this._getLocalStorage();
    // AddEventListener
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElveationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPostion() {
    navigator.geolocation?.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("can't get ur loaction");
      }
    );
  }

  _loadMap(postion) {
    const { latitude, longitude } = postion.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // Handle Clickting
    this.#map.on("click", this._showForm.bind(this));
    //add Marker
    this.#workouts.forEach((work) => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }
  _toggleElveationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    //get Data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    let workout;
    // check Validation
    const valid = (...values) => values.every((val) => Number.isFinite(val));
    const allPos = (...values) => values.every((val) => val > 0);
    //Running
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !valid(distance, duration, cadence) ||
        !allPos(distance, duration, cadence)
      )
        return alert(
          "Inputs Take Only Postive Numbers <br> Please ! Enter Postive Number"
        );
      workout = new Running(distance, duration, coords, cadence);
    } else {
      //Cycling
      const elevation = +inputElevation.value;
      if (!valid(distance, duration, elevation) || !allPos(distance, duration))
        return alert(
          "Inputs Take Only Postive Numbers <br> Please ! Enter Postive Number"
        );
      workout = new Cycling(distance, duration, coords, elevation);
    }
    // Add object to workout Array
    this.#workouts.push(workout);
    //Mark in map
    this._renderWorkoutMarker(workout);
    //Render List
    this._renderWorkout(workout);
    //Clear input fields
    this._hideForm();
    //Add To LocalStorage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 350,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__tools">
          <span><img src="images/edit_1159633.png" data-tool="edit"/></span>
          <span><img src="images/delete_3405244.png"data-tool="remove" /></span>
        </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === "running")
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    else
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;
    const workout = this.#workouts.findIndex(
      (wo) => wo.id === workoutEl.dataset.id
    );
    this.#map.setView(this.#workouts[workout].coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    if (e.target.dataset.tool == "remove") {
      this.#map.eachLayer((e) => {
        if (e._latlng) {
          let { lat, lng } = e._latlng;
          let coord = [lat, lng];
          if (this.#workouts[workout].coords[0] == coord[0] && this.#workouts[workout].coords[1] == coord[1]) e.remove();
        }
      });
      this.#workouts.splice(workout, 1);
      workoutEl.remove();
      this._setLocalStorage();
    }
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((work) => this._renderWorkout(work));
  }
}
const app = new App();

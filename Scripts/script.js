"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const sidebarTools = document.querySelector(".sidebar .workout__tools");
const alert = document.querySelector(".alert");
const blackLayer = document.querySelector(".layer");

class WorkOut {
  // clicked = 0;
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
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
  // click() {
  //   this.clicked++;
  // }
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
    sidebarTools.addEventListener("click", this._sideBarEvents.bind(this));
  }
  _showAlert() {
    alert.classList.remove("hidden");
    blackLayer.classList.remove("hidden");
  }
  _hideAlert() {
    alert.classList.add("hidden");
    blackLayer.classList.add("hidden");
  }
  _createAlert(type, headText) {
    alert.textContent = "";
    const html = `
    <div class="text">${headText}</div>
    <div class="btns">
      <button class="OK">Ok</button>
      ${type === "confirm" ? `<button class="cancel">Cancel</button>` : `</div>`}
      `;
    alert.insertAdjacentHTML("beforeend", html);
    this._showAlert();
  }
  confrimAlert(headText, workout) {
    this._createAlert("confirm", headText);
    const OKbutton = document.querySelector(".alert .OK");
    const cancelButton = document.querySelector(".alert .cancel");
    OKbutton.addEventListener(
      "click",
      (() => {
        this._hideAlert();
        this._addnewWorkout(workout);
      }).bind(this)
    );
    cancelButton.addEventListener(
      "click",
      (() => {
        this._hideAlert();
        this._hideForm();
      }).bind(this)
    );
  }
  errorAlert(headText) {
    this._createAlert("error", headText);
    const OKbutton = document.querySelector(".alert .OK");
    OKbutton.addEventListener(
      "click",
      (() => {
        this._hideAlert();
      }).bind(this)
    );
  }
  _getPostion() {
    navigator.geolocation?.getCurrentPosition(this._loadMap.bind(this), function () {
      alert("can't get ur loaction");
    });
  }

  _loadMap(postion) {
    const { latitude, longitude } = postion.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";
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
      if (!valid(distance, duration, cadence) || !allPos(distance, duration, cadence)) return this.errorAlert("Inputs Take Only Postive Numbers  Please ! Enter Postive Number");
      workout = new Running(distance, duration, coords, cadence);
      this.confrimAlert("Are u sure ?", workout);
    } else {
      //Cycling
      const elevation = +inputElevation.value;
      if (!valid(distance, duration, elevation) || !allPos(distance, duration)) return this.errorAlert("Inputs Take Only Postive Numbers  Please ! Enter Postive Number");
      workout = new Cycling(distance, duration, coords, elevation);
      this.confrimAlert("Are u sure ?", workout);
    }
  }
  _addnewWorkout(workout) {
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
      .setPopupContent(`${workout.type === "running" ? "🏃" : "🚴‍♀️"} ${workout.description}`)
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
        <div class="all__details">
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "🏃" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
     ${
       workout.type === "running"
         ? `
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
        </div>`
         : `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>`
     }
     </div>
      <form class='form none'>
      <div class="form__row">
      <label class="form__label">Type</label>
      <select class="form__input form__input--type"">
        <option value="running" ${workout.type === "running" ? "selected" : ""}>Running</option>
        <option value="cycling" ${workout.type === "cycling" ? "selected" : ""}>Cycling</option>
      </select>
    </div>
      <div class="form__row">
            <label class="form__label" >Distance</label>
            <input class="form__input form__input--distance" placeholder="km" value = "${workout.distance}" />
          </div>
          <div class="form__row">
            <label class="form__label" >Duration</label>
            <input class="form__input form__input--duration" placeholder="min" value =" ${workout.duration}"/>
          </div>
          ${
            workout.type === "running"
              ? `<div class="form__row">
            <label class="form__label" >Cadence</label>
            <input class="form__input form__input--cadence" placeholder="step/min" value = "${workout.cadence}"/>
          </div>`
              : `<div class="form__row form__row">
            <label class="form__label" >Elev Gain</label>
            <input class="form__input form__input--elevation" placeholder="meters" value = "${workout.elevationGain}" />
          </div>`
          }
          <button class="form__btn">OK</button>
          </form>
          </li>
      `;
    form.insertAdjacentHTML("afterend", html);
    sidebarTools.classList.remove("hidden");
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;
    const workoutindex = this.#workouts.findIndex((wo) => wo.id === workoutEl.dataset.id);
    let workout = this.#workouts[workoutindex];
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    if (e.target.dataset.tool === "remove") {
      this.#map.eachLayer((e) => {
        if (e._latlng) {
          let { lat, lng } = e._latlng;
          if (workout.coords[0] == lat && workout.coords[1] == lng) setTimeout(() => e.remove(), 1000);
        }
      });
      this.#workouts.splice(workout, 1);
      if (!this.#workouts.length) sidebarTools.classList.add("hidden");
      workoutEl.remove();
      this._setLocalStorage();
    }

    if (e.target.dataset.tool === "edit") {
      const allDetails = e.target.closest(".workout").querySelector(".all__details");
      allDetails.classList.toggle("none");
      const parent = allDetails.parentElement;
      const editForm = e.target.closest(".workout").querySelector(".form");
      editForm.classList.toggle("none");
      editForm.addEventListener(
        "submit",
        ((e) => {
          let data = [];
          editForm.querySelectorAll("input,select").forEach((el) => {
            data.push(el.value);
          });
          data.forEach((el) => {
            if (!el && el != 0) return this.errorAlert("Undefined Data... !  PLease reenter your fields");
          });
          if (data[0] == "running") this.#workouts[workoutindex] = new Running(+data[1], +data[2], workout.coords, +data[3]);
          else this.#workouts[workoutindex] = new Cycling(+data[1], +data[2], workout.coords, +data[3]);
          this.#workouts[workoutindex].id = workout.id;
          this._setLocalStorage();
        }).bind(this)
      );
    }
  }
  _sideBarEvents(e) {
    if (e.target.dataset.tool === "delete") {
      this._resetLocalStorage();
      this.#workouts = [];
      this.#map.eachLayer((e) => {
        if (e._latlng) {
          e.remove();
        }
      });
      while (containerWorkouts.lastChild != form) {
        containerWorkouts.removeChild(containerWorkouts.lastChild);
      }
      sidebarTools.classList.add("hidden");
    }
    if (e.target.dataset.tool === "sort") {
      if (!containerWorkouts.classList.contains("sorted")) {
        let allworkouts = this.#workouts.slice();
        allworkouts.sort((a, b) => b.distance - a.distance);
        while (containerWorkouts.lastChild != form) {
          containerWorkouts.removeChild(containerWorkouts.lastChild);
        }
        allworkouts.forEach((el) => {
          this._renderWorkout(el);
        });
      } else {
        let allworkouts = this.#workouts.slice();
        while (containerWorkouts.lastChild != form) {
          containerWorkouts.removeChild(containerWorkouts.lastChild);
        }
        allworkouts.forEach((el) => {
          this._renderWorkout(el);
        });
      }
      containerWorkouts.classList.toggle("sorted");
    }
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
      if (work.type === "running") work.__proto__ = Running.prototype;
      else work.__proto__ = Cycling.prototype;
    });
  }
  _resetLocalStorage() {
    localStorage.clear();
  }
}
const app = new App();

"use strict";
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
class WorkOut {
  date = new Date();
  id = (Date().now + "").slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}
class Running extends WorkOut{
  constructor(distance, duration, coords,cadence) {
    super(distance, duration, coords);
    this.cadence=cadence;
    this.calcPace();
  }
  calcPace(){
    this.pace=this.duration/this.distance;
    return this.pace;
  }
}
class Cycling extends WorkOut{
  constructor(distance, duration, coords,elevationGain) {
    super(distance, duration, coords);
    this.elevationGain=elevationGain;
    this.calcSpeed();
  }
  calcSpeed(){
    this.speed=this.distance/this.duration;
    return this.speed;
  }
}
//////////////////////////////
// Main App
class App {
  #map;
  #mapEvent;
  constructor() {
    this.__getPostion();
    form.addEventListener("submit", this.__newWorkout.bind(this));
    inputType.addEventListener("change", this.__toggleElveationField);
  }
  __getPostion() {
    navigator.geolocation?.getCurrentPosition(
      this.__loadMap.bind(this),
      function () {
        alert("can't get ur loaction");
      }
    );
  }
  __loadMap(postion) {
    const { latitude, longitude } = postion.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // Handle Clickting
    this.#map.on("click", this.__showForm.bind(this));
  }
  __showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  __toggleElveationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
  __newWorkout(e) {
    e.preventDefault();
    //Clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";
    //Display Marker
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 350,
          autoClose: false,
          closeOnClick: false,
          className: "running-popup",
        })
      )
      .setPopupContent("Hello World")
      .openPopup();
  }
}
const app = new App();

const fetch = require('node-fetch');

const apiUrl = 'http://swapi.co/api/'
const peopleEndpoint = apiUrl + 'people';
const planetsEndpoint = apiUrl + 'planets';
const filmsEndpoint = apiUrl + 'films';

const fetchSingleResult = endPoint =>
    fetch(endPoint)
    .then(r => r.json());

const fetchAllFrom = endPoint => {
    let all = [];

    return new Promise((resolve, reject) => {
        const fetchPage = url => 
            fetch(url)
            .then(r => r.json())
            .then((r) => {
                if (r.results && r.results.concat)
                    all = all.concat(r.results);
                if (r.next) fetchPage(r.next);
                else resolve(all);
            })
            .catch(err => reject(err))
        fetchPage(endPoint);
    });
}

const fetchPeopleNames = () =>
    fetchAllFrom(peopleEndpoint)
    .then(people => people.map(person => person.name));

const fetchPlanetWithGreatestOrbitalPeriod = () => 
    fetchAllFrom(planetsEndpoint)
    .then(planets =>
        planets.map(planet => ({
            name: planet.name,
            orbitalPeriod: planet.orbital_period
        }))
        .filter(planet => !isNaN(parseInt(planet.orbitalPeriod)))
        .reduce((planetWithGreatestOP, planet) =>
            planet.orbitalPeriod > planetWithGreatestOP.orbitalPeriod ? planet : planetWithGreatestOP)
    );

const fetchDirectorsWithFilms = () => 
    fetchAllFrom(filmsEndpoint)
    .then(films => {
        let directors = new Set(films.map(film => film.director));
        
        return [...directors].map(director => ({
            name: director,
            films: films.filter(film => film.director === director).map(film => film.title)
        }));
    });

const fetchPeopleWithVehicles = () =>
    fetchAllFrom(peopleEndpoint)
    .then(people => {
        let vehicleEndpoints = new Set(people.reduce((allVehicles, person) => 
            allVehicles.concat(person.vehicles), []));

        let vehiclesByUrl = new Map();

        return Promise.all([...vehicleEndpoints].map(fetchSingleResult))
        .then(vehicles => {
            vehicles.forEach(vehicle => vehiclesByUrl.set(vehicle.url, vehicle));
        })
        .then(() =>
            people.map(person => ({
                name: person.name,
                vehicles: person.vehicles.map(vehicleUrl => vehiclesByUrl.get(vehicleUrl)).map(vehicle => ({
                    name: vehicle.name,
                    model: vehicle.model
                }))
            }))
        );
    });

Promise.all([
    fetchPeopleNames(),
    fetchPlanetWithGreatestOrbitalPeriod(),
    fetchDirectorsWithFilms(),
    fetchPeopleWithVehicles()
])
.then(answers => {
    answers.forEach((answer, index) => {
        console.log(`Question ${index + 1}:`, JSON.stringify(answer));
    });
})
'use strict';
import 'whatwg-fetch';

var qs = require('qs');

function authenticate(authInfo) {
	var url = 'https://localhost:/3001/login';
	var options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: qs.stringify({
			username: authInfo.username,
			password: authInfo.password
		})
	};
	return new Promise(function(fulfill, reject) {
		fetch(url, options)
		.then(res => res.json())
		.then(json => {
			if (!json.login) {
				reject('Error: could not authenticate');
			}
			fulfill(json)
		})
		.catch(err => {
			reject('Error: could not authenticate');
		})
	})
}

function register(authInfo) {
	var url = 'https://localhost:/3001/register'
	var options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: qs.stringify({
			username: authInfo.username,
			password: authInfo.password,
			name: authInfo.name,
			email: authInfo.email,
			zip: authInfo.zip,
			company: authInfo.company
		})
	};
	return new Promise(function(fulfill, reject) {
		fetch(url, options)
		.then(res => res.json())
		.then(json => {
			if (!json.login) {
				reject('Error: could not authenticate');
			}
			fulfill(json)
		})
		.catch(err => {
			reject('Error: could not register');
		})
	})
}

function addJob(jobTitle, startTime, endTime, location, rate, notes) {
	var url ='https://workngo-rhayes128.c9users.io/employer/jobs';
	var options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: qs.stringify({
			jobTitle: jobTitle,
			startTime: startTime,
			endTime: endTime,
			rate: rate,
			loc: location,
			notes: notes,
			date: 'July 27, 2017',
		})
	};
	return new Promise(function(fulfill, reject) {
		fetch(url, options)
		.then(res => {
			return res.json()})
		.then(json => {
			fulfill(json)
		})
		.catch(err => {
			reject('Error: could not add job');
		})
	})
}

export function postProject(title, text) {
	var url ='http://localhost:8000/project';
	var options = {
		method: 'POST',
		headers: {
    		'Content-Type': 'application/json' },
		body: JSON.stringify({
			'title': title,
			'text': text,
		})
	};
	return new Promise(function(fulfill, reject) {
		fetch(url, options)
		.then(res => {
			return res})
		.then(json => {
			fulfill(json)
		})
		.catch(err => {
			reject('Error: could not add entity because: ' + err);
		})
	})
}


//Gets all entities related to a project. Server returns an object of objects containing all notes.
export function getProject() {
	var url ='http://localhost:8000/project';
	var options = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	};

	function notesToEntities(notes) {
        //Turns an object of objects into an array of objects instead to iterate over it
        var notes = Object.values(notes);

        /* map over all notes, then map over all entities in each note, and build a new array entities 
           which contains all entities of all notes */
       	var entities = notes.map((note) => {
    		return note.entities.map((entity) => {
        		return {"name": entity.normalized, "type": entity.type, "qid": entity.entityId}
    		})
    	})
    	return [].concat.apply([], entities)
    }

    let newEntities = null;

	return new Promise(function(fulfill, reject) {
		fetch(url, options)
		.then(res => {
			return res.json()})
		.then(json => {
			newEntities = notesToEntities(json);
			fulfill(newEntities)
		})
		.catch(err => {
			reject('Error: could not return entities because ' + err);
		})
	})
}




/*module.exports = {
	authenticate,
	register,
	getProject,
}*/


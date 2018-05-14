import { 
  USER_LOGIN,
	USER_LOGOUT, 
	TOGGLE_SIDEBAR,
	STORE_PROJECT,
  } from './actionTypes';

import { logoutAccount } from "../../server/auth_routes";
import * as server from '../../server';

export function userLogIn() {
  return {
    type: USER_LOGIN,
  };
}

export function userLogOutDispatch() {
	return {
		type: USER_LOGOUT,
	};
}

export function userLogOut() {
	return function (dispatch) {
		return logoutAccount()
			.then(res => {
				dispatch(userLogOutDispatch());
			})
			.catch(err => {
				console.log(err);
			});
	};
}

export function toggleSidebar() {
	return {
		type: TOGGLE_SIDEBAR
	}
}

export function fetchProject(id) {
	return (dispatch) => {
		server.getProject(id)
			.then((data)=>{
				debugger
				dispatch(storeProject(data.message));
			})
			.catch((error) =>  console.log(error));
	}
}

function storeProject(project) {
	return {
		type: STORE_PROJECT,
		payload: project
	};
}

import {LOAD_DATA, REORDER_ENTITY_CACHE, UPDATE_GRAPH_DATA, OFFLINE_ACTIONS, TOGGLE_SIDEBAR, RESET_GRAPH, STORE_CURRENT_NODE, STORE_ENTITY, STORE_SEARCH_RESULTS} from "./actionTypes";
import _ from 'lodash';
import * as server from "../../server/index";

/* =========================================== HELPERS ==========================================  */

// Redux state cannot be mutated. Must create new copies of objects - function here ensures that
function makeDeepCopy(array) {
    let newArray = [];
    array.map((object) => {
        return newArray.push(Object.assign({}, object));
    });
    return newArray;
}

/* =============================================================================================  */

export function storeCurrentNodeDispatch(id) {
    return {
        type: STORE_CURRENT_NODE,
        payload: id
    };
}

export function setCurrentNode(d) {
    return (dispatch) => {
        if (OFFLINE_ACTIONS) return;
        dispatch(storeCurrentNodeDispatch(d.id));
    };
}

/* =============================================================================================  */

function updateGraphDispatch(data) {
    return {
        type: UPDATE_GRAPH_DATA,
        payload: data
    };
}

export function addToGraphFromId(graph, id) {
    return (dispatch, getState) => {
        server.getNode(id, 1)
          .then(data => {
              let state = getState()
              let allNodes = state.graph.data.nodes.concat(data.nodes);
              let allLinks = state.graph.data.links.concat(data.links);
              let dataNodes = _.uniqBy(allNodes, (obj) => {return obj.id});
              let dataLinks = _.uniqBy(allLinks, (obj) => {return obj.id});
              graph.addData(data.centerid, makeDeepCopy(dataNodes), makeDeepCopy(dataLinks));
              graph.update();
              dispatch(updateGraphDispatch({nodes: dataNodes, links: dataLinks}));
          })
          .catch(err => {
              console.log(err);
          });
    };
}

/* =============================================================================================  */

function fetchSearchResultsDispatch(data) {
    return {
        type: STORE_SEARCH_RESULTS,
        payload: data
    };
}

export function fetchSearchResults(query) {
    return (dispatch) => {
        if (OFFLINE_ACTIONS) return;
        server.searchBackendText(query)
        .then((data) => {
            dispatch(fetchSearchResultsDispatch(data));
        })
        .catch((error) => console.log(error));
    }
}

/* =============================================================================================  */

function fetchEntityDispatch(entity) {
    return {
        type: STORE_ENTITY,
        payload: entity
    };
}

function fetchEntityDataFormatter(data) {
    console.log("fetchEntityDataFormat", data);
    // let nodes = data.nodes;
    // let linksLength = data.links.length;
    // for (let i=0; i < linksLength; i++) {
    //     // nodes[i]
    // }
    // we just need data to be node.id and then each possible link type or attr that matters "sanctioned on", etc here.
    //
    return [data]
}

export function fetchEntity(id) {
    return (dispatch) => {
        if (OFFLINE_ACTIONS) return;
        server.getNode(id, 1)
            .then(data => {
                let formattedResponse = fetchEntityDataFormatter(data);
                dispatch(fetchEntityDispatch(formattedResponse));
            })
            .catch(err => console.log(err));
    };
}

/* =============================================================================================  */

function reorderEntityCacheDispatch(newEntityCache) {
    return {
        type: REORDER_ENTITY_CACHE,
        payload: newEntityCache
    }
}

function move(arr, from, to) {
    let newArr = makeDeepCopy(arr);
    newArr.splice(to, 0, this.splice(from, 1)[0]);
    return newArr
}

export function reorderEntityCache(id, index=null) {
    return (dispatch, getState) => {
        let state = getState();
        let entityCache = state.graph.entityCache;
        let newEntityCache = [];
        if (index) {
            newEntityCache = move(entityCache, index, 0);
            dispatch(reorderEntityCacheDispatch(newEntityCache))
        } else {
            for (let i=0; i<entityCache.length; i++) {
                if (entityCache[i].id === id) {
                    newEntityCache = move(entityCache, i, 0);
                    break;
                }
            }
            if (newEntityCache.length !== 0) {
                dispatch(reorderEntityCacheDispatch(newEntityCache))
            }
        }
    }
}

/* =============================================================================================  */



export function resetGraphDispatch() {
    return {
        type: RESET_GRAPH,
    };
}

/* =============================================================================================  */

export function toggleSidebar() {
    return {
        type: TOGGLE_SIDEBAR
    }
}

/* =============================================================================================  */

export function saveLink(name, author, description, graph) {
    let data = graph.fetchData();
    server.createLink(name, author, description, data)
        .then((res) => {
            console.log("Res", res)
            return res.success
        })
        .catch((err) => {
            console.log(err);
        });
}

/* =============================================================================================  */

function loadGraphDataDispatch(data) {
    return {
        type: LOAD_DATA,
        payload: data
    }
}

export function loadLink(projId) {
    return (dispatch) => {
        server.getLink(projId)
            .then((res) => {
                let graphData;
                try {
                    graphData = JSON.parse(res.message.data);
                } catch (err) {
                    graphData = null;
                }
                console.log("loading graph data", graphData)
                dispatch(loadGraphDataDispatch(graphData));
                console.log("sending things back", {name: res.message.name, author: res.message.author, description: res.message.description})
                return {name: res.message.name, author: res.message.author, description: res.message.description}
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

export function loadData(data) {
    return (dispatch) => {
        dispatch(loadGraphDataDispatch(data));
    }
}
import { combineReducers } from 'redux'
import {
  REQUEST_PLACES_RESULTS,
  RECEIVE_PLACES_RESULTS,
  CLEAR,
  UPDATE_BBOX,
  RESULT_HANDLER,
  ADD_AUDIO,
  RECEIVE_INFO,
  WIKI_CLEAR,
} from '../componenti/azioni'


import {
  UPDATE_TEXTINPUT,
  REQUEST_GEOCODE_RESULTS,
  RECEIVE_GEOCODE_RESULTS,
  UPDATE_CENTER
} from '../componenti/azioni'



const initialIsochronesControlsState = {
  userInput: "",
  geocodeResults: [],
  isochrones: {
    results: []
  },
  isFetching: false,
  isFetchingIsochrones: false,
  settings: {
    isochronesCenter: {},
    range: {
      max: 500,
      value: 60
    },
    interval: {
      max: 60,
      value: 10
    },
    mode: "car",
    rangetype: "distance",
    traffic: "disabled"
  }
}

// our reducer constant returning an unchanged or updated state object depending on the users action, many cases will follow
const isochronesControls = (state = initialIsochronesControlsState, action) => {
  switch (action.type) {
    default:
      return state
      case UPDATE_TEXTINPUT:
        return {
          ...state,
          userInput: action.payload.inputValue
        }
      // let the app know the request is being made (for our spinner)
      case REQUEST_GEOCODE_RESULTS:
        return {
          ...state,
          isFetching: true
        }
      // when results are returned by the API update the state with addresses and let the app know it is no longer fetching
      case RECEIVE_GEOCODE_RESULTS:
        return {
          ...state,
          geocodeResults: action.results,
          isFetching: false
        }
      // update the isochronesCenter we will use later from the coordinates of the selected address
      case UPDATE_CENTER:
        return {
          ...state,
          settings: {
            ...state.settings,
            isochronesCenter: action.isochronesCenter
          }
        }
  }
}

// our initial state object with an empty boundingbox string, a lastCall Date field and an empty places object
const initialPlacesState = {
  boundingbox: { lonMin: '', latMin: '', lonMax:'', latMax:''},
  message: { receivedAt: 0 },
  lastCall: Date.now(),
  places: {}
}

// this is our switch clause which will reduce the actions depending on what is being called
const placesControls = (state = initialPlacesState, action) => {
  
  switch (action.type) {
    default:
      return state

    // as mentioned above we want to let our button know that it is doing something
    case REQUEST_PLACES_RESULTS:
      return {
        ...state,
        places: {
          ...state.places,
          [action.payload.category]: {
            ...state.places,
            isFetching: true
          }
        }
      }

    // if results are received we will start reducing our state
    case RECEIVE_PLACES_RESULTS:
      return {
        ...state,
        // when was this data received
        lastCall: Date.now(),
        // updating our places object
        places: {
          ...state.places,
          // for the requested category
          [action.payload.category]: {
            ...state.places[action.payload.category],
            // this ternary operator decides if we will merge previous calls or not
            data: state.places[action.payload.category].hasOwnProperty('data')
              ? [
                  ...state.places[action.payload.category].data,
                  ...action.payload.data
                ]
              : action.payload.data,
            // of course we will want to save the boundingbox of this API request
            boundingbox: action.payload.boundingbox,
            // and the color (used for the map later!)
            color: action.payload.color,
            // and make sure our spinner is disabled again
            isFetching: false,
          }
        }
      }

    // self explanatory - I hope!
    case CLEAR:
      return {
        ...state,
        places: {},
        lastCall: Date.now(),
        lastCompute: Date.now()
      }

      case UPDATE_BBOX:
        return {
          ...state,
          boundingbox: { lonMin: action.payload._southWest.lng, latMin: action.payload._southWest.lat, lonMax: action.payload._northEast.lng, latMax: action.payload._northEast.lat}
        }

        case RESULT_HANDLER: {
          return {
            ...state,
            message: {
              ...state.message,
              ...action.payload,
              receivedAt: Date.now()
            }
          }
        }
    }
}


const audio = (state = {id: 0, blob64: []}, action)  => {
  switch(action.type) {
    default:
      return state
    case ADD_AUDIO: {
      state.id = action.id
      state.blob64.push(action.blobAudio)
      return state
    }
  }
}


const infoWiki = (state = {urlFoto: '', urlDescrzione: ''}, action) => {
  switch(action.type){
    default:
      return state
    case RECEIVE_INFO:
      return {
        urlFoto: action.urlfoto,
        urlDescrzione: action.urldescrzione
      }
    case WIKI_CLEAR:
      return {
        urlFoto:'',
        urlDescrzione: ''
      }
  }
}


// we combine reducers here, in our case it is only one
const rootReducer = combineReducers({
  placesControls,
  isochronesControls,
  audio,
  infoWiki
})

export default rootReducer
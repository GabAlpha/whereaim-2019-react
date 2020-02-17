// use these or add your own credentials, sign up at here maps for a developer account at https://account.here.com/sign-in
const apikey = '5ae2e3f221c38a28845f05b637122877ed798c08259996c2c5be7388'

// 3 new action types
export const RECEIVE_PLACES_RESULTS = 'RECEIVE_PLACES_RESULTS'
export const REQUEST_PLACES_RESULTS = 'REQUEST_PLACES_RESULTS'
export const CLEAR = 'CLEAR'
export const UPDATE_BBOX = 'UPDATE_BBOX'
export const RESULT_HANDLER = 'RESULT_HANDLER'
export const UPDATE_TEXTINPUT = 'UPDATE_TEXTINPUT'
export const RECEIVE_GEOCODE_RESULTS = 'RECEIVE_GEOCODE_RESULTS'
export const REQUEST_GEOCODE_RESULTS = 'REQUEST_GEOCODE_RESULTS'
export const UPDATE_CENTER = 'UPDATE_CENTER'
export const ADD_AUDIO = 'ADD_AUDIO'
export const RECEIVE_INFO = 'RECEIVE_INFO'
export const WIKI_CLEAR = 'WIKI_CLEAR'

export var posti = 0

export const fetchHereGeocode = payload => dispatch => {

  // It dispatches a further action to let our state know that requests are about to be made (loading spinner listens to this!)
  dispatch(requestGeocodeResults())

  // we define our url and parameters to be sent along
  let url = new URL('https://nominatim.openstreetmap.org/search'),
    params = {
      q: payload.inputValue,
      format: "json",
      limit: '4'
    }

  url.search = new URLSearchParams(params)

  // we use the fetch API to call HERE Maps with our parameters
  return fetch(url)
    // when a response is returned we extract the json data
    .then(response => response.json())
    // and this data we dispatch for processing in processGeocodeResponse
    .then(data => dispatch(processGeocodeResponse(data)))
    .catch(error => console.error(error))
}

const parseGeocodeResponse = (json, latLng) => {
    let processedResults = []
    for(var address of json){
        processedResults.push({
          title: address.display_name,
          description: address.place_id,
          displayposition: {
            lat: address.lat,
            lng: address.lon
          }
        })
  }
  return processedResults
}

const processGeocodeResponse = (
  json
) => dispatch => {
  // parse the json file and dispatch the results to receiveGeocodeResults which will be reduced
  const results = parseGeocodeResponse(json)
  // let's let the loading spinner now that it doesn't have to spin anymore
  dispatch(receiveGeocodeResults(results))
}

export const receiveGeocodeResults = payload => ({
  type: RECEIVE_GEOCODE_RESULTS,
  results: payload
})

export const requestGeocodeResults = payload => ({
  type: REQUEST_GEOCODE_RESULTS,
  ...payload
})

export const updateTextInput = payload => ({
  type: UPDATE_TEXTINPUT,
  payload
})

export const updateCenter = payload => ({
   type: UPDATE_CENTER,
   ...payload
})


// this function takes care of the call to the HERE Maps API
export const fetchHerePlaces = payload => (dispatch, getState) => {
  // this simple dispatcher will make sure our loading icon spins ;-)
  dispatch(requestPlacesResults({ category: payload.category }))

  // here we have to access our state in the action to retrieve the boundingbox
  // of the map which will be reduced in the subsequent step
  const { boundingbox } = getState().placesControls

  // to learn more about the parameters use this link https://developer.here.com/documentation/places/topics/search-results-ranking.html
  const url = new URL(
    'http://api.opentripmap.com/0.1/en/places/bbox'
  )
  const params = {
    lon_min: boundingbox.lonMin,
    lat_min: boundingbox.latMin,
    lon_max: boundingbox.lonMax,
    lat_max: boundingbox.latMax,
    format: 'geojson',
    apikey: apikey
  }

  url.search = new URLSearchParams(params)

  return fetch(url)
    .then(response => response.json())
    .then(data =>
      // once the data as json is returned we will dispatch the parsing of the data which will include the category and color passed through from the button properties
      dispatch(
        processPlacesResponse(
          data,
          payload.category,
          boundingbox,
          payload.color
        )
      )
    )
    .catch(error => console.error(error))
}

export const sendMessage = message => ({
  type: RESULT_HANDLER,
  payload: message
})


// to clear the places!
export const clear = () => ({
  type: CLEAR
})

const parsePlacesResponse = json => {
  if (json.features.length > 0) {
    return json.features
  }
  return []
}

const processPlacesResponse = (json, category, bbox, color) => dispatch => {
  const results = parsePlacesResponse(json)
  // the response is parsed and ready to be dispatched to our reducer
  dispatch(
    receivePlacesResults({
      data: results,
      category: category,
      boundingbox: bbox,
      color: color
    })
  )
  posti = results
}

export const receivePlacesResults = places => ({
  type: RECEIVE_PLACES_RESULTS,
  payload: places,

})

export const requestPlacesResults = category => ({
  type: REQUEST_PLACES_RESULTS,
  payload: category
})

export const doUpdateBoundingBox = boundingbox => dispatch => {
    const bbox = boundingbox
    dispatch(updateBoundingBox(bbox))
  }
  
const updateBoundingBox = bbox => ({
    type: UPDATE_BBOX,
    payload: bbox
})

export const checkLimit = () => dispatch => {
  if (posti.length > 1000) {
    dispatch(clear())
    posti = {}
    dispatch(
      sendMessage({
        type: 'warning',
        icon: 'warning',
        description:
          'Hai raggiunto il limite di 1000 elementi su schermo'
      }) 
    )
  }
}

let conteggio = 1
export const addAudio = blobAudio => {
  return {
    type: ADD_AUDIO,
    id: conteggio++,
    blobAudio
  }
} 

export const reqWD = Qwiki => dispatch => {
  dispatch(pulisciWiki())
  const urlInv = new URL('https://inventaire.io/api/entities')
  const uripar = "wd:" + Qwiki
  const paramsInv = {
    action: "by-uris",
    uris: uripar
  }

  urlInv.search = new URLSearchParams(paramsInv)

  //console.log(urlInv)

  fetch(urlInv)
  .then(response => response.json())
  .then(data => dispatch(reqWiki(data.entities[uripar].image.url, data.entities[uripar].sitelinks.itwiki)))
  .catch(error => console.error(error))
}


const reqWiki = (urlf, descrizione) => dispatch => {
  const urldes = new URL('https://it.wikipedia.org/w/api.php')
  const proxyurl = "https://cors-anywhere.herokuapp.com/";
  const params = {
    action:"query",
    titles: descrizione,
    prop: "extracts",
    format: "json",
    exchars: 150
  }

  urldes.search = new URLSearchParams(params)

  fetch(proxyurl + urldes)
  .then(response => response.json())
  .then(data => dispatch(riceviWiki(urlf, data.query.pages[Object.keys(data.query.pages)[0]].extract)))
  .catch(error => console.error(error))
}


export const riceviWiki = (fotoUrl, textDescrzione) => ({
    type: RECEIVE_INFO,
    urlfoto: fotoUrl,
    urldescrzione: textDescrzione
})

export const pulisciWiki = () => ({
  type:WIKI_CLEAR
})

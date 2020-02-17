import React from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import "leaflet.locatecontrol";
import { doUpdateBoundingBox, checkLimit} from './azioni'
import { connect } from 'react-redux'
import { cooClips, cercaYoutube } from './youtube'

export var punti = []

// defining the container styles the map sits in
const style = {
  width: '100%',
  height: '100vh'
}


// a leaflet map consumes parameters, I'd say they are quite self-explanatory
const mapParams = {
  center: [0, 0],
  zoomControl: false,
  maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
  zoom: 3
}

export var mappaEsterna = {}

const placesLayer = L.featureGroup()
const markersLayer = L.featureGroup()

// this you have seen before, we define a react class component
class Mappa extends React.Component {
  // and once the component has mounted we add everything to it
  componentDidMount() {
    this.map = L.map('map', mapParams)
    const { dispatch } = this.props
    mappaEsterna = this.map

    L.tileLayer ('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.addLayer(placesLayer)
    this.map.addLayer(markersLayer)


    // we create a leaflet pane which will hold all cluster polygons with a given opacity
    const clusterPane = this.map.createPane('clusterPane')
    clusterPane.style.opacity = 0.9

    // we do want a zoom control
    L.control
      .zoom({
        position: 'topright'
      })
      .addTo(this.map)
    
    // locate button
    L.control.locate({ position: 'bottomleft' }).addTo(this.map)
    
    // when the map is paned, update the bounding box in the redux store
    this.map.on('moveend', () => {
      dispatch(doUpdateBoundingBox(this.map.getBounds()))
      dispatch(checkLimit())
    })

    // and also on load
    dispatch(doUpdateBoundingBox(this.map.getBounds()))
  }

  componentDidUpdate(prevProps) {
    const { lastCall } = this.props
    const { isochronesControls } = this.props
    // is the epoche timestamp later?
    if (lastCall > prevProps.lastCall) {
      // if so, then start adding places to the map
      this.addPlaces()
      //cercaYoutube(() => {this.addPlaces()})
    }
    if (isochronesControls.userInput !== prevProps.isochronesControls.userInput || isochronesControls.userInput === "") {
      this.addIsochronesCenter();
    }
    
  }

  addIsochronesCenter() {

    // clear the markers layer beforehand
    markersLayer.clearLayers();

    const isochronesCenter = this.props.isochronesControls.settings.isochronesCenter;
    // does this object contain a latitude and longitude?
    if (isochronesCenter.lat && isochronesCenter.lng) {
      // we are creating a leaflet circle marker with a minimal tooltip
      L.circleMarker(isochronesCenter)
        .addTo(markersLayer)
        .bindTooltip(
          "latitude: " +
            isochronesCenter.lat +
            ", " +
            "longitude: " +
            isochronesCenter.lng,
          {
            permanent: false
          }
        )

      // set the map view
      this.map.setView(isochronesCenter, 14);
    }
  }
  
  addPlaces() {
    // let's clear the layers with the help of Leaflets mighty API
    placesLayer.clearLayers()
    // places will become part of our props but for this we have to connect this component to our state in the next step
    const { places } = this.props
    let cnt = 0
    // loop through our places
    for (const place in places) {
      // make sure data is there ;-)
      if (
        places[place].hasOwnProperty('data') &&
        places[place].data.length > 0 
      ) {
        // for every place in data we will add a beautiful Leaflet circlemarker with a tooltip!
        for (const placeObj of places[place].data) {
          const link = '<a href="https://www.wikidata.org/wiki/' + placeObj.properties.wikidata + '" target="_blank">'+ placeObj.properties.name + '</a>'
          if (placeObj.properties.rate !== 0){
            punti.push(L.circleMarker([placeObj.geometry.coordinates[1], placeObj.geometry.coordinates[0]], {
            radius: 10,
            id: cnt,
            weight: 1,
            opacity: 0.5
          })
            .addTo(placesLayer)
            .bindPopup(placeObj.properties.wikidata!==undefined ? link : placeObj.properties.name)
            )}
          cnt += 1
        }
      }
    }
    cercaYoutube(() => {
      cooClips.map(item => {
        L.circleMarker([item.geometry.coordinates[1], item.geometry.coordinates[0]], {
          radius: 10,
          opacity: 0.5,
          weight: 1,
          color: '#f5426c'
        }).addTo(placesLayer)
        .bindPopup('Youtube')
      })
    })
  }
  

  render() {
    return (
        <div>
            <div id="map" style={style}></div>
        </div>
    );
  }
}

const mapStateToProps = state => {
  const { places, lastCall } = state.placesControls
  const isochronesControls = state.isochronesControls
  return {
    places,
    lastCall,
    isochronesControls,
  }
}

export default connect(mapStateToProps)(Mappa)
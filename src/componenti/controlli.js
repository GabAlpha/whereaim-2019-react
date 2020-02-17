import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Segment, Button, Search, Divider, Label } from 'semantic-ui-react'
import { mappaEsterna } from './mappa2'
import L from 'leaflet'
import { SemanticToastContainer, toast } from 'react-semantic-toasts'
import { posti, reqWD, pulisciWiki, initWiki } from './azioni'
import { punti } from './mappa2'
// our actions which yet have to be scripted!
import { fetchHerePlaces, clear } from './azioni'
import { updateTextInput, fetchHereGeocode, updateCenter } from "./azioni"

// to wait for the users input we will add debounce, this is especially useful for "postponing" the geocode requests
import { debounce } from "throttle-debounce"
import Editor from './microfono2'

// some HERE Maps places categories we want to be able to fetch with some cute colors
const herePlaces = {
  0: { name: 'POI', color: 'red' },
}

var nomePosto = ' '
var counter = -1

const segmentStyle = {
  zIndex: 999,
  position: "absolute",
  width: "400px",
  top: "10px",
  left: "10px",
  maxHeight: "calc(100vh - 5vw)",
  padding: "20px",
  overflow: "auto"
};

const segmentStyle2 = {
  zIndex: 999,
  position: "absolute",
  width: "200px",
  top: "86vh",
  left: "50%",
  marginLeft: "-100px",
  overflow: "auto",
  padding: "10px",
};


class Control extends React.Component {
  static propTypes = {
    places: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    message: PropTypes.object
  }

  constructor(props) {
    super(props)
    this.handleSearchChange = this.handleSearchChange.bind(this)
    this.fetchGeocodeResults = debounce(1000, this.fetchGeocodeResults)
    this.state = {editorMode: false};
  }

  // if the input has changed... fetch some results!
  handleSearchChange = event => {
    const { dispatch, userTextInput } = this.props;
    if (userTextInput.length === 0) {
      dispatch(
        fetchHereGeocode({
          inputValue: ''
        })
      )
    }
    dispatch(
      updateTextInput({
        inputValue: event.target.value
      })
    )
    this.fetchGeocodeResults()
  }

  // if a user selects one of the geocode results update the input text field and set our center coordinates
  handleResultSelect = (e, { result }) => {
    const { dispatch } = this.props;
    dispatch(
      updateTextInput({
        inputValue: result.title
      })
    );

    dispatch(
      updateCenter({
        isochronesCenter: result.displayposition
      })
    );

  };

  // our method to fire a geocode request
  fetchGeocodeResults() {
    const { dispatch, userTextInput } = this.props
    // If the text input has more then 0 characters..
    if (userTextInput.length > 0) {
      dispatch(
        fetchHereGeocode({
          inputValue: userTextInput
        })
      )
    }
  }

  // what happens if we click a places button
  handleClick = (event, data) => {
    counter = -1
    punti.length = 0
    const { dispatch } = this.props
    dispatch(fetchHerePlaces({ category: data.value, color: data.color }))
  }

  nextButton = () => {
    const { dispatch } = this.props
    counter ++
    if (posti[counter].id === "youtube" ) {
      mappaEsterna.setView(new L.LatLng(posti[counter].geometry.coordinates[1], posti[counter].geometry.coordinates[0]), 19)
      punti[counter].openPopup()
    } else {
      dispatch(reqWD(posti[counter].properties.wikidata))
      mappaEsterna.setView(new L.LatLng(posti[counter].geometry.coordinates[1], posti[counter].geometry.coordinates[0]), 19) 
      nomePosto = posti[counter].properties.name
      punti[counter].openPopup()
    }
    console.log(posti[counter])
  }
  
  prevButton = () => {
    counter --
    mappaEsterna.setView(new L.LatLng(posti[counter].geometry.coordinates[1], posti[counter].geometry.coordinates[0]), 19) 
    punti[counter].openPopup()
  }

  // and also what happens if we click the remove icon
  handleClickClear = () => {
    const { dispatch } = this.props
    dispatch(clear())
  }

  setEditormode = () => {
    this.setState({editorMode: true});
  }

  setBrowsermode = () => {
    this.setState({editorMode: false});
  }

  componentDidMount() {
    const {dispatch} = this.props
    dispatch(pulisciWiki())
  }

  componentDidUpdate = prevProps => {
    const { message } = this.props
    if (message.receivedAt > prevProps.message.receivedAt) {
      toast({
        type: message.type,
        icon: message.icon,
        title: message.topic,
        description: message.description,
        time: 5000
      })
    }
  }

  // some buttons can be disabled if no places exist..
  areButtonsDisabled = places => {
    let buttonsDisabled = true
    for (const key in places) {
      if (places.hasOwnProperty(key)) {
        if (places[key].hasOwnProperty('data') && places[key].data.length > 0) {
          buttonsDisabled = false
        }
      }
    }
    return buttonsDisabled
  }

  render() {
    const { places } = this.props
    const editorMode = this.state.editorMode;
    let editorRender
    const CustomButton = ({
      content,
      circular,
      handler,
      icon,
      disabled,
      basic,
      size,
      loading,
      color,
      value,
      fluid
    }) => (
          <Button
            color={color}
            circular={circular}
            content={content}
            loading={loading}
            size={size}
            onClick={handler}
            basic={basic}
            disabled={disabled}
            icon={icon}
            value={value}
            fluid={fluid}
          />
    )

    const {
      isFetching,
      userTextInput,
      results,
      urlDescrzione,
      urlFoto,
    } = this.props;

    if (editorMode) {
      editorRender = (
        <div>
          <Button onClick={this.setBrowsermode} color="purple" icon="plus"></Button>
          <Editor />
        </div>
      );
    } else {
      editorRender = (
        <div>
            <div className="flex justify-between items-center mt3">
                <Search
                  onSearchChange={this.handleSearchChange}
                  onResultSelect={this.handleResultSelect}
                  type="text"
                  input={{ fluid: true }}
                  fluid
                  loading={isFetching}
                  className="flex-grow-1 mr2"
                  results={results}
                  value={userTextInput}
                  placeholder="Find Address ..."
                />
                <Button
                  circular
                  color="purple"
                  icon="plus"
                  onClick={this.setEditormode}
                />
                <Button
                  circular
                  color="purple"
                  icon="delete"
                  onClick={this.handleClickClear}
                />
            </div>
            {urlDescrzione !== "" ?
            <div>
              <Divider />
              <h2>{nomePosto}</h2>
              <Divider />
              <img src={urlFoto !== "" ? urlFoto : ""} width="300"></img>
              <Divider />
              <p dangerouslySetInnerHTML={{__html: urlDescrzione}}></p>
            </div>
            : ""}
          </div>
      );
    }
    
    return (
      <div>
        <Segment style={segmentStyle}>
          <div>
              <span>
                Benvenuto su <strong>Where I AM</strong> by <strong>Gabriele Alfarano</strong>
              </span>
            </div>
            <Divider />
            {editorRender}
          </Segment>
          <Segment style={segmentStyle2} textAlign='center'>
          <div>
            {Object.keys(herePlaces).map((key, index) => {
              return (
                <div>
                  <CustomButton
                  icon="angle left icon"
                  disabled={false}
                  handler={this.prevButton}
                  color="basic blue"
                  loading={null}
                  size="tiny"
                  circular
                />
                   <CustomButton
                    icon="search icon"
                    value={herePlaces[key].name}
                    disabled={false}
                    handler={this.handleClick}
                    color="blue"
                    loading={
                      places[herePlaces[key].name]
                        ? places[herePlaces[key].name].isFetching
                        : false
                    }
                    size="large"
                    circular
                  />
                  <CustomButton
                    icon="angle right icon"
                    disabled={false}
                    handler={this.nextButton}
                    color="basic blue"
                    loading={null}
                    size="tiny"
                    circular
                  />
                </div>
              )
            })} 
          </div>
        </Segment>
        <SemanticToastContainer position="bottom-center" />
      </div>
    )
  }
}

// connecting this class component to our react store!
const mapStateToProps = state => {
  const { places, message } = state.placesControls
  const userTextInput = state.isochronesControls.userInput
  const results = state.isochronesControls.geocodeResults
  const isFetching = state.isochronesControls.isFetching
  const {urlFoto, urlDescrzione} = state.infoWiki

  return {
    places,
    message,
    userTextInput,
    results,
    isFetching,
    urlFoto,
    urlDescrzione
  }
}

export default connect(mapStateToProps)(Control)
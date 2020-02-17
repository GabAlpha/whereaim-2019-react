import React from 'react'
import MicRecorder from 'mic-recorder-to-mp3'
import { Button } from 'semantic-ui-react'
import { connect } from 'react-redux';
import { addAudio } from './azioni';

const Mp3Recorder = new MicRecorder({bitrate: 128})
var audioState = ''
var base64data = ''

class Mic extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            staRegistrando: false,
            blobURL: '',
            bloccato: false,
        }
      }

    start = () => {
        if(this.state.bloccato) {
            alert("no deh non va")
        } else {
            Mp3Recorder
                .start()
                .then(()=> {
                    this.setState({staRegistrando: true})
                }).catch((e) => console.log("ERRORE"))
        }
    }  

    stop = () => {
        Mp3Recorder
            .stop()
            .getMp3()
            .then(([buffer, blob]) => {
                const blobURL = URL.createObjectURL(blob)
                this.setState({blobURL, staRegistrando: false})
                var reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = function(){
                    base64data = reader.result
                }
            }).catch((e) => console.log(e))

    }

    clear = () =>{
        localStorage.clear()
        window.location.reload(false);
    }

    saveAudio = () => {
        const { dispatch } = this.props
        dispatch(addAudio(base64data))
        console.log("File salvato")
        window.location.reload(false);
    }

    componentDidMount() {
        navigator.mediaDevices.getUserMedia({audio: true}, 
        () => {
            console.log('Daje de Permesso');
            this.setState({bloccato: false})
        },
        () => {
            console.log("noo deee");
            this.setState({bloccato: true})
        }
        )
    }

    render() {
        return (
            <div>
            {this.state.blobURL === '' ? [] : <audio src={this.state.blobURL} controls="controlli" />}
            <div>
                <Button circular color="purple" onClick={this.start} disabled={this.state.staRegistrando}>Registra</Button>
                <Button circular color="purple" onClick={this.stop} disabled={!this.state.staRegistrando}>Stop</Button>
                <Button circular color="purple" onClick={this.clear}>Cancella Tutto</Button>
                <Button circular color="purple" onClick={this.saveAudio}>Salva Internamente</Button>
            </div>
            {audioState.blob64.map(elemento => (<div><audio src={elemento} controls="controlli"/></div>))}
            </div>
        )
    }
}

const mapStateToProps = state => {
    audioState = state.audio
    return {
        audioState
    }
}

export default connect(mapStateToProps)(Mic)
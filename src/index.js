import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

//API di Redux
import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { loadState, saveState } from './componenti/localStore'

import reducer from './reducers'

const middleware = [thunk]
const persistedState = loadState()

const store = createStore(
    reducer,
    persistedState,
    composeWithDevTools(applyMiddleware(...middleware))
  )

store.subscribe(() => {
    saveState(store.getState()) 
});

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

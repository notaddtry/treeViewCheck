import * as React from 'react'
import ReactDOM from 'react-dom'
import Demo from './Demo.tsx'

const rootElement = document.getElementById('root')
ReactDOM.render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
  rootElement
)

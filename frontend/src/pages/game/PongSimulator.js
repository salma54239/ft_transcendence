import React from 'react'
import "./PongSimulator.css"

const PongSimulator = () => {
  return (
    <div className="container">
        <div className="net"></div>
        <div className="paddle4bot"></div>
        <div className="paddle4player"></div>
        <div className="ball"></div>
    </div>
  )
}

export default PongSimulator
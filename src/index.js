import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import Button from './js/button';

import FractalModule from './js/wasm-binding/fractal.js'
import { drawFractalActionFactory, downloadImageActionFactory, drawSimpleFractalActionFactory, drawSimpleFractalActionFactory2 } from './js/action/fractal.js'
import wasmImportObject from './js/wasm/wasm-import-object.js'

import wasmLoader from './lib.rs';

const maxStep = 18;
const title = 'LvivCSS: WebAssembly in CSS  Demo!';
const subtitle = "Apply CSS Paint API on DIV"; 

const getDiv = () => document.querySelector('#fractal-wasm');
const getImage = () => document.querySelector('#wasm-id');

const cb = function (wasm) {
  const wasmInstance = wasm.instance;

  const fractalModule = new FractalModule(wasmInstance.exports);

  const getImageParams = () => {
    const img = getImage();
    const { width, height } = img;
  
    return { img, width, height};
  };

  const doGenerateSimpleFractal = startStep => {
    const imgParams = getImageParams();
    const ctx = imgParams.img.getContext("2d");

    wasmImportObject.helper.setCanvas(ctx);
    
    const action = drawSimpleFractalActionFactory2(fractalModule, ctx, imgParams.width, imgParams.height);
    console.time('drawFractal #wasm');
    action(startStep, maxStep);
    console.timeEnd('drawFractal #wasm');
    return "Generated"
  };

  const doApplyStyleWithPaintAPIWASMINternal = () => {
    const div = getDiv();
    div.className = "fractal-content-wasm-internal";
    return "Generated";
  };
  
  const doApplyStyleWithPaintAPIWASMINExternal = () => {
    const div = getDiv();
    div.className = "fractal-content-wasm-external";
    return "Generated";
  };

  const doApplyStyleWithPaintAPIJS = () => {
    const div = getDiv();
    div.className = "fractal-content-js";
    return "Generated";
  };

  const doApplyStyleWithPaintAPIConicGradient = () => {
    const div = getDiv();
    div.className = "conic-gradient";
    return "Generated";
  };

  const doApplyStyleNoPaintApi = () => {
    const div = getDiv();
    div.className = "no-paint-api";
    return "Generated";
  };

  ReactDOM.render(
    <div className="App">
      <h1 className="App-Title">{title}</h1>
      <h2 className="App-Title">{subtitle}</h2>
      <ul>
        <li>
          <Button title="Conic Gradient" action ={ doApplyStyleWithPaintAPIConicGradient } value= { 1 }/>
        </li>
        <li>
          <Button title="WASM with Draw" action ={ doApplyStyleWithPaintAPIWASMINternal } value= { 1 }/>
        </li>
        <li>
          <Button title="WASM without Draw" action ={ doApplyStyleWithPaintAPIWASMINExternal } value= { 1 }/>
        </li>
        <li>
          <Button title="pure JS" action ={ doApplyStyleWithPaintAPIJS } value= { 1 }/>
        </li>
        <li>
          <Button title="Native WASM" action ={ doGenerateSimpleFractal } value= { 1 }/>
          <canvas id="wasm-id" width="200" height="200"></canvas>
        </li>
        <li>
          <Button title="Clear" action ={ doApplyStyleNoPaintApi } value= { 1 }/>
        </li>
      </ul>
    </div>,
    document.getElementById('app')
  );
}

wasmLoader(wasmImportObject).then(cb);

module.hot.accept();
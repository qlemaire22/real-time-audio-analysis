# Real-time Audio Analysis

## Description

This project is made to analyze in real time the audio recorded from the microphone with a neural network for the speech and music detection task. It can be used for many other tasks by changing the network and the post-processing.

The network is built with [this project](https://github.com/qlemaire22/speech-music-detection) and the project is used as a sub-module for the pre-processing of the audio.

The application is built with `Angular`, `Electron` and `Bootstrap`. The backend is coded in Python with `Flask`.

The audio is recorded with `MediaRecorder` and then sent as a `base64` data to the Python backend that build the `.webm` and then process the audio.

The data is transferred to the backend with a POST request.

## Requirements

- `SoX` (http://sox.sourceforge.net) is used for the resampling of the audio.

- `avconv` (https://libav.org/avconv.html) is used for the conversion from `.webm` to `.wav`.

- All the requirements of the submodule  https://github.com/qlemaire22/speech-music-detection

## Installation

- Make sure that `npm` and `Node.js` are installed.

- Install the dependencies with `npm install`.

- Put the trained network `model.hdf5` in `/model`.

## Usage

- To run the electron app: `npm run electron-build`

- To run only the web app: `ng serve`

- To run only the backend: `python backend.py`

## Possible improvements

The audio is recorded as a `.webm` then converted as a `.wav` and then resampled. This pipeline is quite complicated and it could be interesting to record a `.wav` with the good sampling rate directly.

The data is transferred to the backend with a simple POST request executed at a fixed interval. It might not be the most optimized way to do so.

import sys

sys.path.append('./speech-music-detection')

from flask import Flask
from flask_restful import Resource, Api, reqparse
from flask_cors import CORS
import base64
import numpy as np
import os


app = Flask(__name__)
api = Api(app)
CORS(app)

# save_stdout = sys.stdout
# fh = open("output-backend.txt", "w")
# sys.stdout = fh

predict_request = reqparse.RequestParser()
predict_request.add_argument('audio')

model = None

mean = np.load("model/mean.npy")
std = np.load("model/std.npy")

x_tot = None
memory = ""


def test_data_processing(spec):
    from smd.data import preprocessing

    mels = preprocessing.get_scaled_mel_bands(spec)
    mels = preprocessing.normalize(mels, mean, std)
    return mels.T


@app.route("/")
def display():
    return "Real time audio analysis - Backend"


class Predict(Resource):
    def get(self):
        global model
        import keras.models
        if model is None:
            model = keras.models.load_model("model/model.hdf5")
        return

    def post(self):
        from smd.data import preprocessing
        import smd.utils as utils
        global x_tot
        global memory

        args = predict_request.parse_args()
        audioBlob = args['audio']

        if os.path.isfile("data/audio.webm"):
            os.remove("data/audio.webm")
        if os.path.isfile("data/audio.wav"):
            os.remove("data/audio.wav")
        if os.path.isfile("data/audio_processed.wav"):
            os.remove("data/audio_processed.wav")

        with open('data/audio.webm', 'wb') as f:
            f.write(base64.b64decode(audioBlob))

        command = "avconv -y -i data/audio.webm data/audio.wav"
        os.system(command)
        command = "sox -v 0.99 data/audio.wav -r 22050 -c 1 -b 32 data/audio_processed.wav"
        os.system(command)

        audio = utils.load_audio("data/audio_processed.wav")

        spec = preprocessing.get_spectrogram(audio)

        x = test_data_processing(spec)
        if x_tot is None:
            x_tot = x
        else:
            x_tot = np.concatenate((x_tot, x))

        if x_tot.shape[0] < 250:
            input = x_tot.reshape((1, x_tot.shape[0], x_tot.shape[1]))
        else:
            input = x_tot[-250:, :].reshape((1, 250, x_tot.shape[1]))

        output = model.predict(input, batch_size=1, verbose=0)[0].T

        mean_speech = np.mean(np.around(output[0, -100:]))
        mean_music = np.mean(np.around(output[1, -100:]))

        speech = False
        music = False

        if mean_music > 0.5:
            music = True
        if mean_speech > 0.5:
            speech = True

        if not(music) and not(speech):
            anwser = "Nothing"
        elif music and not(speech):
            anwser = "Music"
        elif not(music) and speech:
            anwser = "Speech"
        else:
            anwser = "Speech & Music"

        print(mean_music, mean_speech)

        return anwser + " " + str(mean_music) + " " + str(mean_speech)


api.add_resource(Predict, '/predict')


if __name__ == "__main__":
    app.run(port=2222)

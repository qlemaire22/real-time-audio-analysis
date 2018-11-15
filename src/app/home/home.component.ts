import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as FileSaver from 'file-saver';

declare var MediaRecorder: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  URL: string = "http://localhost:2222/predict";
  time_timer: number = 100;
  time_request: number = 1000;

  private mediaRecorder;
  private isSending: boolean = false;
  public result: string = "Timer: 0.0<br>Loading.."
  public result_post: string = "";
  public start_button;
  public stop_button;
  public play_button;
  public save_button;
  private interval
  private time: number = 0;
  private blobList = [];
  private outputList = [];
  private playing: boolean = false;
  private audio;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    document.getElementById("header_about").classList.remove("active");
    document.getElementById("header_home").classList.add("active");

    this.start_button = document.getElementById("start");
    this.stop_button = document.getElementById("stop");
    this.play_button = document.getElementById("play");
    this.save_button = document.getElementById("save");

    this.stop_button.disabled = true;
    this.start_button.disabled = true;
    this.play_button.disabled = true;
    this.save_button.disabled = true;

    this.http.get(this.URL)
      .subscribe(
        _ => {
          this.updateResult("Timer: 0.0<br>Ready!")
          this.start_button.disabled = false;
        },
        error => {
          this.updateResult("Timer: 0.0<br>Impossible to set up the backend..")
          console.log("Error", error);
        }
      );

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        var options = {
          audioBitsPerSecond: 128000,
          mimeType: 'audio/webm'
        }
        this.mediaRecorder = new MediaRecorder(stream, options);
      });
  }

  startTimer() {
    var start = new Date().getTime();
    this.interval = setInterval(() => {
      this.time = (new Date().getTime() - start) / 1000;
      this.updateResult("Timer: " + this.time.toFixed(1) + "<br>Output: " + this.result_post)
    }, this.time_timer)
  }

  pauseTimer() {
    clearInterval(this.interval);
    this.time = 0;
  }

  playRecordedAudio() {
    const audioBlob = new Blob(this.blobList);
    const audioUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(audioUrl);

    this.play_button.disabled = true;
    this.stop_button.disabled = false;
    this.start_button.disabled = true;
    this.save_button.disabled = true;

    this.playing = true;

    this.audio.play();

    var _this = this
    var i = 0;
    this.result_post = ""
    this.time = 0;

    setInterval(() => {
      if (this.playing) {
        this.result_post = this.outputList[i];
        i = i + 1;
      }
    }, this.time_request)

    this.startTimer();

    this.audio.onended = function() {
      _this.pauseTimer()
      _this.play_button.disabled = false;
      _this.stop_button.disabled = true;
      _this.start_button.disabled = false;
      _this.save_button.disabled = false;
      _this.playing = false;
    };
  }

  startRecording() {
    console.log("Start to record..");

    this.result_post = "";
    this.blobList = [];
    this.outputList = []

    var _this = this;

    let send = function(audio) {
      _this.http.post(_this.URL,
        {
          "audio": audio
        })
        .subscribe(
          data => {
            _this.result_post = data.toString();
            _this.outputList.push(data.toString());
          },
          error => {
            _this.result_post = "request error";
            _this.outputList.push("request error");
            console.log("Error", error);
          }
        );
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        var options = {
          audioBitsPerSecond: 128000,
          mimeType: 'audio/webm'
        }
        this.mediaRecorder = new MediaRecorder(stream, options);

        this.play_button.disabled = true;
        this.stop_button.disabled = false;
        this.start_button.disabled = true;
        this.save_button.disabled = true;

        this.mediaRecorder.start();
        this.startTimer()
        this.isSending = true;

        this.mediaRecorder.addEventListener("dataavailable", event => {
          console.log("Sending data..")
          console.log(event.data)

          const reader = new FileReader();
          var data;

          reader.onloadend = function() {
            data = reader.result;
            data = data.split(',')[1];
            send(data);
          };
          this.blobList.push(event.data);
          reader.readAsDataURL(new Blob(this.blobList));
        });

        this.sendData();
      });
  }

  sendData() {
    setInterval(() => {
      if (this.isSending) {
        this.mediaRecorder.requestData();
      }
    }, this.time_request);
  }

  updateResult(data) {
    this.result = data
  }

  stopRecording() {
    if (this.playing) {
      this.pauseTimer()
      this.audio.pause();
      this.audio.currentTime = 0;
      this.play_button.disabled = false;
      this.stop_button.disabled = true;
      this.start_button.disabled = false;
      this.save_button.disabled = false;

      this.playing = false;
    } else {
      console.log("Stop recording..")

      this.pauseTimer()

      this.start_button.disabled = false;
      this.stop_button.disabled = true;
      this.play_button.disabled = false;
      this.save_button.disabled = false;


      this.mediaRecorder.stop();
      this.isSending = false;
    }
  }

  saveRecording() {
    const audioBlob = new Blob(this.blobList);
    FileSaver.saveAs(audioBlob, "audio.webm");

    var list = []

    for (var i = 0; i < this.outputList.length; i++) {
        list.push((((i + 1) * this.time_request) / 1000).toFixed(1) + " " + (((i + 2) * this.time_request) / 1000).toFixed(1) + "  " + this.outputList[i] + "\n");
    }

    let blob = new Blob(list, { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, "annotations.txt");

  }
}

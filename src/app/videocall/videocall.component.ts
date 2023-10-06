import { Component, ViewChild, ElementRef } from '@angular/core';
@Component({
  selector: 'app-videocall',
  templateUrl: './videocall.component.html',
  styleUrls: ['./videocall.component.css']
})
export class VideocallComponent {

  @ViewChild('roomInput') roomInput: ElementRef;
  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;
  @ViewChild('notification') notification: ElementRef;
  @ViewChild('entryModal') entryModal: ElementRef;

  peer: any = null;
  currentPeer: any = null;
  localStream: any = null;
  screenStream: any = null;
  screenSharing = false;

  constructor() { }

  createRoom() {
    console.log("Creating Room");
    const room = this.roomInput.nativeElement.value;
    if (room.trim() === '') {
      alert('Please enter a room number');
      return;
    }
    const room_id = "Orage" + room + "video";

    this.peer = new Peer(room_id);

    this.peer.on('open', (id) => {
      console.log("Peer Connected with ID: ", id);
      this.hideModal();

      navigator.getUserMedia({ video: true, audio: true }, (stream) => {
        this.localStream = stream;
        this.setLocalStream(this.localStream);
      }, (err) => {
        console.log(err);
      });

      this.notify("Waiting for peer to join.");
    });

    this.peer.on('call', (call) => {
      call.answer(this.localStream);
      call.on('stream', (stream) => {
        this.setRemoteStream(stream);
      });
      this.currentPeer = call;
    });
  }

  setLocalStream(stream) {
    const video = this.localVideo.nativeElement;
    video.srcObject = stream;
    video.muted = true;
    video.play();
  }

  setRemoteStream(stream) {
    const video = this.remoteVideo.nativeElement;
    video.srcObject = stream;
    video.play();
  }

  hideModal() {
    this.entryModal.nativeElement.hidden = true;
  }

  notify(msg) {
    const notification = this.notification.nativeElement;
    notification.innerHTML = msg;
    notification.hidden = false;
    setTimeout(() => {
      notification.hidden = true;
    }, 3000);
  }

  joinRoom() {
    console.log("Joining Room");
    const room = this.roomInput.nativeElement.value;
    if (room.trim() === '') {
      alert('Please enter a room number');
      return;
    }
    const room_id = "Orage" + room + "video";
    this.hideModal();
    this.peer = new Peer();

    this.peer.on('open', (id) => {
      console.log("Connected with Id: " + id);
      navigator.getUserMedia({ video: true, audio: true }, (stream) => {
        this.localStream = stream;
        this.setLocalStream(this.localStream);
        this.notify("Joining peer");
        const call = this.peer.call(room_id, stream);
        call.on('stream', (stream) => {
          this.setRemoteStream(stream);
        });
        this.currentPeer = call;
      }, (err) => {
        console.log(err);
      });
    });
  }

  startScreenShare() {
    if (this.screenSharing) {
      this.stopScreenSharing();
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
      this.screenStream = stream;
      const videoTrack = this.screenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        this.stopScreenSharing();
      };
      if (this.peer) {
        const sender = this.currentPeer.peerConnection.getSenders().find((s) => {
          return s.track.kind === videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
        this.screenSharing = true;
      }
    });
  }

  stopScreenSharing() {
    if (!this.screenSharing) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (this.peer) {
      const sender = this.currentPeer.peerConnection.getSenders().find((s) => {
        return s.track.kind === videoTrack.kind;
      });
      sender.replaceTrack(videoTrack);
    }
    this.screenStream.getTracks().forEach((track) => {
      track.stop();
    });
    this.screenSharing = false;
  }
}

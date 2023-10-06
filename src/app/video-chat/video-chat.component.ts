import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Peer from 'peerjs';


@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.css']
})
export class VideoChatComponent implements OnInit {
  @ViewChild('roomInput', { static: true }) roomInput!: ElementRef<HTMLInputElement>;
  @ViewChild('localVideo', { static: true }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('notification', { static: true }) notification!: ElementRef<HTMLElement>;
  @ViewChild('entryModal', { static: true }) entryModal!: ElementRef<HTMLElement>;

  PRE = 'Orage';
  SUF = 'video';
  room_id!: string;
  local_stream: MediaStream | undefined;
  screenStream: MediaStream | undefined;
  peer: Peer | null = null; // Use Peer from the imported library
  currentPeer: any = null;
  screenSharing = false;
  constructor() {}

  ngOnInit() {
    // Initialize your code here if needed
  }

  createRoom() {
    console.log('Creating Room');
    const roomInput = this.roomInput.nativeElement.value.trim();
    if (!roomInput) {
      alert('Please enter room number');
      return;
    }
    this.room_id = this.PRE + roomInput + this.SUF;
    this.peer = new Peer(this.room_id);
    this.peer.on('open', (id: any) => {
      console.log('Peer Connected with ID: ', id);
      this.hideModal();
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }) // Updated getUserMedia
        .then((stream: MediaStream) => {
          this.local_stream = stream;
          this.setLocalStream(this.local_stream);
        })
        .catch((err: any) => {
          console.log(err);
        });
      this.notify('Waiting for peer to join.');
    });
    this.peer.on('call', (call: any) => {
      if (this.local_stream) {
        call.answer(this.local_stream);
        call.on('stream', (stream: MediaStream) => {
          this.setRemoteStream(stream);
        });
        this.currentPeer = call;
      }
    });
  }

  setLocalStream(stream: MediaStream) {
    const video = this.localVideo.nativeElement;
    video.srcObject = stream;
    video.muted = true;
    video.play();
  }

  setRemoteStream(stream: MediaStream) {
    const video = this.remoteVideo.nativeElement;
    video.srcObject = stream;
    video.play();
  }

  hideModal() {
    this.entryModal.nativeElement.hidden = true;
  }

  notify(msg: string) {
    const notification = this.notification.nativeElement;
    notification.innerHTML = msg;
    notification.hidden = false;
    setTimeout(() => {
      notification.hidden = true;
    }, 3000);
  }

  joinRoom() {
    console.log('Joining Room');
    const room = this.roomInput.nativeElement.value.trim();
    if (!room) {
      alert('Please enter room number');
      return;
    }
    this.room_id = this.PRE + room + this.SUF;
    this.hideModal();
    this.peer = new Peer();
    this.peer.on('open', (id: string) => {
      console.log('Connected with Id: ' + id);
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }) // Updated getUserMedia
        .then((stream: MediaStream) => {
          this.local_stream = stream;
          this.setLocalStream(this.local_stream);
          this.notify('Joining peer');
          const call = this.peer!.call(this.room_id, stream); // Use non-null assertion here
          call.on('stream', (stream: MediaStream) => {
            this.setRemoteStream(stream);
          });
          this.currentPeer = call;
        })
        .catch((err: any) => {
          console.log(err);
        });
    });
  }
  

  startScreenShare() {
    if (this.screenSharing) {
      this.stopScreenSharing();
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream: MediaStream) => {
      this.screenStream = stream;
      const videoTrack = this.screenStream?.getVideoTracks()[0]; // Add a type guard here
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopScreenSharing();
        };
        if (this.peer) {
          const sender = this.currentPeer?.peerConnection.getSenders().find((s: any) => {
            return s.track.kind == videoTrack.kind;
          });
          sender?.replaceTrack(videoTrack); // Add type guards here
          this.screenSharing = true;
        }
        console.log(this.screenStream);
      }
    });
  }

  stopScreenSharing() {
    if (!this.screenSharing) return;
    const videoTrack = this.local_stream?.getVideoTracks()[0]; // Add a type guard here
    if (videoTrack) {
      if (this.peer) {
        const sender = this.currentPeer?.peerConnection.getSenders().find((s: any) => {
          return s.track.kind == videoTrack.kind;
        });
        sender?.replaceTrack(videoTrack); // Add type guards here
      }
      this.screenStream?.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      this.screenSharing = false;
    }
  }
}

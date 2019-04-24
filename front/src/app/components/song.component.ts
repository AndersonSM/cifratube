import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { saveAs } from 'file-saver';

const HALF_BAR_TIME = 5;

@Component({
  selector: 'app-song-component',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.css']
})

export class SongComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('timeline', {read: ElementRef}) timelineElem: ElementRef;
  @ViewChild('contentBar', {read: ElementRef}) barElem: ElementRef;
  @ViewChild('currentTime', {read: ElementRef}) currentTimeElem: ElementRef;
  title = 'tcc';
  private infoIntervalId;
  player: YT.Player;
  currentTime = 0.0;
  videoId = 'xPDkhW9iUPM';
  videoTitle = '';
  selectedMarkerTime = undefined;
  markersSet = new Set();
  markers = {};
  marker = {
    description: '',
    note: ''
  };
  hasMarker = false;
  visibleMarkers = [];

  ngAfterViewInit(): void {
    console.log(this.timelineElem);
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  saveMarker() {
    const time = this.getCurrentTime();
    this.getMarkerTimelinePosition(time);
    this.markers[time] = this.marker;
    this.markersSet.add(time);
    console.log('saved marker at ', this.getCurrentTime(), this.markers);
  }

  deleteMarker() {
    if (!this.selectedMarkerTime) {
      return;
    }
    delete this.markers[this.selectedMarkerTime];
    this.markersSet.delete(this.selectedMarkerTime);
    console.log('deleted marker at ', this.selectedMarkerTime, this.markers);
  }

  verifyInfoToShow(time?) {
    const timeToUse = time || this.getCurrentTime();
    this.currentTimeElem.nativeElement.style.left = this.getMarkerTimelinePosition(timeToUse) + 'px';

    if (!this.player || this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
      console.log('Video not playing');
      console.log('clear interval');
      clearInterval(this.infoIntervalId);
      this.infoIntervalId = null;
    }

    if (this.markers[timeToUse]) {
      this.marker = this.markers[timeToUse];
      this.hasMarker = true;
      // came from goto (clicked on marker)
      if (time) { this.selectedMarkerTime = timeToUse; }
      console.log('got marker');
    } else {
      this.hasMarker = false;
      this.marker = {
        description: '',
        note: ''
      };
    }
  }

  onPlayerReady(player) {
    this.player = player;
    this.player.setSize(800, 400);
    this.videoTitle = player.getVideoData().title;
    console.log('player instance:', player);
  }

  onStateChange(event) {
    console.log('Player state: ' + event.data);
    if (!this.player) { return; }

    if (this.player.getPlayerState() === YT.PlayerState.PAUSED && this.infoIntervalId) {
      console.log('Video paused');
      console.log('Clear interval');
      clearInterval(this.infoIntervalId);
      this.infoIntervalId = null;
    } else if (this.player.getPlayerState() === YT.PlayerState.PLAYING && !this.infoIntervalId) {
      console.log('Video playing');
      console.log('Set interval');
      this.infoIntervalId = setInterval(() => {
        this.verifyInfoToShow();
        this.updateVisibleMarkers();
      }, 100);
    }

    if (this.videoTitle !== event.target.getVideoData().title) {
      this.videoTitle = event.target.getVideoData().title;
    }
  }

  getCurrentTime() {
    const time = this.roundTime(this.player.getCurrentTime());
    return time;
  }

  goTo(time, event?) {
    if (event) { event.stopPropagation(); }
    if (time == null) {
      console.log('clicked timeline at pos', event.offsetX);
      this.goTo(this.getTimeByPosition(event.offsetX), event);
      return;
    }
    if (!this.markersSet.has(time)) {
      this.selectedMarkerTime = undefined;
    }

    console.log('goto', Number(time));
    this.player.seekTo(Number(time), true);
    // this.player.pauseVideo();
    this.updateVisibleMarkers(time);
    this.verifyInfoToShow(Number(time));
  }

  goToNextMarker() {
    let time;
    if (this.selectedMarkerTime) {
      time = this.selectedMarkerTime;
    } else {
      time = 0;
    }

    let next;

    this.markersSet.forEach((mTime) => {
      if (mTime > time) {
        if (!next || mTime < next) {
          next = mTime;
        }
      }
    });

    this.goTo(next ? next : this.getFirstMarker());
  }

  goToPreviousMarker() {
    let time;
    if (this.selectedMarkerTime) {
      time = this.selectedMarkerTime;
    } else {
      time = Number.POSITIVE_INFINITY;
    }

    let previous;

    this.markersSet.forEach((mTime) => {
      if (mTime < time) {
        if (!previous || mTime > previous) {
          previous = mTime;
          console.log(previous);
        }
      }
    });

    this.goTo(previous && previous !== time ? previous : this.getLastMarker());
  }

  getFirstMarker() {
    const markersArray = Array.from(this.markersSet);
    this.sortArrayAsc(markersArray);

    return markersArray.length ? markersArray[0] : 0;
  }

  getLastMarker() {
    const markersArray = Array.from(this.markersSet);
    this.sortArrayAsc(markersArray);

    return markersArray.length ? markersArray[markersArray.length - 1] : 0;
  }

  sortArrayAsc(array) {
    array.sort((a, b) => a - b);
  }

  // CONTENT BAR
  updateVisibleMarkers(time?) {
    const currentTime = time || this.getCurrentTime();
    const result = [];
    const markers = [];

    this.markersSet.forEach((mTime) => {
      if (mTime > currentTime - HALF_BAR_TIME && mTime < currentTime + HALF_BAR_TIME) {
        markers.push(mTime);
      }
    });

    this.sortArrayAsc(markers);

    let marker;
    for (const mTime of markers) {
      marker = this.markers[mTime];
      marker.time = mTime;
      marker.position = this.getMarkerBarPosition(mTime, currentTime);
      const factor = mTime < currentTime ? mTime - currentTime + HALF_BAR_TIME : Math.abs(mTime - currentTime - HALF_BAR_TIME);
      marker.size = 4.5 * factor / HALF_BAR_TIME;
      /*const barTime = mTime - currentTime + HALF_BAR_TIME;
      marker.size = (-0.045 * barTime * barTime) + (0.9 * barTime);*/
      console.log(marker);
      result.push(marker);
    }

    this.visibleMarkers = result;
  }

  getMarkerBarPosition(time, currentTime) {
    const barTime = time - currentTime + HALF_BAR_TIME;
    console.log('bartime', barTime);
    const markerPos = this.barElem.nativeElement.offsetWidth * barTime / HALF_BAR_TIME - (this.barElem.nativeElement.offsetWidth / 2);
    return markerPos;
  }

  // TIMELINE
  getMarkerTimelinePosition(time) {
    if (!this.player) { return 0; }
    const pos = this.timelineElem.nativeElement.offsetWidth * time / this.player.getDuration();
    return pos;
  }

  getTimeByPosition(pos) {
    const time = this.player.getDuration() * pos / this.timelineElem.nativeElement.offsetWidth;
    return this.roundTime(time);
  }

  roundTime(time) {
    return Math.round(time * 10) / 10;
  }

  // HELPERS
  saveFile() {
    const blob = new Blob([JSON.stringify({videoId: this.videoId, videoTitle: this.videoTitle, markers: this.markers})],
      {type: 'application/json'});
    // @ts-ignore
    saveAs(blob, this.videoTitle + '.json');
  }

  loadFile(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = (evt) => {
        // @ts-ignore
        const parsedJson = JSON.parse(evt.target.result);
        this.reset(parsedJson);
      };
      reader.onerror = (evt) => {
        console.log('error reading file');
      };
    }
  }

  reset(data?) {
    if (this.player) {
      this.player.pauseVideo();
    }
    if (this.infoIntervalId) {
      clearInterval(this.infoIntervalId);
      this.infoIntervalId = null;
    }
    this.currentTime = 0.0;
    this.selectedMarkerTime = undefined;
    this.marker = {
      description: '',
      note: ''
    };
    this.hasMarker = false;
    this.visibleMarkers = [];

    this.videoId = data ? data.videoId : this.videoId;
    this.videoTitle = data ? data.videoTitle : '';
    this.markers = data ? data.markers : {};

    this.markersSet.clear();
    for (const mTime in this.markers) {
      this.markersSet.add(mTime);
    }

    this.player.loadVideoById(this.videoId);
  }
}

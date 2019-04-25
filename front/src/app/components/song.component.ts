import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { saveAs } from 'file-saver';
import { SongService, AlertService, AuthenticationService } from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { Song } from '../models';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

const HALF_BAR_TIME = 5;

@Component({
  selector: 'app-song-component',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.css']
})

export class SongComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('timeline', {read: ElementRef}) timelineElem: ElementRef;
  @ViewChild('contentBar', {read: ElementRef}) chordBarElem: ElementRef;
  @ViewChild('currentTime', {read: ElementRef}) currentTimeElem: ElementRef;
  private infoIntervalId;
  player: YT.Player;
  currentTime = 0.0;
  selectedMarkerTime = undefined;
  markersSet = new Set();
  marker = {
    description: '',
    note: ''
  };
  hasMarker = false;
  visibleMarkers = [];
  canEdit = false;
  tab = 'info';
  songSubscription: Subscription;
  public song: Song;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private songService: SongService,
    private alertService: AlertService,
    private authenticationService: AuthenticationService,
  ) { }

  ngAfterViewInit(): void {
    console.log(this.timelineElem);
    this.route.params.subscribe((params) => {
      if (params.id) {
        this.tab = 'video';
        this.songSubscription = this.songService.getById(params.id).pipe(first()).subscribe((song: Song) => {
          console.log(song);
          this.song = song;
          this.setData();
          if (this.authenticationService.currentUserValue && this.authenticationService.currentUserValue._id === song.author._id) {
            this.canEdit = true;
          }
        });
      } else {
        console.log('no param id');
        this.tab = 'info';
        this.canEdit = true;
        this.song.author = this.authenticationService.currentUserValue;
      }
    });
  }

  ngOnInit(): void {
    this.song = new Song();
    this.song.title = '';
    this.song.artist = '';
    this.song.videoUrl = '';
    this.song.markers = {};
  }

  saveSong() {
    if (!this.verifySongInfo()) { return; }
    const markersWithTempData = this.song.markers;
    this.deleteMarkersTempData();
    if (!this.song._id) {
      this.songSubscription = this.songService.create(this.song).pipe(first()).subscribe(
        song => {
          this.alertService.success('Saved song with success.', true);
          console.log('Created');
          this.router.navigate(['/songs/', song._id]);
        },
        error => {
          this.alertService.error(error);
          this.song.markers = markersWithTempData;
        });
    } else {
      this.songSubscription = this.songService.update(this.song).pipe(first()).subscribe(
        song => {
          this.alertService.success('Saved song with success.', false);
          this.song.markers = markersWithTempData;
          console.log('Updated');
        },
        error => {
          this.alertService.error(error);
          this.song.markers = markersWithTempData;
        });
    }
  }

  ngOnDestroy(): void {
    if (this.songSubscription) {
      this.songSubscription.unsubscribe();
    }
  }

  setMarkerPopover(popover, time) {
    this.song.markers[time].popover = popover;
  }

  deleteMarkersTempData() {
    for (const time in this.song.markers) {
      delete this.song.markers[time].popover;
      delete this.song.markers[time].size;
      delete this.song.markers[time].position;
    }
  }

  closePopover(time, event?) {
    if (!event || event.key === 'Escape' || event.key === 'Enter') {
      this.song.markers[time].popover.close();
    }
  }

  closeAllPopovers() {
    for (const time in this.song.markers) {
      this.song.markers[time].popover.close();
    }
  }

  openPopover(time) {
    this.closeAllPopovers();
    if (this.song.markers[time]) { this.song.markers[time].popover.open(); }
  }

  saveMarker() {
    const time = this.getCurrentTime();
    this.getMarkerTimelinePosition(time);
    this.song.markers[time] = this.marker;
    this.markersSet.add(time);
    console.log('saved marker at ', this.getCurrentTime(), this.song.markers);
  }

  deleteMarker() {
    if (!this.selectedMarkerTime) {
      return;
    }
    delete this.song.markers[this.selectedMarkerTime];
    this.markersSet.delete(this.selectedMarkerTime);
    console.log('deleted marker at ', this.selectedMarkerTime, this.song.markers);
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

    if (this.song.markers[timeToUse]) {
      this.marker = this.song.markers[timeToUse];
      this.hasMarker = true;
      // came from goto (clicked on marker)
      if (time) { this.selectedMarkerTime = timeToUse; }
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
    if (this.song._id) { this.player.loadVideoById(this.song.videoId); }
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

    if (!this.song.videoTitle && event.target.getVideoData() && event.target.getVideoData().title) {
      this.song.videoTitle = event.target.getVideoData().title;
    }
    if (!this.song.videoId && event.target.getVideoData() && event.target.getVideoData().video_id) {
      this.song.videoId = event.target.getVideoData().video_id;
      this.tab = 'video';
    }
  }

  getCurrentTime() {
    const time = this.roundTime(this.player.getCurrentTime());
    return time;
  }

  goTo(time, event?) {
    this.openPopover(time);
    if (event) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
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
      marker = this.song.markers[mTime];
      marker.time = mTime;
      marker.position = this.getMarkerChordBarPosition(mTime, currentTime);
      const factor = mTime < currentTime ? mTime - currentTime + HALF_BAR_TIME : Math.abs(mTime - currentTime - HALF_BAR_TIME);
      marker.size = 4.5 * factor / HALF_BAR_TIME;
      /*const barTime = mTime - currentTime + HALF_BAR_TIME;
      marker.size = (-0.045 * barTime * barTime) + (0.9 * barTime);*/
      console.log(marker);
      result.push(marker);
    }

    this.visibleMarkers = result;
  }

  getMarkerChordBarPosition(time, currentTime) {
    const barTime = time - currentTime + HALF_BAR_TIME;
    const markerPos = this.chordBarElem.nativeElement.offsetWidth * barTime / HALF_BAR_TIME -
      (this.chordBarElem.nativeElement.offsetWidth / 2);
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

  verifySongInfo() {
    this.song.videoUrl = this.song.videoUrl.trim();
    this.song.title = this.song.title.trim();
    this.song.artist = this.song.artist.trim();
    if (this.song.videoUrl.length < 10 || this.song.title.length < 1 || this.song.artist.length < 1) {
      this.alertService.error('All fields are required.');
      this.tab = 'info';
      return false;
    }

    return true;
  }

  loadVideo() {
    if (!this.verifySongInfo()) { return; }

    if (this.song.videoId) {
      this.saveSong();
    } else {
      const videoId = this.getVideoId(this.song.videoUrl);
      if (!videoId) {
        this.alertService.error('Invalid YouTube URL.');
        return;
      }

      this.player.loadVideoById(videoId);
    }
  }

  getVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  setData() {
    this.currentTime = 0.0;
    this.selectedMarkerTime = undefined;
    this.marker = {
      description: '',
      note: ''
    };
    this.hasMarker = false;
    this.visibleMarkers = [];

    this.markersSet.clear();
    for (const mTime in this.song.markers) {
      this.markersSet.add(mTime);
    }

    if (this.player) { this.player.loadVideoById(this.song.videoId); }
  }

  formatSecondsToMinutesString(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds - min * 60);
    return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
  }
}

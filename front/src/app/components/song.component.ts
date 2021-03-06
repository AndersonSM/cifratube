import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  AfterViewChecked
} from '@angular/core';
import { saveAs } from 'file-saver';
import { SongService, AlertService, AuthenticationService } from '../services';
import { ActivatedRoute, Router } from '@angular/router';
import { Song } from '../models';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Options } from 'ng5-slider';
import { ShortcutInput, KeyboardShortcutsHelpComponent, AllowIn } from 'ng-keyboard-shortcuts';

const HALF_BAR_TIME = 2; // sec
const TOOLTIP_WIDTH = 50; // ps
const TIME_INDICATOR_LEFT_OFFSET = 7.5; // px
const UPDATE_INTERVAL = 100; // 100 ms
const DEFAULT_MARKER_COLOR = '#fcc107';

@Component({
  selector: 'app-song-component',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.scss']
})

export class SongComponent implements AfterViewInit, OnInit, OnDestroy, AfterViewChecked {
  // html elements
  @ViewChild('timeline', {read: ElementRef}) timelineElem: ElementRef;
  @ViewChild('timeTooltip', {read: ElementRef}) timeTooltipElem: ElementRef;
  @ViewChild('contentBar', {read: ElementRef}) chordBarElem: ElementRef;
  @ViewChild('currentTime', {read: ElementRef}) currentTimeElem: ElementRef;
  @ViewChild(KeyboardShortcutsHelpComponent) private shortcutsModal: KeyboardShortcutsHelpComponent;

  // timeline state
  private infoIntervalId;
  player: YT.Player;
  currentTime = 0.0;
  selectedMarkerTime = undefined;
  markersSet = new Set();
  marker = {
    description: '',
    note: '',
    color: DEFAULT_MARKER_COLOR
  };
  hasMarker = false;
  visibleMarkers = [];
  presetColors = [DEFAULT_MARKER_COLOR];

  // data state
  canEdit = false;
  tab = 'info';
  songSubscription: Subscription;
  public song: Song;

  // tools state
  isLooping = true;
  loopingRegion = {startTime: 0, endTime: Number.POSITIVE_INFINITY};
  isResetingLoop = false;
  isCopying = false;
  copyMarkers = {start: null, end: null};
  copyMessage = 'Selecione o primeiro marcador que você deseja copiar e pressione ';

  // config
  sliderOptions: Options = {
    floor: 0,
    ceil: 0,
    step: 0.1,
    translate: (value: number): string => {
      return '';
    }
  };
  halfBarTime = HALF_BAR_TIME;
  shortcuts: ShortcutInput[] = [];
  SELECTED_MARKER_COLOR = 'rgb(52, 58, 64)';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private songService: SongService,
    private alertService: AlertService,
    private authenticationService: AuthenticationService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    this.route.params.subscribe((params) => {
      if (params.id) {
        this.tab = 'video';
        this.songSubscription = this.songService.getById(params.id).pipe(first()).subscribe((song: Song) => {
          console.log(song);
          this.song = song;
          if (!this.song.markers) { this.song.markers = {}; }
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

    this.shortcuts.push(
      {
        key: 'cmd + right',
        label: 'Marcadores',
        description: 'Selecionar o próximo marcador',
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        command: e => this.goToNextMarker()
      },
      {
        key: 'cmd + left',
        preventDefault: true,
        label: 'Marcadores',
        description: 'Selecionar o marcador anterior',
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        command: e => this.goToPreviousMarker()
      },
      {
        key: 'cmd + S',
        preventDefault: true,
        label: 'Geral',
        description: 'Salvar a cifra',
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        command: e => this.saveSong()
      },
      {
        key: 'cmd + L',
        preventDefault: true,
        label: 'Geral',
        description: 'Ativar/Desativar loop',
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        command: e => this.isLooping = !this.isLooping
      },
      {
        key: 'cmd + D',
        preventDefault: true,
        label: 'Marcadores',
        description: 'Excluir o marcador selecionado',
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        command: e => this.deleteMarker()
      },
      {
        key: 'cmd + space',
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        label: 'Player',
        description: 'Parar/Continuar reprodução do vídeo se um campo de texto estiver selecionado',
        command: e => {
          if (!this.player) { return; }
          this.player.getPlayerState() === YT.PlayerState.PLAYING ? this.player.pauseVideo() : this.player.playVideo();
        }
      },
      {
        key: 'cmd + A',
        preventDefault: true,
        label: 'Marcadores',
        description: 'Adicionar marcador',
        command: e => this.saveMarker()
      },
      {
        key: 'esc',
        preventDefault: true,
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        label: 'Geral',
        description: 'Fechar menus',
        command: e => {
          this.closeAllPopovers();
          this.shortcutsModal.hide();
        }
      },
      {
        key: 'enter',
        allowIn: [AllowIn.Textarea, AllowIn.Input],
        label: 'Marcadores',
        description: 'Fechar menu de marcador',
        command: e => this.closeAllPopovers()
      },
      {
        key: 'space',
        preventDefault: true,
        label: 'Player',
        description: 'Parar/Continuar reprodução do vídeo',
        command: e => {
          if (!this.player) { return; }
          this.player.getPlayerState() === YT.PlayerState.PLAYING ? this.player.pauseVideo() : this.player.playVideo();
        }
      });
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  saveSong() {
    if (!this.verifySongInfo() || !this.canEdit) { return; }
    const songClone = this.cloneSong();
    if (!this.song._id) {
      this.songSubscription = this.songService.create(songClone).pipe(first()).subscribe(
        song => {
          this.alertService.success('A cifra foi salva com sucesso.', true);
          console.log('Created');
          this.router.navigate(['/songs/', song._id]);
        },
        error => {
          this.alertService.error(error);
        });
    } else {
      this.songSubscription = this.songService.update(songClone).pipe(first()).subscribe(
        song => {
          this.alertService.success('A cifra foi salva com sucesso.', false);
          console.log('Updated');
        },
        error => {
          this.alertService.error(error);
        });
    }
  }

  ngOnDestroy(): void {
    if (this.songSubscription) {
      this.songSubscription.unsubscribe();
    }
  }

  changeTab(tab) {
    this.closeAllPopovers();
    this.tab = tab;
  }

  setMarkerPopover(popover, time) {
    this.song.markers[time].popover = popover;
  }

  cloneSong() {
    const clone = new Song();
    clone.markers = {};
    clone.videoId = this.song.videoId;
    clone.artist = this.song.artist;
    clone.title = this.song.title;
    clone.author = this.song.author;
    clone.videoUrl = this.song.videoUrl;
    clone.videoTitle = this.song.videoTitle;
    clone.createdDate = this.song.createdDate;
    clone._id = this.song._id;

    for (const time in this.song.markers) {
      clone.markers[time] = {
        description: this.song.markers[time].description,
        note: this.song.markers[time].note,
        time: this.song.markers[time].time,
        color: this.song.markers[time].color
      };
    }

    return clone;
  }

  closePopover(time, event?) {
    if (!event || event.key === 'Escape' || event.key === 'Enter') {
      if (this.song.markers[time].popover) {
        this.song.markers[time].popover.close();
      }
    }
  }

  closeAllPopovers() {
    for (const time in this.song.markers) {
      if (this.song.markers[time].popover) {
        this.song.markers[time].popover.close();
      }
    }
  }

  openPopover(time) {
    this.closeAllPopovers();
    if (this.song.markers[time] && this.canEdit && this.song.markers[time].popover) {
      this.song.markers[time].popover.open();
    }

    // note input focus
    setTimeout(() => {
      const noteInputElement = document.getElementById('noteInput-' + time);
      if (noteInputElement) {
        noteInputElement.focus({
          preventScroll: true
        });
      }
    }, 200);
  }

  saveMarker() {
    if (!this.canEdit) { return; }

    const time = this.getCurrentTime();
    this.getMarkerTimelinePosition(time);
    this.song.markers[time] = this.marker;
    this.markersSet.add(time);
    this.updatePresetColors();
  }

  deleteMarker() {
    if (!this.selectedMarkerTime || !this.canEdit) {
      return;
    }
    this.closePopover(this.selectedMarkerTime);
    delete this.song.markers[this.selectedMarkerTime];
    this.markersSet.delete(this.selectedMarkerTime);
    this.selectedMarkerTime = undefined;
    this.updatePresetColors();
  }

  verifyInfoToShow(time?) {
    const timeToUse = time || this.getCurrentTime();

    if (this.isLooping && this.sliderOptions.ceil && (timeToUse < this.loopingRegion.startTime || timeToUse > this.loopingRegion.endTime)) {
      if (!this.isResetingLoop) {
        this.isResetingLoop = true;
        this.goTo(this.loopingRegion.startTime);
      }
      return;
    }

    this.currentTimeElem.nativeElement.style.left = (this.getMarkerTimelinePosition(timeToUse) - TIME_INDICATOR_LEFT_OFFSET) + 'px';

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
        note: '',
        color: DEFAULT_MARKER_COLOR
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
      }, UPDATE_INTERVAL);
      if (this.isLooping && (this.getCurrentTime() < this.loopingRegion.startTime ||
        this.getCurrentTime() > this.loopingRegion.endTime)) {
        this.goTo(this.loopingRegion.startTime);
      }
    }

    if (!this.sliderOptions.ceil && this.player.getDuration()) {
      this.setSliderCeil();
    }
    if (!this.song.videoTitle && event.target.getVideoData() && event.target.getVideoData().title) {
      this.song.videoTitle = event.target.getVideoData().title;
    }
    if (!this.song.videoId && event.target.getVideoData() && event.target.getVideoData().video_id) {
      this.song.videoId = event.target.getVideoData().video_id;
      this.tab = 'video';
    }
  }

  setSliderCeil() {
    const newOptions: Options = Object.assign({}, this.sliderOptions);
    newOptions.ceil = Number((this.player.getDuration() - 0.2).toFixed(1));
    this.sliderOptions = newOptions;
    this.loopingRegion.endTime = Number((newOptions.ceil - 1).toFixed(1));
  }

  getCurrentTime() {
    const time = this.roundTime(this.player.getCurrentTime());
    return time;
  }

  goTo(time, event?) {
    if (!this.player || (event && event.target.id === 'current-time-indicator')) { return; }

    this.openPopover(time);

    if (event) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
    if (time == null) {
      this.goTo(this.getTimeByPosition(event.offsetX), event);
      return;
    }
    if (this.isLooping && (time < this.loopingRegion.startTime || time > this.loopingRegion.endTime)) {
      this.goTo(this.loopingRegion.startTime);
      return;
    }
    if (this.markersSet.has(time)) {
      this.selectedMarkerTime = time;
    } else {
      this.selectedMarkerTime = undefined;
    }

    this.player.seekTo(Number(time), true);
    this.updateVisibleMarkers(time);
    this.verifyInfoToShow(Number(time));
    this.isResetingLoop = false;
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

  startCopy() {
    if (this.isCopying) {
      this.isCopying = false;
      this.copyMarkers = {start: null, end: null};
      this.copyMessage = 'Selecione o primeiro marcador que você deseja copiar e pressione ';
    } else {
      this.isCopying = true;
    }
  }

  selectCopyMarkerAndPaste() {
    if (!this.copyMarkers.start && !this.copyMarkers.end && !this.selectedMarkerTime || !this.isCopying) { return; }

    if (!this.copyMarkers.start) {
      this.copyMarkers.start = this.selectedMarkerTime;
      this.copyMessage = 'Selecione o último marcador que você deseja copiar e pressione ';
    } else if (!this.copyMarkers.end && this.selectedMarkerTime !== this.copyMarkers.start) {
      this.copyMarkers.end = this.selectedMarkerTime;
      this.copyMessage = 'Deixe o vídeo no tempo que você deseja colar os marcadores e pressione ';
    } else if (this.copyMarkers.start && this.copyMarkers.end) {
      this.paste();
    }

    this.selectedMarkerTime = undefined;
  }

  paste() {
    const selectedMarkers = [];
    this.markersSet.forEach((mTime) => {
      if (mTime >= this.copyMarkers.start && mTime <= this.copyMarkers.end) {
        selectedMarkers.push(mTime);
      }
    });
    this.sortArrayAsc(selectedMarkers);

    const firstMarkerTime = selectedMarkers[0];
    for (const time of selectedMarkers) {
      const pasteTime = this.roundTime(this.getCurrentTime() + time - firstMarkerTime);
      const markerToCopy = this.song.markers[time];
      this.song.markers[pasteTime] = { description: markerToCopy.description, note: markerToCopy.note, color: markerToCopy.color };
      this.markersSet.add(pasteTime);
    }

    this.isCopying = false;
    this.copyMarkers = {start: null, end: null};
    this.copyMessage = 'Selecione o primeiro marcador que você deseja copiar e pressione ';
  }

  sortArrayAsc(array) {
    array.sort((a, b) => a - b);
  }

  updateVisibleMarkers(time?) {
    const currentTime = time || this.getCurrentTime();
    const result = [];
    const markers = [];

    this.markersSet.forEach((mTime) => {
      if (mTime > currentTime - this.halfBarTime && mTime < currentTime + this.halfBarTime) {
        markers.push(mTime);
      }
    });

    this.sortArrayAsc(markers);

    let marker;
    for (const mTime of markers) {
      marker = this.song.markers[mTime];
      marker.time = mTime;
      marker.position = this.getMarkerChordBarPosition(mTime, currentTime);
      const factor = mTime < currentTime ? mTime - currentTime + this.halfBarTime : Math.abs(mTime - currentTime - this.halfBarTime);
      marker.size = 4.5 * factor / this.halfBarTime;
      marker.opacity = factor / this.halfBarTime;
      /*const barTime = mTime - currentTime + HALF_BAR_TIME;
      marker.size = (-0.045 * barTime * barTime) + (0.9 * barTime);*/
      result.push(marker);
    }
    this.visibleMarkers = result;
  }

  getMarkerChordBarPosition(time, currentTime) {
    const barTime = time - currentTime + this.halfBarTime;
    const markerPos = this.chordBarElem.nativeElement.offsetWidth * barTime / this.halfBarTime -
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
    if (!this.player) { return 0; }
    const time = this.player.getDuration() * pos / this.timelineElem.nativeElement.offsetWidth;
    return this.roundTime(time);
  }

  showTimeOnTimeline(event, time?, pos?) {
    if (event) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
    if ((!event || event.offsetX <= 0) && !time && !pos) { return; }

    this.timeTooltipElem.nativeElement.hidden = false;
    const leftPos = time ? this.getMarkerTimelinePosition(time) : pos ? this.trimPxAndConvertToNumber(pos) : event.offsetX;
    const formattedTime = this.formatSecondsToMinutesString(this.getTimeByPosition(leftPos));
    this.timeTooltipElem.nativeElement.firstChild.innerText = formattedTime;
    this.timeTooltipElem.nativeElement.style.left = (leftPos - TOOLTIP_WIDTH / 2) + 'px';
  }

  hideTimeOnTimeline(event) {
    this.timeTooltipElem.nativeElement.hidden = true;
  }

  roundTime(time) {
    return Math.round(time * 10) / 10;
  }

  verifySongInfo() {
    this.song.videoUrl = this.song.videoUrl.trim();
    this.song.title = this.song.title.trim();
    this.song.artist = this.song.artist.trim();
    if (this.song.videoUrl.length < 10 || this.song.title.length < 1 || this.song.artist.length < 1) {
      this.alertService.error('Todos os campos são obrigatórios.');
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
        this.alertService.error('Link do YouTube inválido.');
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
      note: '',
      color: DEFAULT_MARKER_COLOR
    };
    this.hasMarker = false;
    this.visibleMarkers = [];

    this.markersSet.clear();
    for (const mTime in this.song.markers) {
      if (!this.song.markers[mTime].color) {
        this.song.markers[mTime].color = DEFAULT_MARKER_COLOR;
      }
      this.markersSet.add(Number(mTime));
    }

    this.updatePresetColors();

    if (this.player) { this.player.loadVideoById(this.song.videoId); }
  }

  updatePresetColors() {
    const colors = new Set();
    for (const mTime in this.song.markers) {
      colors.add(this.song.markers[mTime].color);
    }

    this.presetColors = Array.from(colors);
  }

  formatSecondsToMinutesString(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds - min * 60);
    return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
  }

  trimPxAndConvertToNumber(pos) {
    return Number(pos.replace('px', ''));
  }
}

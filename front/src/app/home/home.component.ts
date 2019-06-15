import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { Song, User } from '../models';
import { SongService, AuthenticationService } from '../services';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User;
  currentUserSubscription: Subscription;
  songSubscription: Subscription;
  songs: Song[] = [];
  searched = false;
  query = '';

  constructor(
    private authenticationService: AuthenticationService,
    private songService: SongService
  ) {
    this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    this.loadLatestSongs();
  }

  ngOnDestroy() {
    this.currentUserSubscription.unsubscribe();
    this.songSubscription.unsubscribe();
  }

  private loadLatestSongs() {
    this.searched = false;
    this.songSubscription = this.songService.getLatest().pipe(first()).subscribe(songs => {
          this.songs = songs;
      });
  }

  search() {
    if (this.query.trim().length < 2) {
      this.loadLatestSongs();
      this.query = '';
      return;
    }

    this.searched = true;
    this.songSubscription = this.songService.search(this.query.trim()).pipe(first()).subscribe(songs => {
        this.songs = songs;
    });
  }
}

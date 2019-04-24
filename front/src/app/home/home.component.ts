import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { Song, User } from '../models';
import { SongService, AuthenticationService } from '../services';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User;
  currentUserSubscription: Subscription;
  songs: Song[] = [];

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
  }

  private loadLatestSongs() {
      this.songService.getLatest().pipe(first()).subscribe(songs => {
          this.songs = songs;
      });
  }
}

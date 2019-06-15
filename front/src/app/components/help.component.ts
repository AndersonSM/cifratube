import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { User } from '../models';
import { AuthenticationService } from '../services';

@Component({ templateUrl: 'help.component.html' })
export class HelpComponent implements OnDestroy {
  currentUser: User;
  currentUserSubscription: Subscription;

  constructor(
    private authenticationService: AuthenticationService,
  ) {
    this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    this.currentUserSubscription.unsubscribe();
  }
}

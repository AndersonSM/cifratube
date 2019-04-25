import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Song, User } from '../models';

@Injectable({ providedIn: 'root' })
export class SongService {
  constructor(private http: HttpClient) { }

  getLatest() {
    return this.http.get<Song[]>(`${environment.apiUrl}/songs`);
  }

  getById(id: string) {
    return this.http.get<Song>(`${environment.apiUrl}/songs/${id}`);
  }

  getByUser(user: User) {
    return this.http.get<Song[]>(`${environment.apiUrl}/users/${user._id}/songs`);
  }

  create(song: Song) {
    return this.http.post<Song>(`${environment.apiUrl}/songs`, song);
  }

  update(song: Song) {
    return this.http.put<Song>(`${environment.apiUrl}/songs/${song._id}`, song);
  }
}

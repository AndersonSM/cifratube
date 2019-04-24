import { User } from './user';

export class Song {
  _id: string;
  markers: any;
  author: User;
  title: string;
  artist: string;
  videoTitle: string;
  videoUrl: string;
  videoId: string;
  views: number;
  createdDate: Date;
}

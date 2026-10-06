export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  type: 'user' | 'admin' | 'auto';
}

export interface RoomUsers {
  room: string;
  users: string[];
}


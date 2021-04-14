import uuid
import json
import time

from tornado.ioloop import IOLoop
from tornado.websocket import WebSocketHandler

acquireLockMessageType = 127
releaseLockMessageType = 126
requestInitializedContentMessageType = 125
putInitializedContentMessageType = 124

class YjsRoom:
    def __init__(self):
        self.lock = None
        self.clients = {}
        self.content = bytes([])

class YJSEchoWS(WebSocketHandler):
    rooms = {}

    def open(self, guid):
        #print("[YJSEchoWS]: open", guid)
        cls = self.__class__
        self.id = str(uuid.uuid4())
        self.room_id = guid
        room = cls.rooms.get(self.room_id)
        if room == None:
            room = YjsRoom()
            cls.rooms[self.room_id] = room
        room.clients[self.id] = ( IOLoop.current(), self.hook_send_message )
        # Send SyncStep1 message (based on y-protocols)
        self.write_message(bytes([0, 0, 1, 0]), binary=True)

    def on_message(self, message):
        #print("[YJSEchoWS]: message, ", message)
        cls = self.__class__
        room = cls.rooms.get(self.room_id)
        if message[0] == acquireLockMessageType: # tries to acquire lock
            if room.lock == None or time.time() - room.lock > 10:
                lock = int(time.time())
                # print('Acquired new lock: ', lock)
                room.lock = lock
                # return acquired lock
                self.write_message(bytes([acquireLockMessageType]) + lock.to_bytes(4, byteorder = 'little'), binary=True)
        elif message[0] == releaseLockMessageType:
            releasedLock = int.from_bytes(message[1:], byteorder = 'little')
            # print("trying release lock: ", releasedLock)
            if room.lock == releasedLock:
                # print('released lock: ', room.lock)
                room.lock = None
        elif message[0] == requestInitializedContentMessageType:
            # print("client requested initial content")
            self.write_message(bytes([requestInitializedContentMessageType]) + room.content, binary=True)
        elif message[0] == putInitializedContentMessageType:
            # print("client put initialized content")
            room.content = message[1:]
        elif room:
            for client_id, (loop, hook_send_message) in room.clients.items() :
                if self.id != client_id :
                    loop.add_callback(hook_send_message, message)

    def on_close(self):
        #print("[YJSEchoWS]: close")
        cls = self.__class__
        room = cls.rooms.get(self.room_id)
        room.clients.pop(self.id)
        if len(room.clients) == 0 :
            cls.rooms.pop(self.room_id)
            # print("[YJSEchoWS]: close room " + self.room_id)

        return True

    def check_origin(self, origin):
        #print("[YJSEchoWS]: check origin")
        return True

    def hook_send_message(self, msg):
        self.write_message(msg, binary=True)

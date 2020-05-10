# Multiplayer CLI UNO 

A text based version of UNO (based on official UNO rules) played on the terminal with multiple other players online. 

#### Setup 
 * Download all the files except **Procfile** and **server.js**
 * All the players (max. 7) need to download the the files in their system
 * Open the terminal and go to the project repository
 * Then on the terminal run ```npm install``` to install all the dependencies
 
#### How to start the game
* One player needs to make a room for the other players to join, he/she will share the room ID with th other players so that they can join usng the room ID
* For making a room the player has to open the terminal and type ```node client.js -u {username} -n {number of players}```, the username can can be anything and number of players has to be from 2 to 7 (inclusive)
* A room ID is gengerated in the terminal which is to be shared between the players
* All the other players will then open their terminals and type ``` node client.js -u {username} -r {room ID}```
* That's it, the game will start

#### Tech Used
* Node.js 
* Socket.io (for realtime communication)
* Commander.js (for parsing command line options)
* Chalk (for coloring the output on the terminal)

Even though the development of the game is completed, there is still a lot of scope for improvement of the game and a ton of features can be added. Feel free to raise an issue and contribute.

    

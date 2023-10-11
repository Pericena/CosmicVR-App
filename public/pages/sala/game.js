var socket = io(); // Configura tu conexión de Socket.io

var keyboard = {};
var players = {};
var numPlayers = 0;
var playerId;
var playerName;
var FPS = 60;

/* Canvas, images, and rendering */
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;
document.body.appendChild(canvas);

var playerReady = false;
var playerImage = new Image();
playerImage.onload = function () {
  playerReady = true;
};
playerImage.src = 'sonido/images/player1.png';

var enemyReady = false;
var enemyImage = new Image();
enemyImage.onload = function () {
  enemyReady = true;
};
enemyImage.src = 'sonido/images/enemy2.png';

var renderPlayers = function () {
  for (var player in players) {
    if (players[player].id == playerId) {
      ctx.drawImage(playerImage, players[player].x, players[player].y);
    } else {
      ctx.drawImage(enemyImage, players[player].x, players[player].y);
    }

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.font = '14px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(players[player].name, players[player].x + 24, players[player].y - 18);
  }
}

var renderStats = function () {
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.font = '18px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Users online: ' + numPlayers, 10, 10);
}

var render = function () {
  if (playerReady && enemyReady) {
    renderPlayers();
    renderStats();
  }
};

/* Keyboard events */
addEventListener('keydown', function (event) {
  keyboard[event.keyCode] = true;

  if (event.keyCode == 13 && !playerName) {
    startConnection();
  }
}, false);

addEventListener('keyup', function (event) {
  delete keyboard[event.keyCode];
}, false);

/* Socket events */
socket.on('login', function (data) {
  players = data.players;
  numPlayers = data.numPlayers;
  playerId = data.playerId;
  loop();
});

socket.on('player joined', function (data) {
  players[data.player.id] = data.player;
  numPlayers = data.numPlayers;
});

socket.on('player left', function (data) {
  delete players[data.playerId];
  numPlayers = data.numPlayers;
});

socket.on('update positions', function (data) {
  players = data.players;
});

/* Game loop */
var loop = function () {
  var now = Date.now();
  render();
  socket.emit('update keyboard', keyboard);
  requestAnimationFrame(loop);
};

/* Start connection */
var startConnection = function () {
  var startEl = document.getElementById('start');
  var playerEl = document.getElementById('player');
  playerName = playerEl.value;
  if (playerName) {
    document.body.removeChild(startEl);
    socket.emit('add player', playerName);
  }

  // Reproducir la música de fondo
  var backgroundMusic = document.getElementById('backgroundMusic');
  backgroundMusic.volume = 0.5; // Ajusta el volumen según tus preferencias

  var chatContainer = document.getElementById('chat-container');
  var chatInput = document.getElementById('chat-input');
  var chatMessages = document.getElementById('chat-messages');

  function sendMessage(message) {
    // Envia el mensaje al servidor y muestra el mensaje localmente
    socket.emit('chat message', message);
    displayMessage('Tú', message);
  }

  function displayMessage(sender, message) {
    var messageElement = document.createElement('p');
    messageElement.textContent = sender + ': ' + message;
    chatMessages.appendChild(messageElement);

    // Scroll automático hacia el nuevo mensaje
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Escuchar eventos de teclado para enviar mensajes cuando se presione Enter
  chatInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      var message = chatInput.value.trim();
      if (message !== '') {
        sendMessage(message);
        chatInput.value = '';
      }
    }
  });

  // Escuchar eventos de chat del servidor
  socket.on('chat message', function (data) {
    displayMessage(data.sender, data.message);
  });

  // Iniciar el bucle de juego
  loop();
}


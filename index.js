const file = require('fs');
const path = require('path');
const gpio = require('rpi-gpio');
const PIN_OUT = 35;
const Lcd = require('lcd');
const lcd = new Lcd({rs: 25, e: 24, data: [23, 17, 18, 22], cols: 16, rows: 2});

gpio.setup(PIN_OUT, gpio.DIR_OUT, (err, val) => {
  if(err) console.log(err, val);
});

lcd.on('ready', _ => {
  console.log('LCD is UP!!');
  setTimeout(_ => {
    lcd.setCursor(0, 0);
    lcd.print('Waiting for\n connection');
    setInterval(_ => {
      lcd.scrollDisplayLeft();
    }, 1000);
  }, 1000);
});
 
process.on('SIGINT', _ => {
  lcd.close();
  process.exit();
});

const commands = {
    DC: (link, ws) => {
        const file_path = path.resolve(__dirname, 'data.json');
        const fileData = file.readFileSync(file_path);
        const parsedData = JSON.parse(fileData);
        parsedData.discord_link = link;
        file.writeFileSync(file_path, JSON.stringify(parsedData));
        const messagePayload = {
            type: 'DC',
            massage: 'Successfully Added DC Link'
        };
        let ok = ws.send(JSON.stringify(messagePayload, 2, 3));
    },
    chat: (message, ws) => {
      const file_path = path.resolve(__dirname, 'data.json');
      const fileData = file.readFileSync(file_path);
      const parsedData = JSON.parse(fileData);
      parsedData.message = message;
      file.writeFileSync(file_path, JSON.stringify(parsedData));
      const messagePayload = {
        type: 'chat',
        message: parsedData.message,
      }
      let ok = ws.send(JSON.stringify(messagePayload, 2, 2));
    },
    setup: (ws) => {
      const file_path = path.resolve(__dirname, 'data.json');
      const fileData = file.readFileSync(file_path);
      const parsedData = JSON.parse(fileData);
      const messagePayload = {
        type: 'setup',
        message: parsedData,
      };
      let ok = ws.send(JSON.stringify(messagePayload, 2, 2));
    },
}

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 7171 });

wss.on('connection', (ws) => {
  commands.setup(ws);
  ws.on('message', (message) => {
    if (process.platform !== 'win32') gpio.write(PIN_OUT, true);

    const data = String.fromCharCode.apply(null, new Uint8Array(message));
    const parsedData = JSON.parse(data);
    
    const command = commands[parsedData.type];
    if (!command) ws.send(JSON.stringify({
        message: 'COMMAND NOT FOUND',
        type: 'ERR',
    }, 2, 2));
    else {
      command(parsedData.message, ws);
    }
    if (process.platform !== 'win32') gpio.write(PIN_OUT, false, (err) => {
      if(err) console.log(err);
    });
  });
});



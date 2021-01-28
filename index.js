const file = require('fs');
const path = require('path');
const gpio = require('rpi-gpio');
const PIN_OUT = 36;

// gpio.setup(PIN_OUT, gpio.DIR_OUT, (err, val) => {
//   if(err) console.log(err, val);
// });

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

require('uWebSockets.js').App({
  }).ws('/*', {
    
    idleTimeout: 0,
    maxBackpressure: 1024,
    maxPayloadLength: 512,
  
    message: (ws, message, isBinary) => {

        // gpio.write(PIN_OUT, true);

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
        // gpio.write(PIN_OUT, false);
    },
    
    open: (ws) => {
      commands.setup(ws);
    },
    
  }).get('/*', (res, req) => {
  
    /* It does Http as well */
    res.writeStatus('200 OK').writeHeader('IsExample', 'Yes').end('Hello there!');
    
  }).listen(7171, (listenSocket) => {
  
    if (listenSocket) {
      console.log('Listening to port 9001');

    }
    
  });
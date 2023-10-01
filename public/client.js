$(document).ready(function () {
  let $sessionKeyInput = $('#sessionKey');
  let $joinButton = $('#joinButton');
  let $fileInput = $('#fileInput');
  let $uploadButton = $('#uploadButton');

  let sessionKey = null;
  let ws = null;

  $joinButton.on('click', function () {
    sessionKey = $sessionKeyInput.val().trim();
    if (sessionKey) {
      ws = new WebSocket('ws://localhost:3000');
      ws.onopen = function () {
        ws.send(JSON.stringify({ type: 'join', sessionKey }));
        $joinButton.prop('disabled', true);
        $uploadButton.prop('disabled', false);
      };

      ws.onmessage = function (event) {
        let data = JSON.parse(event.data);

        if (data.type === 'file') {
          let { name, type, data: arrayBufferData, type_client } = data.payload;

          if (type_client == "sender") {
            // Отображаем заглушку у отправителя
            // console.log(name);
            // Создание элемента <a> для скачивания файла

            
            let sender_plug = 
            `<div class="session-element">
              <img class="file-ico" src="file.svg" alt="">
              <p class="file-name">${name}</p>
              <p class="file-status">Загружен</p>
            </div>`

            // Добавление элемента <p> в DOM
            $(".session-list").append(sender_plug);
          } else {
            // Преобразование массива байтов обратно в ArrayBuffer
            let arrayBuffer = new Uint8Array(arrayBufferData).buffer;

            // Создание Blob
            let blob = new Blob([arrayBuffer], { type });

            // Создание URL для Blob
            let url = URL.createObjectURL(blob);

            // Создание элемента <a> для скачивания файла

            
            let sender_plug = 
            `<div class="session-element">
              <img class="file-ico" src="file.svg" alt="">
              <p class="file-name">${name}</p>
              <a href="${url}" download="${name} class="btn-download">Скачать</a>
            </div>`

            // Добавление элемента <a> в DOM
            $(".session-list").append(sender_plug);
          }
        }
      };
    }
  });

  $uploadButton.on('click', function () {
    let file = $fileInput[0].files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = function (e) {
        let arrayBuffer = e.target.result;
        console.log('Отправка файла:', arrayBuffer);
        console.log('Размер буфера:', arrayBuffer.byteLength);
        let fileName = file.name;
        let fileType = file.type;
        ws.send(JSON.stringify({ type: 'file', sessionKey, payload: { name: fileName, type: fileType, data: Array.from(new Uint8Array(arrayBuffer)) } }));
      };
      reader.readAsArrayBuffer(file);
    }
  });
});

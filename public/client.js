$(document).ready(function () {
  let $sessionKeyInput = $('#sessionKey');
  let $joinButton = $('#joinButton');
  let $fileInput = $('#fileInput');
  let $uploadButton = $('#uploadButton');

  let sessionKey = null;
  let ws = null;
  let fileChunks = {}; // Переменная для хранения частей файла

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
        
        console.log("data_ws", data)

        if (data.type === 'file') {
          let { name, type, chunk, index, totalChunks, type_client } = data.payload;

          console.log("file", data.payload)

          console.log("type_client", type_client)

          if (type_client === "sender") {
            // Отображаем заглушку у отправителя
            let sender_plug =
              `<div class="session-element" name="${name}">
                  <img class="file-ico" src="file.svg" alt="">
                  <p class="file-name">${name}</p>
                  <p class="file-status">Загружен</p>
                </div>`

            // Добавление элемента <p> в DOM
            $(".session-list").append(sender_plug);
          } else {
            // Преобразование массива байтов обратно в Uint8Array
            let uint8Array = new Uint8Array(chunk);

            if (index === 0) {
              // Если это первая часть файла, создаем новый объект Blob
              fileChunks[name] = [uint8Array];
              let fileDownloadButton = `<a href="#" download="${name}" class="btn-download">Скачать</a>`;

              // Создаем элемент для отображения скачивания файла
              let receiver_plug =
                `<div class="session-element" name="${name}">
                  <img class="file-ico" src="file.svg" alt="">
                  <p class="file-name">${name}</p>
                  <p class="file-status">Загружается...</p>
                  <div class="file-download-links">
                    ${fileDownloadButton}
                  </div>
                </div>`

              // Добавление элемента в DOM
              $(".session-list").append(receiver_plug);
            } else {
              // Если это не первая часть файла, добавляем часть в существующий массив
              if (!fileChunks[name]) {
                fileChunks[name] = [];
              }
              fileChunks[name].push(uint8Array);
            }

            if (index === totalChunks - 1) {
              // Если это последняя часть файла, создаем Blob из всех частей и создаем URL
              let finalBlob = new Blob(fileChunks[name], { type });
              let url = URL.createObjectURL(finalBlob);

              // Обновляем ссылку для скачивания в соответствующем элементе
              $(".session-element[name='img_png.png'] .btn-download").attr("href", url)
              $(".session-element[name='img_png.png'] .btn-download").attr("download", name)

              $(`.file-name:contains(${name})`).siblings(".file-status").text("Загружен");

              console.log("get all chunks", url)
              console.log("fileChunks", fileChunks)

            }
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


$(document).on('click', '.btn-download', function () {
  console.log('Ссылка для скачивания была нажата.');
});